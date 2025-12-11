from datetime import datetime, timedelta
from typing import Optional
import jwt # pyjwt
from jwt.algorithms import RSAAlgorithm
import json
import httpx
import os
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
try:
    from . import models, schemas, database
except ImportError:
    import models, schemas, database

# Config
CLERK_DOMAIN = "coherent-snapper-65.clerk.accounts.dev" # derived from pk_test
JWKS_URL = f"https://{CLERK_DOMAIN}/.well-known/jwks.json"
ALGORITHM = "RS256"

# Cache for JWKS
jwks_client = jwt.PyJWKClient(JWKS_URL)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_token(token: str):
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[ALGORITHM],
            options={"verify_aud": False} # Clerk audience might vary
        )
        return payload
    except Exception as e:
        print(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    
    # Clerk Payload usually has 'sub' (User ID). Does it have email?
    # Usually NO, unless customized.
    # However, we need to map to our local User DB.
    # Strategy:
    # 1. Check if we have a user with `auth_provider_id` = sub (Need to add this column? No I have auth_provider="clerk", but no ID column. I used email).
    # 2. If no ID column, we need email.
    # 3. If Payload has NO email, we are stuck OR we fetch User info from Clerk Backend API using Secret Key.
    
    user_clerk_id = payload.get("sub")
    email = payload.get("email") # Try getting email
    print(f"DEBUG: Token Verified. Sub: {user_clerk_id}, Email in claim: {email}")
    
    if not email:
        # Fetch from Clerk API
        print(f"DEBUG: Fetching email from Clerk API for user {user_clerk_id}")
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"https://api.clerk.com/v1/users/{user_clerk_id}",
                headers={"Authorization": f"Bearer {os.getenv('CLERK_SECRET_KEY')}"}
            )
            if res.status_code == 200:
                user_data = res.json()
                # Clerk returns email_addresses list
                if user_data.get("email_addresses"):
                    email = user_data["email_addresses"][0]["email_address"]
                    
    if not email:
        raise HTTPException(status_code=400, detail="Could not resolve user email from Clerk")

    # Find or Create User in Local DB
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Create new user
        # Generate random password as placeholder
        import secrets
        random_password = secrets.token_urlsafe(16)
        hashed_password = pwd_context.hash(random_password)
        
        user = models.User(
            email=email,
            hashed_password=hashed_password,
            full_name="New User", # We could fetch name from Clerk too
            role=schemas.UserRole.COLLABORATEUR,
            auth_provider="clerk",
            avatar_url=None # Fetch if possible
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    return current_user

async def get_current_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if role is admin OR if email matches hardcoded super admin
    # For now, let's treat the user 'aslikh.hamza@gmail.com' (from previous context or user email) as admin? 
    # Or just check role.
    # To bootstrap, I will assume any user with role="admin" is admin.
    if current_user.role != schemas.UserRole.ADMIN:
        # Fallback: Check ENV
        import os
        admin_email = os.getenv("ADMIN_EMAIL")
        
        print(f"DEBUG: Checking Admin. User Email: {current_user.email}, ENV ADMIN_EMAIL: {admin_email}, Role: {current_user.role}")
        
        if admin_email and current_user.email.strip().lower() == admin_email.strip().lower():
            # Auto-promote to Admin in DB to persist this status
            try:
                current_user.role = schemas.UserRole.ADMIN
                db.commit()
                db.refresh(current_user)
                print(f"DEBUG: Auto-promoted {current_user.email} to ADMIN")
            except Exception as e:
                print(f"DEBUG: Failed to auto-promote user: {e}")
                # Don't fail the request, just proceed
            
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
