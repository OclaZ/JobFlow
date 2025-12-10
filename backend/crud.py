from sqlalchemy.orm import Session
from . import models, schemas, auth

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Job Offer CRUD
def get_job_offers(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.JobOffer).filter(models.JobOffer.user_id == user_id).offset(skip).limit(limit).all()

def get_job_offer(db: Session, job_offer_id: int, user_id: int):
    return db.query(models.JobOffer).filter(models.JobOffer.id == job_offer_id, models.JobOffer.user_id == user_id).first()

def create_job_offer(db: Session, job_offer: schemas.JobOfferCreate, user_id: int):
    db_job_offer = models.JobOffer(**job_offer.dict(), user_id=user_id)
    db.add(db_job_offer)
    db.commit()
    db.refresh(db_job_offer)
    return db_job_offer

def update_job_offer(db: Session, job_offer_id: int, job_offer: schemas.JobOfferCreate, user_id: int):
    db_job_offer = get_job_offer(db, job_offer_id, user_id)
    if db_job_offer:
        for key, value in job_offer.dict().items():
            setattr(db_job_offer, key, value)
        db.commit()
        db.refresh(db_job_offer)
    return db_job_offer

def delete_job_offer(db: Session, job_offer_id: int, user_id: int):
    db_job_offer = get_job_offer(db, job_offer_id, user_id)
    if db_job_offer:
        db.delete(db_job_offer)
        db.commit()
    return db_job_offer

# Recruiter CRUD
def get_recruiters(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Recruiter).filter(models.Recruiter.user_id == user_id).offset(skip).limit(limit).all()

def get_recruiter(db: Session, recruiter_id: int, user_id: int):
    return db.query(models.Recruiter).filter(models.Recruiter.id == recruiter_id, models.Recruiter.user_id == user_id).first()

def create_recruiter(db: Session, recruiter: schemas.RecruiterCreate, user_id: int):
    db_recruiter = models.Recruiter(**recruiter.dict(), user_id=user_id)
    db.add(db_recruiter)
    db.commit()
    db.refresh(db_recruiter)
    return db_recruiter

def update_recruiter(db: Session, recruiter_id: int, recruiter: schemas.RecruiterCreate, user_id: int):
    db_recruiter = get_recruiter(db, recruiter_id, user_id)
    if db_recruiter:
        for key, value in recruiter.dict().items():
            setattr(db_recruiter, key, value)
        db.commit()
        db.refresh(db_recruiter)
    return db_recruiter

def delete_recruiter(db: Session, recruiter_id: int, user_id: int):
    db_recruiter = get_recruiter(db, recruiter_id, user_id)
    if db_recruiter:
        db.delete(db_recruiter)
        db.commit()
    return db_recruiter

# LinkedIn Activity CRUD
def get_linkedin_activities(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.LinkedInActivity).filter(models.LinkedInActivity.user_id == user_id).offset(skip).limit(limit).all()

def create_linkedin_activity(db: Session, activity: schemas.LinkedInActivityCreate, user_id: int):
    db_activity = models.LinkedInActivity(**activity.dict(), user_id=user_id)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def get_linkedin_activity(db: Session, activity_id: int, user_id: int):
    return db.query(models.LinkedInActivity).filter(models.LinkedInActivity.id == activity_id, models.LinkedInActivity.user_id == user_id).first()

def update_linkedin_activity(db: Session, activity_id: int, activity: schemas.LinkedInActivityCreate, user_id: int):
    db_activity = get_linkedin_activity(db, activity_id, user_id)
    if db_activity:
        for key, value in activity.dict().items():
            setattr(db_activity, key, value)
        db.commit()
        db.refresh(db_activity)
    return db_activity

def delete_linkedin_activity(db: Session, activity_id: int, user_id: int):
    db_activity = get_linkedin_activity(db, activity_id, user_id)
    if db_activity:
        db.delete(db_activity)
        db.commit()
    return db_activity

# Application CRUD
def get_applications(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Application).filter(models.Application.user_id == user_id).offset(skip).limit(limit).all()

def get_application(db: Session, application_id: int, user_id: int):
    return db.query(models.Application).filter(models.Application.id == application_id, models.Application.user_id == user_id).first()

def create_application(db: Session, application: schemas.ApplicationCreate, user_id: int):
    db_application = models.Application(**application.dict(), user_id=user_id)
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

def update_application(db: Session, application_id: int, application: schemas.ApplicationCreate, user_id: int):
    db_application = get_application(db, application_id, user_id)
    if db_application:
        for key, value in application.dict().items():
            setattr(db_application, key, value)
        db.commit()
        db.refresh(db_application)
    return db_application

def delete_application(db: Session, application_id: int, user_id: int):
    db_application = get_application(db, application_id, user_id)
    if db_application:
        db.delete(db_application)
        db.commit()
    return db_application

def get_dashboard_stats(db: Session, current_user: models.User):
    recruiters = get_recruiters(db, user_id=current_user.id)
    job_offers = get_job_offers(db, user_id=current_user.id)
    activities = get_linkedin_activities(db, user_id=current_user.id)
    applications = get_applications(db, user_id=current_user.id)
    
    # Compute stats
    total_dm_sent = sum(1 for r in recruiters if r.dm_sent)
    total_responses = sum(1 for r in recruiters if r.response_received)
    response_rate = (total_responses / total_dm_sent * 100) if total_dm_sent > 0 else 0
    total_applications = len(applications)
    interviews = sum(1 for a in applications if a.final_status == "Entretien")
    
    # Weekly Evolution
    from collections import defaultdict
    weekly_apps = defaultdict(int)
    for app in applications:
        d = app.dm_sent_date
        if d:
            week_key = d.strftime("%Y-W%W")
            weekly_apps[week_key] += 1
            
    evolution_data = [{"name": k, "applications": v, "responses": 0} for k, v in sorted(weekly_apps.items())[-5:]]
    
    # Platform distribution
    platforms = defaultdict(int)
    for offer in job_offers:
        platforms[offer.platform] += 1
    platform_data = [{"name": k, "value": v} for k, v in platforms.items()]

    # Upcoming Follow-ups (Next 7 days)
    upcoming_followups = []
    import datetime
    today = datetime.date.today()
    next_week = today + datetime.timedelta(days=7)
    
    for app in applications:
        for follow_up_type, date_val in [
            ("J+5", app.follow_up_5_date),
            ("J+15", app.follow_up_15_date),
            ("J+30", app.follow_up_30_date)
        ]:
            if date_val and today <= date_val <= next_week:
                upcoming_followups.append({
                    "company": app.company,
                    "position": app.position,
                    "date": date_val.strftime("%Y-%m-%d"),
                    "type": follow_up_type
                })
    
    upcoming_followups.sort(key=lambda x: x["date"])

    return {
        "total_dm_sent": total_dm_sent,
        "total_responses": total_responses,
        "response_rate": response_rate,
        "total_applications": total_applications,
        "interviews": interviews,
        "evolution": evolution_data,
        "platforms": platform_data,
        "upcoming_followups": upcoming_followups
    }
