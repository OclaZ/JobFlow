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

app = FastAPI(title="Dashboard TRE API")

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
    # Global Job Offers should not be deleted as they are shared resources.
    # Only Admin should potentially be able to, but for now we block it for safety.
    raise HTTPException(status_code=403, detail="Deleting global job offers is not allowed.")
    # db_job_offer = crud.delete_job_offer(db, job_offer_id, current_user.id)
    # if db_job_offer is None:
    #     raise HTTPException(status_code=404, detail="Job offer not found or you don't have permission to delete it")
    # return db_job_offer

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

 
 #   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
 
 #   O A u t h   R o u t e s 
 
 #   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
 
 
 
 @ a p p . g e t ( " / a u t h / l o g i n / { p r o v i d e r } " ) 
 
 a s y n c   d e f   l o g i n _ o a u t h ( p r o v i d e r :   s t r ,   r e q u e s t :   R e q u e s t ) : 
 
         #   D e t e r m i n e   t h e   r e d i r e c t   u r i 
 
         #   W e   n e e d   t o   c o n s t r u c t   a b s o l u t e   U R L   t o   / a u t h / { p r o v i d e r } / c a l l b a c k 
 
         #   S i n c e   V e r c e l   m i g h t   b e   b e h i n d   p r o x y ,   u s e   r e q u e s t . u r l _ f o r   o r   f r o m   e n v 
 
         
 
         #   I d e a l l y ,   f r o n t e n d   c a l l s   t h i s ,   w e   r e t u r n   a   r e d i r e c t   U R L ? 
 
         #   N o ,   u s u a l l y   f r o n t e n d   r e d i r e c t s   b r o w s e r   h e r e ,   t h e n   w e   r e d i r e c t   t o   p r o v i d e r . 
 
         
 
         #   C o n s t r u c t   c a l l b a c k   U R L 
 
         #   I M P O R T A N T :   T h i s   U R L   m u s t   b e   r e g i s t e r e d   i n   G o o g l e / L i n k e d I n   C o n s o l e 
 
         #   I n   V e r c e l ,   r e q u e s t . u r l   m i g h t   b e   h t t p ,   s o   p r e f e r   h t t p s   i f   p r o d u c t i o n 
 
         
 
         b a s e _ u r l   =   o s . g e t e n v ( " N E X T _ P U B L I C _ A P I _ U R L " ,   s t r ( r e q u e s t . b a s e _ u r l ) . r s t r i p ( " / " ) ) 
 
         i f   " l o c a l h o s t "   n o t   i n   b a s e _ u r l   a n d   n o t   b a s e _ u r l . s t a r t s w i t h ( " h t t p s " ) : 
 
                   b a s e _ u r l   =   b a s e _ u r l . r e p l a c e ( " h t t p : / / " ,   " h t t p s : / / " ) 
 
                   
 
         r e d i r e c t _ u r i   =   f " { b a s e _ u r l } / a u t h / { p r o v i d e r } / c a l l b a c k " 
 
         
 
         r e t u r n   a w a i t   o a u t h . c r e a t e _ c l i e n t ( p r o v i d e r ) . a u t h o r i z e _ r e d i r e c t ( r e q u e s t ,   r e d i r e c t _ u r i ) 
 
 
 
 @ a p p . g e t ( " / a u t h / { p r o v i d e r } / c a l l b a c k " ) 
 
 a s y n c   d e f   a u t h _ c a l l b a c k ( p r o v i d e r :   s t r ,   r e q u e s t :   R e q u e s t ,   d b :   S e s s i o n   =   D e p e n d s ( g e t _ d b ) ) : 
 
         t r y : 
 
                 t o k e n   =   a w a i t   o a u t h . c r e a t e _ c l i e n t ( p r o v i d e r ) . a u t h o r i z e _ a c c e s s _ t o k e n ( r e q u e s t ) 
 
         e x c e p t   E x c e p t i o n   a s   e : 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 0 ,   d e t a i l = f " O A u t h   f a i l e d :   { s t r ( e ) } " ) 
 
         
 
         u s e r _ i n f o   =   t o k e n . g e t ( ' u s e r i n f o ' ) 
 
         i f   n o t   u s e r _ i n f o : 
 
                 #   F a l l b a c k   f o r   m a n u a l   c a l l   i f   n o t   p r e s e n t 
 
                 c l i e n t   =   o a u t h . c r e a t e _ c l i e n t ( p r o v i d e r ) 
 
                 i f   p r o v i d e r   = =   ' g o o g l e ' : 
 
                           u s e r _ i n f o   =   a w a i t   c l i e n t . g e t ( ' h t t p s : / / w w w . g o o g l e a p i s . c o m / o a u t h 2 / v 1 / u s e r i n f o ' ) . j s o n ( ) 
 
                 e l i f   p r o v i d e r   = =   ' l i n k e d i n ' : 
 
                           u s e r _ i n f o   =   a w a i t   c l i e n t . g e t ( ' h t t p s : / / a p i . l i n k e d i n . c o m / v 2 / u s e r i n f o ' ) . j s o n ( ) 
 
                           
 
         i f   n o t   u s e r _ i n f o   o r   ' e m a i l '   n o t   i n   u s e r _ i n f o : 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 0 ,   d e t a i l = " C o u l d   n o t   r e t r i e v e   e m a i l   f r o m   p r o v i d e r " ) 
 
                 
 
         e m a i l   =   u s e r _ i n f o . g e t ( ' e m a i l ' ) 
 
         f u l l _ n a m e   =   u s e r _ i n f o . g e t ( ' n a m e ' ) 
 
         p i c t u r e   =   u s e r _ i n f o . g e t ( ' p i c t u r e ' )   #   G o o g l e 
 
         #   L i n k e d I n   O I D C   m i g h t   r e t u r n   ' p i c t u r e '   o r   ' p r i o r i t y ? ? '   -   u s u a l l y   ' p i c t u r e '   i n   s t a n d a r d   O I D C 
 
         
 
         #   C h e c k   i f   u s e r   e x i s t s 
 
         u s e r   =   c r u d . g e t _ u s e r _ b y _ e m a i l ( d b ,   e m a i l = e m a i l ) 
 
         i f   n o t   u s e r : 
 
                 #   C r e a t e   u s e r 
 
                 #   G e n e r a t e   r a n d o m   p a s s w o r d 
 
                 i m p o r t   s e c r e t s 
 
                 r a n d o m _ p a s s w o r d   =   s e c r e t s . t o k e n _ u r l s a f e ( 1 6 ) 
 
                 u s e r _ i n   =   s c h e m a s . U s e r C r e a t e ( 
 
                         e m a i l = e m a i l , 
 
                         p a s s w o r d = r a n d o m _ p a s s w o r d , 
 
                         f u l l _ n a m e = f u l l _ n a m e , 
 
                         r o l e = s c h e m a s . U s e r R o l e . C O L L A B O R A T E U R , 
 
                         a v a t a r _ u r l = p i c t u r e , 
 
                         a u t h _ p r o v i d e r = p r o v i d e r 
 
                 ) 
 
                 u s e r   =   c r u d . c r e a t e _ u s e r ( d b ,   u s e r _ i n ) 
 
                 #   U p d a t e   a v a t a r / p r o v i d e r   d i r e c t l y   a s   c r e a t e _ u s e r   s c h e m a   m i g h t   n o t   s u p p o r t   i t   y e t   d e p e n d i n g   o n   i m p l e m e n t a t i o n 
 
                 #   B u t   w a i t ,   c r e a t e _ u s e r   u s e s   U s e r C r e a t e   w h i c h   i n h e r i t s   U s e r B a s e . 
 
                 #   C h e c k   c r u d . c r e a t e _ u s e r : 
 
                 #   d b _ u s e r   =   m o d e l s . U s e r ( e m a i l = u s e r . e m a i l ,   h a s h e d _ p a s s w o r d = . . . ,   f u l l _ n a m e = u s e r . f u l l _ n a m e ,   r o l e = u s e r . r o l e ) 
 
                 #   I t   i g n o r e s   a v a t a r _ u r l / p r o v i d e r .   W e   n e e d   t o   u p d a t e   m a n u a l y . 
 
                 u s e r . a v a t a r _ u r l   =   p i c t u r e 
 
                 u s e r . a u t h _ p r o v i d e r   =   p r o v i d e r 
 
                 d b . c o m m i t ( ) 
 
                 d b . r e f r e s h ( u s e r ) 
 
         e l s e : 
 
                 #   U p d a t e   a v a t a r   i f   s u p p l i e d   a n d   m i s s i n g ? 
 
                 i f   p i c t u r e   a n d   n o t   u s e r . a v a t a r _ u r l : 
 
                         u s e r . a v a t a r _ u r l   =   p i c t u r e 
 
                         d b . c o m m i t ( ) 
 
         
 
         #   L o g i n   ( C r e a t e   J W T ) 
 
         a c c e s s _ t o k e n _ e x p i r e s   =   a u t h . t i m e d e l t a ( m i n u t e s = a u t h . A C C E S S _ T O K E N _ E X P I R E _ M I N U T E S ) 
 
         a c c e s s _ t o k e n   =   a u t h . c r e a t e _ a c c e s s _ t o k e n ( 
 
                 d a t a = { " s u b " :   u s e r . e m a i l } ,   e x p i r e s _ d e l t a = a c c e s s _ t o k e n _ e x p i r e s 
 
         ) 
 
         
 
         #   R e d i r e c t   t o   F r o n t e n d 
 
         #   U s e   s t a n d a r d   N E X T _ P U B L I C _ A P I _ U R L   e q u i v a l e n t   f o r   f r o n t e n d ? 
 
         #   N O ,   w e   n e e d   f r o n t e n d   U R L . 
 
         #   E n v   v a r   F R O N T E N D _ U R L 
 
         f r o n t e n d _ u r l   =   o s . g e t e n v ( " F R O N T E N D _ U R L " ,   " h t t p : / / l o c a l h o s t : 3 0 0 0 " ) 
 
         r e s p o n s e   =   R e d i r e c t R e s p o n s e ( u r l = f " { f r o n t e n d _ u r l } / d a s h b o a r d ? t o k e n = { a c c e s s _ t o k e n } " ) 
 
         r e t u r n   r e s p o n s e 
 
 
 
 #   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
 
 #   P r o f i l e   /   C V   R o u t e s 
 
 #   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
 
 
 
 @ a p p . p o s t ( " / u s e r s / m e / a v a t a r " ,   r e s p o n s e _ m o d e l = s c h e m a s . U s e r ) 
 
 a s y n c   d e f   u p l o a d _ a v a t a r ( 
 
         f i l e :   U p l o a d F i l e   =   F i l e ( . . . ) , 
 
         c u r r e n t _ u s e r :   m o d e l s . U s e r   =   D e p e n d s ( a u t h . g e t _ c u r r e n t _ a c t i v e _ u s e r ) , 
 
         d b :   S e s s i o n   =   D e p e n d s ( g e t _ d b ) 
 
 ) : 
 
         #   I d e a l l y   u p l o a d   t o   S 3 / C l o u d i n a r y . 
 
         #   F o r   n o w ,   w e   r e t u r n   M o c k   U R L   o r   s t o r e   i n   D B ? 
 
         #   U s e r   r e q u e s t e d   f e a t u r e s .   S t o r i n g   b i n a r y   i n   m a i n   D B   i s   r i s k y   f o r   f i l e   s i z e . 
 
         #   B u t   f o r   a n   a v a t a r   ( s m a l l   i m g ) ,   w e   c a n   s t o r e   a s   b a s e 6 4   s t r i n g   i n   a v a t a r _ u r l ? 
 
         #   O r   s t r i c t   b i n a r y . 
 
         #   U s e r   m o d e l   h a s   ' a v a t a r _ u r l '   ( S t r i n g ) . 
 
         #   C o n v e r t   i m a g e   t o   b a s e 6 4   d a t a   u r i   i s   s i m p l e s t   f o r   " S t r i n g "   s t o r a g e   i f   i t ' s   s m a l l . 
 
         
 
         i f   f i l e . c o n t e n t _ t y p e   n o t   i n   [ " i m a g e / j p e g " ,   " i m a g e / p n g " ,   " i m a g e / g i f " ] : 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 0 ,   d e t a i l = " I n v a l i d   i m a g e   t y p e " ) 
 
                 
 
         i m p o r t   b a s e 6 4 
 
         c o n t e n t   =   a w a i t   f i l e . r e a d ( ) 
 
         i f   l e n ( c o n t e n t )   >   2   *   1 0 2 4   *   1 0 2 4 :   #   2 M B   l i m i t 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 0 ,   d e t a i l = " I m a g e   t o o   l a r g e   ( m a x   2 M B ) " ) 
 
                 
 
         b 6 4 _ s t r i n g   =   b a s e 6 4 . b 6 4 e n c o d e ( c o n t e n t ) . d e c o d e ( ' u t f - 8 ' ) 
 
         d a t a _ u r i   =   f " d a t a : { f i l e . c o n t e n t _ t y p e } ; b a s e 6 4 , { b 6 4 _ s t r i n g } " 
 
         
 
         r e t u r n   c r u d . u p d a t e _ u s e r _ a v a t a r ( d b ,   c u r r e n t _ u s e r . i d ,   d a t a _ u r i ) 
 
 
 
 @ a p p . p o s t ( " / u s e r s / m e / c v s " ,   r e s p o n s e _ m o d e l = s c h e m a s . U s e r C V ) 
 
 a s y n c   d e f   u p l o a d _ c v ( 
 
         f i l e :   U p l o a d F i l e   =   F i l e ( . . . ) , 
 
         c u r r e n t _ u s e r :   m o d e l s . U s e r   =   D e p e n d s ( a u t h . g e t _ c u r r e n t _ a c t i v e _ u s e r ) , 
 
         d b :   S e s s i o n   =   D e p e n d s ( g e t _ d b ) 
 
 ) : 
 
         i f   f i l e . c o n t e n t _ t y p e   ! =   " a p p l i c a t i o n / p d f " : 
 
                   r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 0 ,   d e t a i l = " O n l y   P D F   f i l e s   a l l o w e d " ) 
 
                   
 
         c o n t e n t   =   a w a i t   f i l e . r e a d ( ) 
 
         i f   l e n ( c o n t e n t )   >   5   *   1 0 2 4   *   1 0 2 4 :   #   5 M B   l i m i t 
 
                   r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 0 ,   d e t a i l = " F i l e   t o o   l a r g e   ( m a x   5 M B ) " ) 
 
         
 
         r e t u r n   c r u d . c r e a t e _ u s e r _ c v ( d b ,   f i l e . f i l e n a m e ,   c o n t e n t ,   c u r r e n t _ u s e r . i d ) 
 
 
 
 @ a p p . g e t ( " / u s e r s / m e / c v s " ,   r e s p o n s e _ m o d e l = L i s t [ s c h e m a s . U s e r C V ] ) 
 
 a s y n c   d e f   g e t _ m y _ c v s ( 
 
         c u r r e n t _ u s e r :   m o d e l s . U s e r   =   D e p e n d s ( a u t h . g e t _ c u r r e n t _ a c t i v e _ u s e r ) , 
 
         d b :   S e s s i o n   =   D e p e n d s ( g e t _ d b ) 
 
 ) : 
 
         r e t u r n   c r u d . g e t _ u s e r _ c v s ( d b ,   c u r r e n t _ u s e r . i d ) 
 
 
 
 @ a p p . d e l e t e ( " / u s e r s / m e / c v s / { c v _ i d } " ) 
 
 a s y n c   d e f   d e l e t e _ c v ( 
 
         c v _ i d :   i n t , 
 
         c u r r e n t _ u s e r :   m o d e l s . U s e r   =   D e p e n d s ( a u t h . g e t _ c u r r e n t _ a c t i v e _ u s e r ) , 
 
         d b :   S e s s i o n   =   D e p e n d s ( g e t _ d b ) 
 
 ) : 
 
         c r u d . d e l e t e _ u s e r _ c v ( d b ,   c v _ i d ,   c u r r e n t _ u s e r . i d ) 
 
         r e t u r n   { " o k " :   T r u e } 
 
 
 
 @ a p p . g e t ( " / u s e r s / m e / c v s / { c v _ i d } / d o w n l o a d " ) 
 
 a s y n c   d e f   d o w n l o a d _ c v ( 
 
         c v _ i d :   i n t , 
 
         c u r r e n t _ u s e r :   m o d e l s . U s e r   =   D e p e n d s ( a u t h . g e t _ c u r r e n t _ a c t i v e _ u s e r ) , 
 
         d b :   S e s s i o n   =   D e p e n d s ( g e t _ d b ) 
 
 ) : 
 
         c v   =   c r u d . g e t _ u s e r _ c v ( d b ,   c v _ i d ,   c u r r e n t _ u s e r . i d ) 
 
         i f   n o t   c v : 
 
                 r a i s e   H T T P E x c e p t i o n ( s t a t u s _ c o d e = 4 0 4 ,   d e t a i l = " C V   n o t   f o u n d " ) 
 
                 
 
         r e t u r n   S t r e a m i n g R e s p o n s e ( 
 
                 i o . B y t e s I O ( c v . f i l e _ d a t a ) , 
 
                 m e d i a _ t y p e = " a p p l i c a t i o n / p d f " , 
 
                 h e a d e r s = { " C o n t e n t - D i s p o s i t i o n " :   f " a t t a c h m e n t ;   f i l e n a m e = { c v . f i l e n a m e } " } 
 
         ) 
 
 