from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse, StreamingResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import os
import json
from reportlab.pdfgen import canvas
try:
    from . import crud, models, schemas, auth, database
except ImportError:
    import crud, models, schemas, auth, database

models.Base.metadata.create_all(bind=database.engine)



# Session Middleware is required for Authlib
# Use a secret key from env or fallback
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "supersecretkey"))

origins = [
    "http://localhost:3000",
    "https://job-flow-psi.vercel.app", # Add production frontend
    "https://jobflow-frontend.vercel.app" # Alternate
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth Setup
oauth = OAuth()

# Google
if os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'):
    oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

# LinkedIn
if os.getenv('LINKEDIN_CLIENT_ID') and os.getenv('LINKEDIN_CLIENT_SECRET'):
    oauth.register(
        name='linkedin',
        client_id=os.getenv('LINKEDIN_CLIENT_ID'),
        client_secret=os.getenv('LINKEDIN_CLIENT_SECRET'),
        api_base_url='https://api.linkedin.com/v2/',
        access_token_url='https://www.linkedin.com/oauth/v2/accessToken',
        authorize_url='https://www.linkedin.com/oauth/v2/authorization',
        client_kwargs={'scope': 'openid profile email'} # OIDC scopes
    )

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

# Job Offers
@app.post("/job_offers/", response_model=schemas.JobOffer)
def create_job_offer(job_offer: schemas.JobOfferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_job_offer(db=db, job_offer=job_offer, user_id=current_user.id)

@app.get("/job_offers/", response_model=List[schemas.JobOffer])
def read_job_offers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Note: Job offers are now visible to all users
    return crud.get_job_offers(db, skip=skip, limit=limit)

@app.put("/job_offers/{job_offer_id}", response_model=schemas.JobOffer)
def update_job_offer(job_offer_id: int, job_offer: schemas.JobOfferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_job_offer = crud.update_job_offer(db, job_offer_id, job_offer, current_user.id)
    if db_job_offer is None:
        raise HTTPException(status_code=404, detail="Job offer not found or you don't have permission to edit it")
    return db_job_offer

@app.delete("/job_offers/{job_offer_id}", response_model=schemas.JobOffer)
def delete_job_offer(job_offer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Global Job Offers should not be deleted as they are shared resources.
    # Only Admin should potentially be able to, but for now we block it for safety.
    raise HTTPException(status_code=403, detail="Deleting global job offers is not allowed.")

@app.post("/job_offers/{job_offer_id}/track", response_model=schemas.Application)
def track_job_offer(job_offer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    application = crud.track_job_offer(db, job_offer_id, current_user.id)
    if application is None:
        raise HTTPException(status_code=404, detail="Job offer not found")
    return application

# Recruiters
@app.post("/recruiters/", response_model=schemas.Recruiter)
def create_recruiter(recruiter: schemas.RecruiterCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_recruiter(db=db, recruiter=recruiter, user_id=current_user.id)

@app.get("/recruiters/", response_model=List[schemas.Recruiter])
def read_recruiters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_recruiters(db, user_id=current_user.id, skip=skip, limit=limit)

@app.put("/recruiters/{recruiter_id}", response_model=schemas.Recruiter)
def update_recruiter(recruiter_id: int, recruiter: schemas.RecruiterCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_recruiter = crud.update_recruiter(db, recruiter_id, recruiter, current_user.id)
    if db_recruiter is None:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return db_recruiter

@app.delete("/recruiters/{recruiter_id}", response_model=schemas.Recruiter)
def delete_recruiter(recruiter_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_recruiter = crud.delete_recruiter(db, recruiter_id, current_user.id)
    if db_recruiter is None:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return db_recruiter

# LinkedIn Activities
@app.post("/linkedin_activities/", response_model=schemas.LinkedInActivity)
def create_linkedin_activity(activity: schemas.LinkedInActivityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_linkedin_activity(db=db, activity=activity, user_id=current_user.id)

@app.get("/linkedin_activities/", response_model=List[schemas.LinkedInActivity])
def read_linkedin_activities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_linkedin_activities(db, user_id=current_user.id, skip=skip, limit=limit)

@app.put("/linkedin_activities/{activity_id}", response_model=schemas.LinkedInActivity)
def update_linkedin_activity(activity_id: int, activity: schemas.LinkedInActivityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_activity = crud.update_linkedin_activity(db, activity_id, activity, current_user.id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return db_activity

@app.delete("/linkedin_activities/{activity_id}", response_model=schemas.LinkedInActivity)
def delete_linkedin_activity(activity_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_activity = crud.delete_linkedin_activity(db, activity_id, current_user.id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return db_activity

# Applications
@app.post("/applications/", response_model=schemas.Application)
def create_application(application: schemas.ApplicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_application(db=db, application=application, user_id=current_user.id)

@app.get("/applications/", response_model=List[schemas.Application])
def read_applications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_applications(db, user_id=current_user.id, skip=skip, limit=limit)

@app.put("/applications/{application_id}", response_model=schemas.Application)
def update_application(application_id: int, application: schemas.ApplicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_application = crud.update_application(db, application_id, application, current_user.id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application

@app.delete("/applications/{application_id}", response_model=schemas.Application)
def delete_application(application_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_application = crud.delete_application(db, application_id, current_user.id)
    if db_application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_application

# Dashboard Stats (Computed)
@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_dashboard_stats(db, current_user)

@app.get("/users/me/report")
def generate_report(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    
    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 800, f"Performance Report for {current_user.full_name or current_user.email}")
    
    # Stats
    stats = get_dashboard_stats(db, current_user)
    p.setFont("Helvetica", 12)
    y = 750
    for key, value in stats.items():
        p.drawString(100, y, f"{key}: {value}")
        y -= 20
        
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=report.pdf"})

# OAuth Routes (Legacy/Direct)
# Note: With Clerk, these might be redundant if using Clerk Frontend + Clerk backend verification logic.
# However, if using custom OAuth flows (login buttons from earlier), we might keep them or remove them.
# Given USER uses Clerk now, these custom endpoints are NOT USED by Clerk frontend component.
# But I will keep them clean just in case, but nicely formatted.

@app.get("/auth/login/{provider}")
async def login_oauth(provider: str, request: Request):
    base_url = os.getenv("NEXT_PUBLIC_API_URL", str(request.base_url).rstrip("/"))
    if "localhost" not in base_url and not base_url.startswith("https"):
         base_url = base_url.replace("http://", "https://")
    redirect_uri = f"{base_url}/auth/{provider}/callback"
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

@app.get("/auth/{provider}/callback")
async def auth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.create_client(provider).authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")
    
    user_info = token.get('userinfo')
    if not user_info:
        client = oauth.create_client(provider)
        if provider == 'google':
             user_info = await client.get('https://www.googleapis.com/oauth2/v1/userinfo').json()
        elif provider == 'linkedin':
             user_info = await client.get('https://api.linkedin.com/v2/userinfo').json()
             
    if not user_info or 'email' not in user_info:
        raise HTTPException(status_code=400, detail="Could not retrieve email from provider")
        
    email = user_info.get('email')
    full_name = user_info.get('name')
    picture = user_info.get('picture')
    
    user = crud.get_user_by_email(db, email=email)
    if not user:
        import secrets
        random_password = secrets.token_urlsafe(16)
        user_in = schemas.UserCreate(
            email=email,
            password=random_password,
            full_name=full_name,
            role=schemas.UserRole.COLLABORATEUR,
            avatar_url=picture,
            auth_provider=provider
        )
        user = crud.create_user(db, user_in)
        user.avatar_url = picture
        user.auth_provider = provider
        db.commit()
        db.refresh(user)
    else:
        if picture and not user.avatar_url:
            user.avatar_url = picture
            db.commit()
    
    # Create JWT
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    response = RedirectResponse(url=f"{frontend_url}/dashboard?token={access_token}")
    return response

# Profile / CV Routes

@app.post("/users/me/avatar", response_model=schemas.User)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
        raise HTTPException(status_code=400, detail="Invalid image type")
        
    import base64
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 2MB)")
        
    b64_string = base64.b64encode(content).decode('utf-8')
    data_uri = f"data:{file.content_type};base64,{b64_string}"
    
    return crud.update_user_avatar(db, current_user.id, data_uri)

@app.post("/users/me/cvs", response_model=schemas.UserCV)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if file.content_type != "application/pdf":
         raise HTTPException(status_code=400, detail="Only PDF files allowed")
         
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
         raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    return crud.create_user_cv(db, file.filename, content, current_user.id)

@app.get("/users/me/cvs", response_model=List[schemas.UserCV])
async def get_my_cvs(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_cvs(db, current_user.id)

@app.delete("/users/me/cvs/{cv_id}")
async def delete_cv(
    cv_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    crud.delete_user_cv(db, cv_id, current_user.id)
    return {"ok": True}

@app.get("/users/me/cvs/{cv_id}/download")
async def download_cv(
    cv_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    cv = crud.get_user_cv(db, cv_id, current_user.id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
        
    return StreamingResponse(
        io.BytesIO(cv.file_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={cv.filename}"}
    )