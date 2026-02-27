import os
import uuid
import io
from pathlib import Path
from fastapi import UploadFile

USE_LOCAL = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true"
LOCAL_UPLOAD_DIR = Path(os.getenv("LOCAL_UPLOAD_DIR", "./uploads"))

# MinIO settings (used when USE_LOCAL_STORAGE=false)
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "localhost:9000").replace("http://", "").replace("https://", "")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
S3_BUCKET = os.getenv("S3_BUCKET", "baikal-files")
S3_SECURE = os.getenv("S3_SECURE", "false").lower() == "true"

_minio_client = None


def _get_minio():
    global _minio_client
    if _minio_client is None:
        from minio import Minio
        _minio_client = Minio(S3_ENDPOINT, access_key=S3_ACCESS_KEY, secret_key=S3_SECRET_KEY, secure=S3_SECURE)
    return _minio_client


async def upload_file(file: UploadFile, folder: str = "uploads") -> str:
    ext = os.path.splitext(file.filename or "file")[-1]
    object_name = f"{folder}/{uuid.uuid4().hex}{ext}"
    content = await file.read()

    if USE_LOCAL:
        dest = LOCAL_UPLOAD_DIR / object_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        return f"/local/{object_name}"

    # MinIO
    try:
        from minio.error import S3Error
        client = _get_minio()
        if not client.bucket_exists(S3_BUCKET):
            client.make_bucket(S3_BUCKET)
        client.put_object(S3_BUCKET, object_name, io.BytesIO(content), length=len(content), content_type=file.content_type)
        return f"/{S3_BUCKET}/{object_name}"
    except Exception as e:
        print(f"[Storage] MinIO error, falling back to local: {e}")
        dest = LOCAL_UPLOAD_DIR / object_name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        return f"/local/{object_name}"


def get_file_url(file_path: str, expires_hours: int = 1) -> str:
    if file_path.startswith("/local/"):
        return file_path
    from datetime import timedelta
    from minio.error import S3Error
    try:
        object_name = file_path.lstrip("/").replace(f"{S3_BUCKET}/", "", 1)
        return _get_minio().presigned_get_object(S3_BUCKET, object_name, expires=timedelta(hours=expires_hours))
    except Exception:
        return ""
