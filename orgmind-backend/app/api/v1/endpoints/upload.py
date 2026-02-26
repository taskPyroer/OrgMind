from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid

router = APIRouter()

# Use absolute path to ensure correctness regardless of CWD
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "img")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image")
def upload_image(file: UploadFile = File(...)):
    try:
        # Generate a unique filename to avoid collisions
        file_extension = os.path.splitext(file.filename)[1]
        if not file_extension:
            file_extension = ".png" # Default to png if no extension
            
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL. The frontend will access this via /static/img/filename
        return {
            "url": f"/static/img/{unique_filename}", 
            "name": file.filename,
            "status": "done"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


