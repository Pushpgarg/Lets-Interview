from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application Settings configuration class.
    Loads environment variables from the `.env` file in the project root.
    """
    MONGODB_URL: str = "mongodb://localhost:27017"
    SECRET_KEY: str = "dev_secret_key_change_in_production_1234567890"
    PROJECT_NAME: str = "Lets Interview"
    ENVIRONMENT: str = "development"

    # Pydantic V2 Configuration Dict
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
