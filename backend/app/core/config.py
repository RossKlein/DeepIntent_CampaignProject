from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    API_URL: str
    CAMPAIGN_API_KEY: str = "interview-key-2024"
    DATABASE_URL: str
    GITHUB_TOKEN: str
    GITHUB_REPO: str
    POLL_INTERVAL_SECONDS: int = 10
    CAMPAIGN_DATA_MAX_ROWS: int = 1000
    CORS_ORIGINS: str = "http://localhost:5173"

    @field_validator("API_URL")
    @classmethod
    def strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


config_obj = Settings()
settings = config_obj


def get_settings() -> Settings:
    return settings
