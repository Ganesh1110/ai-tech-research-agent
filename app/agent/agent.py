from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.agent.memory import ResearchMemory
from app.monitoring.metrics import MetricsCollector
from app.agent.planner import Planner
from app.agent.schemas import (
    AgentResult,
    AgentStatus,
    AgentStep,
    ResearchPlan,
    ToolCall,
    ToolResult,
)
from app.agent.tools import TOOL_REGISTRY
from app.config import settings
from app.llm.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

EXECUTION_PROMPT = """You are an autonomous research agent executing a research plan.

RESEARCH OBJECTIVE: {objective}

CURRENT PLAN:
{plan}

CURRENT CONTEXT (findings so far):
{context}

AVAILABLE TOOLS:
{tools}

PREVIOUS STEPS: {previous_steps}

Based on the current context and findings, decide what to do next:

1. If you have enough information to answer the objective, return a final answer.
2. If you need more information, call one or more tools.
3. If a tool failed, try a different approach or tool.

Return ONLY a valid JSON object with these exact fields:
- "thought": your reasoning about what to do next
- "status": one of "planning", "executing", "observing", "replanning", "completed", "failed"
- "tool_calls": list of tool calls to make (empty if completed/failed)
  - Each tool call needs: "tool" (name), "arguments" (dict), "reason" (why)
- "observation": summary of what you learned from previous results (if any)
- "is_final": true if this is the final answer, false otherwise
- "final_answer": the complete answer if is_final is true, otherwise empty string

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks."""


