from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check() -> dict:
    """
    Simple REST GET route to verify system status.
    """
    return {"status": "ok"}
