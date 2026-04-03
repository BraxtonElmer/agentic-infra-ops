from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "sqlite:///./axiom.db"

    # Groq LLM
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # GitHub (optional - for pipelines)
    github_token: str = ""

    # Local server label
    local_server_name: str = "ops-server"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
