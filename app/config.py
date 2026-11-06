import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME = os.getenv(
        "APP_NAME",
        "AI Tech Research Agent"
    )

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./research.db")

    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

    RESEARCH_DAYS = int(
        os.getenv("RESEARCH_DAYS", "14")
    )

    GITHUB_RESULTS_PER_TOPIC = int(
        os.getenv("GITHUB_RESULTS_PER_TOPIC", "10")
    )

    TIMEZONE = os.getenv(
        "TIMEZONE",
        "Asia/Kolkata"
    )

    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    OLLAMA_BASE_URL = os.getenv(
        "OLLAMA_BASE_URL",
        "http://localhost:11434",
    )

    OLLAMA_MODEL = os.getenv(
        "OLLAMA_MODEL",
        "llama3.1:8b",
    )

    API_KEY = os.getenv("API_KEY", "")

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ]

    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


settings = Settings()