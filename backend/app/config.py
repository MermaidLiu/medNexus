from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "MedNexus GynOnc Science Navigator"
    debug: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # LLM (optional — falls back to rule-based mock when unset)
    openai_api_key: str = ""
    openai_base_url: str = ""  # e.g. http://118.195.160.99/v1 for relay
    openai_model: str = "gemini-2.5-flash"

    # ToolUniverse (optional — falls back to mock literature data)
    tooluniverse_enabled: bool = False

    # CT + PCI imaging analysis upstream
    imaging_api_url: str = "http://42.81.102.195:8000"
    imaging_api_timeout: float = 600.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
