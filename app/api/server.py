"""Phase 6.1 — FastAPI application server."""

import logging
import secrets
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import settings
from app.database.db import create_tables

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    create_tables()

    app = FastAPI(
        title="AI Tech Research Agent & Founder OS API",
        description="Autonomous AI/LLM research platform, startup intelligence engine, and personal growth OS.",
        version="2.0.0",
    )

    # Security: Configure CORS accurately
    origins = settings.CORS_ORIGINS
    allow_all = "*" in origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all else origins,
        allow_credentials=not allow_all,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Security Headers & API Key Authentication Middleware
    @app.middleware("http")
    async def security_middleware(request: Request, call_next):
        # 1. API Key Authentication (enforced only when API_KEY is set in settings)
        if settings.API_KEY:
            public_paths = {"/api/health", "/docs", "/redoc", "/openapi.json"}
            if request.url.path not in public_paths and request.method != "OPTIONS":
                client_key = request.headers.get("X-API-Key")
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    client_key = auth_header[7:].strip()

                if not client_key or not secrets.compare_digest(client_key, settings.API_KEY):
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "Unauthorized: Invalid or missing API key"},
                    )

        # 2. Process request
        response = await call_next(request)

        # 3. Add Hardened Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    app.include_router(router, prefix="/api")

    if not settings.API_KEY and settings.ENVIRONMENT != "test":
        logger.warning(
            "Security Notice: No API_KEY configured. Running in unauthenticated development mode. "
            "Set API_KEY in production."
        )

    return app


app = create_app()


if __name__ == "__main__":
    import os
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)


__all__ = ["create_app", "app"]

