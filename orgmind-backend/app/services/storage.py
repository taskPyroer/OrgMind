import os
import shutil
import hashlib
from typing import BinaryIO, Tuple
from abc import ABC, abstractmethod
from pathlib import Path
from fastapi import UploadFile

class BaseStorage(ABC):
    @abstractmethod
    def save(self, file_obj: BinaryIO, path: str) -> str:
        pass

    @abstractmethod
    def get_path(self, path: str) -> str:
        pass
    
    @abstractmethod
    def delete(self, path: str) -> bool:
        pass

    @abstractmethod
    def delete_dir(self, path: str) -> bool:
        pass

class LocalStorage(BaseStorage):
    def __init__(self, base_dir: str = "data/uploads"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file_obj: BinaryIO, path: str) -> str:
        """
        Save file to local storage.
        path: relative path like '{kb_id}/{uuid}.pdf'
        """
        full_path = self.base_dir / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Reset pointer just in case
        file_obj.seek(0)
        
        with open(full_path, "wb") as buffer:
            while content := file_obj.read(1024 * 1024):
                buffer.write(content)
            
        return str(full_path)

    def get_path(self, path: str) -> str:
        return str(self.base_dir / path)
    
    def delete(self, path: str) -> bool:
        full_path = self.base_dir / path
        if full_path.exists():
            os.remove(full_path)
            return True
        return False

    def delete_dir(self, path: str) -> bool:
        """Recursively delete a directory"""
        full_path = self.base_dir / path
        if full_path.exists() and full_path.is_dir():
            shutil.rmtree(full_path)
            return True
        return False

# Global Storage Instance (Switchable to S3 later)
storage = LocalStorage()

def calculate_file_hash(file: UploadFile) -> Tuple[str, int]:
    """Calculate SHA256 hash and size of UploadFile"""
    sha256_hash = hashlib.sha256()
    size = 0
    file.file.seek(0)
    while chunk := file.file.read(8192):
        sha256_hash.update(chunk)
        size += len(chunk)
    file.file.seek(0) # Reset pointer
    return sha256_hash.hexdigest(), size