class AutonomousAgent:

    def __init__(
        self,
        model: Optional[str] = None,
        max_steps: int = 5,
        metrics_collector: Optional[MetricsCollector] = None,
    ):

        self.model = model or settings.OLLAMA_MODEL
        self.max_steps = max_steps
        self.client = OllamaClient(
            model=self.model,
            base_url=settings.OLLAMA_BASE_URL,
        )
        self.planner = Planner(model=self.model)
        self.tool_registry = TOOL_REGISTRY
        self.metrics = metrics_collector or MetricsCollector()

    def _call_llm(
        self,
        prompt: str,
        system_prompt: str,
    ) -> str:

        import httpx

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "format": "json",
        }

        with httpx.Client(timeout=120) as client:

            response = client.post(
                f"{self.client.base_url}/api/chat",
                json=payload,
            )

            response.raise_for_status()

            data = response.json()

        return data.get("message", {}).get("content", "")

    def _parse_llm_json(
        self,
        content: str,
    ) -> Dict[str, Any]:

        import json
        import re

        try:

            return json.loads(content)

        except json.JSONDecodeError:

            match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)

            if match:

                try:

                    return json.loads(match.group(1))

                except json.JSONDecodeError:

                    pass

            return {}

    def _execute_tool_calls(
        self,
        tool_calls: List[ToolCall],
    ) -> List[ToolResult]:

        results = []

        for tool_call in tool_calls:

            tool_start = time.time()

            tool = self.tool_registry.get_tool(tool_call.tool)

            if not tool:

                latency = time.time() - tool_start

                self.metrics.record_tool_call(

                    tool=tool_call.tool,

                    success=False,

                    latency_seconds=latency,

                    arguments=tool_call.arguments,

                    error=f"Unknown tool: {tool_call.tool}",

                )

                results.append(

                    ToolResult(

                        tool=tool_call.tool,

                        success=False,

                        error=f"Unknown tool: {tool_call.tool}",

                    )

                )

                continue

            try:

                import inspect

                sig = inspect.signature(tool)

                valid_kwargs = {

                    k: v

                    for k, v in tool_call.arguments.items()

                    if k in sig.parameters

                }

                result = tool(**valid_kwargs)

                latency = time.time() - tool_start

                if hasattr(result, "to_dict"):

                    data = result.to_dict()

                    results.append(

                        ToolResult(

                            tool=tool_call.tool,

                            success=data.get("success", False),

                            data=data.get("data"),

                            error=data.get("error"),

                        )

                    )

                    self.metrics.record_tool_call(

                        tool=tool_call.tool,

                        success=data.get("success", False),

                        latency_seconds=latency,

                        arguments=tool_call.arguments,

                        error=data.get("error"),

                    )

                else:

                    results.append(

                        ToolResult(

                            tool=tool_call.tool,

                            success=True,

                            data=result,

                        )

                    )

                    self.metrics.record_tool_call(

                        tool=tool_call.tool,

                        success=True,

                        latency_seconds=latency,

                        arguments=tool_call.arguments,

                    )

            except Exception as error:

                latency = time.time() - tool_start

                logger.exception(

                    "Tool %s failed: %s",

                    tool_call.tool,

                    error,

                )

                results.append(

                    ToolResult(

                        tool=tool_call.tool,

                        success=False,

                        error=str(error),

                    )

                )

                self.metrics.record_tool_call(

                    tool=tool_call.tool,

                    success=False,

                    latency_seconds=latency,

                    arguments=tool_call.arguments,

                    error=str(error),

                )

        return results

    def run(
        self,
        objective: str,
    ) -> AgentResult:

        if not self.client.is_available():

            return AgentResult(

                objective=objective,

                status=AgentStatus.FAILED,

                final_answer=(

                    "Ollama is not available. Start it with 'ollama serve'."

                ),

                completed_at=datetime.now().isoformat(),

            )

        memory = ResearchMemory(objective=objective)

        steps: List[AgentStep] = []

        logger.info("Agent planning: %s", objective)

        self.metrics.start_run(objective=objective)

        plan = self.planner.plan(

            objective=objective,

            tool_descriptions=self.tool_registry.describe_tools(),

        )

        memory.add_step(

            AgentStep(

                step_number=0,

                status=AgentStatus.PLANNING,

                thought=f"Created plan with {len(plan.subtasks)} subtasks",

                plan=plan.subtasks,

                timestamp=datetime.now().isoformat(),

            )

        )

        final_answer = None

        status = AgentStatus.EXECUTING

        for step_num in range(1, self.max_steps + 1):

            logger.info("Agent step %s/%s", step_num, self.max_steps)

            step_start_time = time.time()

            context = memory.get_context_summary()

            previous_steps_summary = "\n".join(

                f"Step {s.step_number}: {s.status.value} - {s.thought or ''}"

                for s in steps[-5:]

            )

            prompt = EXECUTION_PROMPT.format(

                objective=objective,

                plan="\n".join(f"- {t}" for t in plan.subtasks),

                context=context,

                tools=self.tool_registry.describe_tools(),

                previous_steps=previous_steps_summary or "None yet",

            )

            from app.llm.prompts import SYSTEM_PROMPT

            content = self._call_llm(

                prompt=prompt,

                system_prompt=SYSTEM_PROMPT,

            )

            decision = self._parse_llm_json(content)

            if not decision:

                logger.warning(

                    "Step %s: Failed to parse LLM decision",

                    step_num,

                )

                status = AgentStatus.REPLANNING

                continue

            thought = decision.get("thought", "")

            step_status = AgentStatus(

                decision.get("status", "executing")

            )

            observation = decision.get("observation", "")

            is_final = decision.get("is_final", False)

            final_answer_text = decision.get("final_answer", "")

            if not isinstance(final_answer_text, str):

                import json

                final_answer_text = json.dumps(final_answer_text, indent=2)


            tool_calls_data = decision.get("tool_calls", [])

            tool_calls = []

            for tc in tool_calls_data:

                if not isinstance(tc, dict):

                    continue

                tool_calls.append(

                    ToolCall(

                        tool=tc.get("tool", ""),

                        arguments=tc.get("arguments", {}),

                        reason=tc.get("reason", ""),

                    )

                )

            tool_results: List[ToolResult] = []

            if tool_calls:

                tool_results = self._execute_tool_calls(tool_calls)

                for result in tool_results:

                    if result.success and result.data is not None:

                        memory.add_finding(

                            {

                                "tool": result.tool,

                                "data": result.data,

                                "timestamp": datetime.now().isoformat(),

                            }

                        )

            step = AgentStep(

                step_number=step_num,

                status=step_status,

                thought=thought,

                tool_calls=tool_calls,

                tool_results=tool_results,

                observation=observation,

                timestamp=datetime.now().isoformat(),

            )

            steps.append(step)

            memory.add_step(step)

            step_latency = time.time() - step_start_time

            self.metrics.record_step(

                step_number=step_num,

                status=step_status.value,

                thought=thought,

                latency_seconds=step_latency,

                observation=observation,

            )

            self.metrics.record_sources(memory.sources)

            if is_final or step_status == AgentStatus.COMPLETED:

                status = AgentStatus.COMPLETED

                final_answer = final_answer_text or observation

                break

            if step_status == AgentStatus.FAILED:

                status = AgentStatus.FAILED

                final_answer = final_answer_text or "Agent failed"

                break

        if not final_answer:

            final_answer = self._synthesize_findings(objective, memory)

        self.metrics.record_sources(memory.sources)

        self.metrics.finish_run(status=status.value)

        return AgentResult(

            objective=objective,

            status=status,

            steps=steps,

            final_answer=final_answer,

            sources=memory.sources,

            total_steps=len(steps),

            completed_at=datetime.now().isoformat(),

            metrics=self.metrics.to_dict(),

        )

    def _synthesize_findings(
        self,
        objective: str,
        memory: ResearchMemory,
    ) -> str:

        """Generate a final answer from collected findings when the loop ends."""

        if not memory.findings:

            return (

                "No relevant research items found in the database for this objective."

            )

        source_index: Dict[str, int] = {}

        for idx, source in enumerate(memory.sources, 1):

            source_index[source["url"]] = idx

        lines = [

            f"Research Objective: {objective}",

            f"Sources consulted: {len(memory.sources)}",

            "",

            "Key Findings:",

        ]

        seen_urls: set = set()

        item_counter = 1

        for finding in memory.findings[:10]:

            data = finding.get("data", {})

            items_to_show: List[Dict[str, Any]] = []

            if isinstance(data, list):

                for item in data:

                    if isinstance(item, dict):

                        url = item.get("url", "")

                        if url and url in seen_urls:

                            continue

                        items_to_show.append(item)

                        if url:

                            seen_urls.add(url)

            elif isinstance(data, dict):

                url = data.get("url", "")

                if url and url in seen_urls:

                    pass

                else:

                    items_to_show.append(data)

                    if url:

                        seen_urls.add(url)

            for item in items_to_show[:3]:

                title = item.get("title", "Unknown")

                source_name = item.get("source", "unknown")

                score = item.get("relevance_score")

                summary = item.get("summary", "")

                url = item.get("url", "")

                cite = f" [{source_index.get(url, item_counter)}]" if url else ""

                score_str = f" (relevance: {score}/100)" if score else ""

                lines.append(

                    f"{item_counter}. {title} [{source_name}]{score_str}{cite}"

                )

                if summary:

                    lines.append(f"   {summary[:200]}")

                item_counter += 1

        lines.append("")

        lines.append("Sources:")

        for source in memory.sources:

            idx = source_index[source["url"]]

            title = source.get("title", "Unknown")

            url = source.get("url", "")

            source_name = source.get("source", "unknown")

            score = source.get("relevance_score")

            score_str = f" (relevance: {score}/100)" if score else ""

            lines.append(

                f"[{idx}] {title} [{source_name}]{score_str}"

            )

            lines.append(f"     {url}")

        return "\n".join(lines)


__all__ = ["AutonomousAgent"]