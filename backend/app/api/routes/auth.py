from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.core.store import store
from app.schemas import TokenResponse, UserCreate, UserLogin, UserOut

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def guest_user() -> UserOut:
    return UserOut(id="guest", name="Guest", email="guest@finpilot.local")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    settings = get_settings()
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError as error:
        raise credentials_exception from error

    user = await store.find_user_by_email(email)
    if not user:
        raise credentials_exception
    return UserOut(id=user["id"], name=user["name"], email=user["email"])


async def get_optional_current_user(token: str | None = Depends(optional_oauth2_scheme)) -> UserOut:
    if not token:
        return guest_user()
    try:
        return await get_current_user(token)
    except HTTPException:
        return guest_user()


@router.post("/register", response_model=dict)
async def register(payload: UserCreate):
    existing = await store.find_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    user = await store.create_user({
        "name": payload.name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    token = create_access_token(payload.email)
    return {"user": {"id": user["id"], "name": user["name"], "email": user["email"]}, "token": token}


@router.post("/login", response_model=dict)
async def login(payload: UserLogin):
    user = await store.find_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(payload.email)
    return {"user": {"id": user["id"], "name": user["name"], "email": user["email"]}, "token": token}


@router.get("/me", response_model=UserOut)
async def me(current_user: UserOut = Depends(get_current_user)):
    return current_user


@router.post("/token", response_model=TokenResponse)
async def token(payload: UserLogin):
    user = await store.find_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(payload.email))
