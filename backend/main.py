from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import io
from reportlab.pdfgen import canvas
from . import crud, models, schemas, auth, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Dashboard TRE API")

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for extension development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

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
    db_job_offer = crud.delete_job_offer(db, job_offer_id, current_user.id)
    if db_job_offer is None:
        raise HTTPException(status_code=404, detail="Job offer not found or you don't have permission to delete it")
    return db_job_offer

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
