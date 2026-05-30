import httpx
from fastapi import Request, HTTPException, Depends, status
from app.config import settings
from app.db import get_db

async def get_current_user(request: Request) -> dict:
    """
    Extracts the Bearer token from the Authorization header and verifies it
    against the Supabase Auth API to authenticate the user session.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Missing or invalid authentication credentials. Please authenticate."
        )
    
    token = auth_header.split(" ")[1]
    if not token or token == "undefined" or token == "null":
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Invalid session token format."
        )

    try:
        # Validate the token against Supabase auth v1 user endpoint
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_ANON_KEY
            }
            res = await client.get(f"{settings.SUPABASE_URL}/auth/v1/user", headers=headers, timeout=5.0)
            if res.status_code == 200:
                return res.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session token."
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service temporarily unavailable: {str(e)}"
        )

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency that verifies the currently authenticated user has administrative
    privileges by checking the admin_users table in the database.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in authentication context."
        )

    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database client is offline."
        )

    try:
        # Check admin_users table for matching user_id
        res = db.table("admin_users").select("*").eq("user_id", user_id).execute()
        if res and res.data and len(res.data) > 0:
            return current_user
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Administrator privileges are required."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error during administrator validation: {str(e)}"
        )
