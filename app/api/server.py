"""Phase 6.1 — FastAPI application server."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.database.db import create_tables


def create_app() -> FastAPI:

    create_tables()

    app = FastAPI(

        title="AI Tech Research Agent API",

        description="Autonomous AI/LLM research platform with multi-agent orchestration and RAG knowledge base.",

        version="1.0.0",

    )

    app.add_middleware(

        CORSMiddleware,

        allow_origins=["*"],

        allow_credentials=True,

        allow_methods=["*"],

        allow_headers=["*"],

    )

    app.include_router(router, prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


__all__ = ["create_app", "app"]
