from typing import List, Optional

from pydantic import BaseModel, Field


class ResearchAnalysis(BaseModel):
    summary: str = Field(
        description="Concise technical summary of the research item (2-4 sentences)"
    )
    category: str = Field(
        description="Research domain category (e.g., Agentic AI, LLM, Automation, Developer Tools)"
    )
    relevance_score: int = Field(
        ge=0,
        le=100,
        description="Relevance to AI tech research from 0-100",
    )
    technical_value_score: int = Field(
        ge=0,
        le=100,
        description="Technical implementation value from 0-100",
    )
    novelty_score: int = Field(
        ge=0,
        le=100,
        description="Novelty/originality from 0-100",
    )
    key_topics: List[str] = Field(
        default_factory=list,
        description="Key technologies, frameworks, and concepts mentioned",
    )
    technologies: List[str] = Field(
        default_factory=list,
        description="Specific tools, libraries, languages, and platforms",
    )
    implementation_ideas: List[str] = Field(
        default_factory=list,
        description="Practical project or implementation ideas",
    )
    limitations: List[str] = Field(
        default_factory=list,
        description="Known limitations, risks, or drawbacks",
    )
    why_it_matters: str = Field(
        description="Why this research is important (1-2 sentences)"
    )


class IntelligenceResult(BaseModel):
    analysis: ResearchAnalysis
    model_used: str
    processed_at: str