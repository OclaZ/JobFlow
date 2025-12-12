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
        
        if not admin_email:
            print("DEBUG: ADMIN_EMAIL environment variable is NOT SET")
        else:
             print(f"DEBUG: Comparing '{current_user.email.strip().lower()}' with '{admin_email.strip().lower()}'")
        
        # HARDCODED BACKUP FOR EMERGENCY ACCESS
        if current_user.email.strip().lower() == "hello@hamzaaslikh.com":
             print("DEBUG: Hardcoded Admin Access Granted")
             current_user.role = schemas.UserRole.ADMIN
             try:
                db.commit()
                db.refresh(current_user)
             except:
                pass
             return current_user

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
            detail=f"Access Denied. User: {current_user.email} is not authorized."
        )
    return current_user

# --- Custom Admin Auth (JWT) ---
# Separate from Clerk to allow distinct Admin Login
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")

def create_admin_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60) # 1 hour default
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

oauth2_scheme_admin = OAuth2PasswordBearer(tokenUrl="admin/token")

async def get_current_admin_user(
    token: str = Depends(oauth2_scheme), # Use Standard Oauth2 Scheme (Clerk)
    db: Session = Depends(get_db)
):
    print(f"DEBUG: Validating Admin Request. Token: {token[:10]}...")
    
    # 1. Try Clerk/Standard Token Verification
    # 1. Try Clerk/Standard Token Verification
    try:
        payload = verify_token(token)
        print(f"DEBUG: Token Payload Keys: {list(payload.keys())}")
        
        # Clerk Session Tokens usually DO NOT have email.
        # We must fetch it using the 'sub' (User ID) if missing.
        email = payload.get("email")
        user_clerk_id = payload.get("sub")
        
        if not email and user_clerk_id:
            print(f"DEBUG: Email missing in token. Fetching from Clerk API for ID: {user_clerk_id}")
            try:
                # Synchronous fetch (since we are in async def, we should use httpx.AsyncClient or just simple request)
                # But to keep dependencies simple and robust, let's use httpx inside context
                async with httpx.AsyncClient() as client:
                    clerk_key = os.getenv("CLERK_SECRET_KEY")
                    if not clerk_key:
                        print("CRITICAL: CLERK_SECRET_KEY is missing! Cannot fetch user details.")
                    else:
                        res = await client.get(
                            f"https://api.clerk.com/v1/users/{user_clerk_id}",
                            headers={"Authorization": f"Bearer {clerk_key}"}
                        )
                        if res.status_code == 200:
                            user_data = res.json()
                            if user_data.get("email_addresses"):
                                email = user_data["email_addresses"][0]["email_address"]
                                print(f"DEBUG: Fetched Email from Clerk: {email}")
                        else:
                            print(f"DEBUG: Clerk API Fetch Failed: {res.status_code} {res.text}")
            except Exception as fetch_e:
                print(f"DEBUG: Failed to fetch from Clerk API: {fetch_e}")

        
        print(f"DEBUG: Final Resolved Email: {email}")
        
        # 2. Check Admin Access
        # HARDCODED SUPER ADMIN CHECK
        if email and email.strip().lower() == "hello@hamzaaslikh.com":
             print("DEBUG: Super Admin Detected (Clerk). Access Granted.")
             return models.User(
                id=99999,
                email=email,
                full_name="Super Admin",
                role=schemas.UserRole.ADMIN,
                auth_provider="clerk"
             )
        
        # 3. Check DB Role
        if email:
            try:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user and user.role == schemas.UserRole.ADMIN:
                    return user
            except Exception as e:
                print(f"DEBUG: DB Lookup failed: {e}")
                
        # If we reached here, user is valid but NOT admin
        # Return detailed error for debugging
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied: Not an Admin. Email: {email or 'Unknown'}"
        )

    except HTTPException as he:
        # If it was 403, re-raise
        if he.status_code == 403:
            raise he
        # If 401 (Invalid Clerk Token), catch and fall through to legacy Custom JWT check?
        # NO, we are moving to Clerk. Just fail.
        # But wait, did we deploy the frontend change yet? Yes.
        # So Frontend sends Clerk Token now.
        raise he
    except Exception as e:
        print(f"DEBUG: Auth Error: {e}")
        # As a fallback, try verifying as Custom JWT (for old sessions or testing)
        try:
             payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
             if payload.get("role") == "admin":
                 return models.User(id=88888, email=payload.get("sub"), role="admin")
        except:
             pass
             
        raise HTTPException(status_code=401, detail="Invalid Authentication Token")
