import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR.parent.parent / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Land Record Digitization and Validation System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Host
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Database
    # Default to local SQLite with PostGIS-ready schemas for seamless zero-setup testing,
    # or PostgreSQL / PostGIS via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/land_intel.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih2026-intelligent-land-record-super-secret-key-32chars-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # local | minio | s3
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    STORAGE_S3_ENDPOINT: Optional[str] = os.getenv("S3_ENDPOINT", None)
    STORAGE_S3_ACCESS_KEY: Optional[str] = os.getenv("S3_ACCESS_KEY", "minioadmin")
    STORAGE_S3_SECRET_KEY: Optional[str] = os.getenv("S3_SECRET_KEY", "minioadmin")
    STORAGE_S3_BUCKET: str = os.getenv("S3_BUCKET", "land-records")
    
    # OCR & AI Providers
    OCR_PROVIDER: str = os.getenv("OCR_PROVIDER", "hybrid")  # hybrid | tesseract | mock
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "rule_ml")
    MISTRAL_API_KEY: Optional[str] = os.getenv("MISTRAL_API_KEY", os.getenv("AI_API_KEY", None))
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "codestral-latest")
    SUPPORTED_LANGUAGES: List[str] = ["en", "ta", "hi"]
    
    # Validation Thresholds
    AREA_TOLERANCE_PERCENT: float = 5.0
    OCR_CONFIDENCE_THRESHOLD: float = 75.0
    HIGH_RISK_THRESHOLD: float = 65.0
    
    # GIS
    DEFAULT_MAP_CENTER: List[float] = [11.3410, 77.7172] # Erode, Tamil Nadu
    DEFAULT_MAP_ZOOM: int = 14

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "documents").mkdir(exist_ok=True)
(settings.UPLOAD_DIR / "thumbnails").mkdir(exist_ok=True)
(settings.UPLOAD_DIR / "processed").mkdir(exist_ok=True)
(settings.UPLOAD_DIR / "reports").mkdir(exist_ok=True)
