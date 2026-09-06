import os
import shutil
import aiofiles
from pathlib import Path
from typing import BinaryIO, Optional
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        (self.upload_dir / "documents").mkdir(exist_ok=True)
        (self.upload_dir / "thumbnails").mkdir(exist_ok=True)
        (self.upload_dir / "processed").mkdir(exist_ok=True)
        (self.upload_dir / "reports").mkdir(exist_ok=True)

    async def save_file(self, file_content: bytes, filename: str, subfolder: str = "documents") -> str:
        target_dir = self.upload_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / filename
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)
            
        return str(file_path)

    def get_file_path(self, filename: str, subfolder: str = "documents") -> Path:
        return self.upload_dir / subfolder / filename

    def get_public_url(self, file_path_or_name: str) -> str:
        # Returns API URL to serve static uploaded files
        name = Path(file_path_or_name).name
        # Determine subfolder
        for sub in ["documents", "thumbnails", "processed", "reports"]:
            if (self.upload_dir / sub / name).exists():
                return f"{settings.API_V1_STR}/documents/files/{sub}/{name}"
        return f"{settings.API_V1_STR}/documents/files/documents/{name}"

storage_service = StorageService()
