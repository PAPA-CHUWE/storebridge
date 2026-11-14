from fastapi import APIRouter
from pydantic import BaseModel

from app.core.security import CurrentPrincipal

router = APIRouter(prefix="/api/v1")


class Me(BaseModel):
    user_id: str
    email: str
    is_staff: bool


@router.get("/me", response_model=Me, tags=["identity"])
async def me(principal: CurrentPrincipal) -> Me:
    """Who the verified access token belongs to. Useful for checking the auth chain end to end."""
    return Me(user_id=principal.user_id, email=principal.email, is_staff=principal.is_staff)
