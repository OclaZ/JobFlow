from sqlalchemy.orm import Session
try:
    from . import models, schemas, auth
except ImportError:
    import models, schemas, auth
from collections import defaultdict

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

def update_user_avatar(db: Session, user_id: int, avatar_url: str):
    db_user = get_user(db, user_id)
    if db_user:
        db_user.avatar_url = avatar_url
        db.commit()
        db.refresh(db_user)
    return db_user

# User CV CRUD
def create_user_cv(db: Session, filename: str, file_data: bytes, user_id: int):
    db_cv = models.UserCV(filename=filename, file_data=file_data, user_id=user_id)
    db.add(db_cv)
    db.commit()
    db.refresh(db_cv)
    return db_cv

def get_user_cvs(db: Session, user_id: int):
    return db.query(models.UserCV).filter(models.UserCV.user_id == user_id).all()

def get_user_cv(db: Session, cv_id: int, user_id: int):
    return db.query(models.UserCV).filter(models.UserCV.id == cv_id, models.UserCV.user_id == user_id).first()

def delete_user_cv(db: Session, cv_id: int, user_id: int):
    db_cv = get_user_cv(db, cv_id, user_id)
    if db_cv:
        db.delete(db_cv)
        db.commit()
    return db_cv

from typing import Optional

# Job Offer CRUD
def get_job_offers(db: Session, user_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.JobOffer)
    if user_id is not None:
        query = query.filter(models.JobOffer.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def get_job_offer(db: Session, job_offer_id: int):
    return db.query(models.JobOffer).filter(models.JobOffer.id == job_offer_id).first()

def create_job_offer(db: Session, job_offer: schemas.JobOfferCreate, user_id: int):
    db_job_offer = models.JobOffer(**job_offer.dict(), user_id=user_id)
    db.add(db_job_offer)
    db.commit()
    db.refresh(db_job_offer)
    return db_job_offer

def update_job_offer(db: Session, job_offer_id: int, job_offer: schemas.JobOfferCreate, user_id: int):
    db_job_offer = get_job_offer(db, job_offer_id)
    if db_job_offer:
        # Check if user owns it or if we want to allow editing global offers (assuming creator can edit)
        # For now, let's allow the operation if the user is the owner, OR maybe just allow it since it's global?
        # The original code enforced ownership. Let's keep strict ownership for editing for safety,
        # unless user wants collaborative editing. "visible to all" implies read access.
        # So check user_id if we want modification rights. 
        # But get_job_offer above removed user_id check. Let's re-add a check here or use a helper.
        if db_job_offer.user_id == user_id: 
            for key, value in job_offer.dict().items():
                setattr(db_job_offer, key, value)
            db.commit()
            db.refresh(db_job_offer)
    return db_job_offer

def delete_job_offer(db: Session, job_offer_id: int, user_id: int):
    db_job_offer = get_job_offer(db, job_offer_id)
    if db_job_offer and db_job_offer.user_id == user_id:
        db.delete(db_job_offer)
        db.commit()
    return db_job_offer

def track_job_offer(db: Session, job_offer_id: int, user_id: int):
    # 1. Get the global offer
    offer = get_job_offer(db, job_offer_id)
    if not offer:
        return None
        
    # 2. Check overlap (simple check by link or title+company)
    # We don't have company in JobOffer explicitly sometimes, just title/link.
    # Check by Offer Link if exists
    existing_q = db.query(models.Application).filter(models.Application.user_id == user_id)
    if offer.offer_link:
        existing = existing_q.filter(models.Application.offer_link == offer.offer_link).first()
        if existing:
            return existing
            
    # 3. Create Application
    # We need to map JobOffer fields to Application fields
    # JobOffer: offer_title, offer_link, platform
    # Application: position, offer_link, company (unknown), final_status
    
    from datetime import date
    
    new_app = models.Application(
        user_id=user_id,
        company="Unknown (From Global Offer)", # Placeholder as JobOffer doesn't strictly have Company column in models.py (Wait, let me check models.py)
        # Checking models.py from Step 134: JobOffer has offer_title, offer_link, platform, type, etc. NO Company column.
        position=offer.offer_title,
        offer_link=offer.offer_link,
        company_link=offer.profile_link,
        final_status="Pending", # Assume if we track it, we applied or are interested
        dm_sent_date=date.today()
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

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
    # 1. Create the Application (Private)
    db_application = models.Application(**application.dict(), user_id=user_id)
    db.add(db_application)
    
    # 2. Create the Job Offer (Public/Shared)
    # Determine platform
    # Determine platform
    platform = "Web"
    if application.offer_link:
        if "linkedin.com" in application.offer_link:
            platform = "LinkedIn"
        elif "indeed.com" in application.offer_link:
            platform = "Indeed"
        elif "glassdoor.com" in application.offer_link:
            platform = "Glassdoor"
        elif "wttj" in application.offer_link or "welcometothejungle" in application.offer_link:
            platform = "WTTJ"
            
    from datetime import date
    
    db_job_offer = models.JobOffer(
        user_id=user_id,
        platform=platform,
        type="Unknown", # Default
        registration_done=False,
        offer_title=application.position,
        offer_link=application.offer_link,
        save_date=date.today(),
        application_sent=True, # Since we allow creating an application, we assume it's applied/in progress
        application_date=date.today(),
        status=application.final_status
    )
    db.add(db_job_offer)
    
    db.commit()
    db.refresh(db_application)
    # We don't necessarily need to return the job offer, just the application as expected by the endpoint
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
    
    # Platform distribution (Based on Applications)
    platforms = defaultdict(int)
    for app in applications:
        ptype = "Web"
        link = app.offer_link or app.company_link or ""
        if "linkedin" in link:
            ptype = "LinkedIn"
        elif "indeed" in link:
            ptype = "Indeed"
        elif "glassdoor" in link:
            ptype = "Glassdoor"
        elif "wttj" in link or "welcometothejungle" in link:
            ptype = "WTTJ"
        elif "hellowork" in link:
            ptype = "HelloWork"
        
        platforms[ptype] += 1
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

def get_admin_stats(db: Session):
    try:
        # Check if tables likely exist by doing a simple count
        # If OperationalError (no such table), it will be caught
        total_users = db.query(models.User).count()
        total_apps = db.query(models.Application).count()
        total_offers = db.query(models.JobOffer).count()
        
        # Unique companies
        from sqlalchemy import func
        total_companies = db.query(func.count(func.distinct(models.Application.company))).scalar() or 0
        
        # Platforms (All Apps)
        apps = db.query(models.Application).all()
        platforms = defaultdict(int)
        for app in apps:
            ptype = "Web"
            link = app.offer_link or app.company_link or ""
            if "linkedin" in link: ptype = "LinkedIn"
            elif "indeed" in link: ptype = "Indeed"
            elif "glassdoor" in link: ptype = "Glassdoor"
            elif "wttj" in link or "welcometothejungle" in link: ptype = "WTTJ"
            elif "hellowork" in link: ptype = "HelloWork"
            platforms[ptype] += 1
        
        platforms_list = [{"name": k, "value": v} for k, v in platforms.items()]
        
        return {
            "total_users": total_users,
            "total_applications": total_apps,
            "total_offers": total_offers,
            "total_companies": total_companies,
            "applications_by_platform": platforms_list,
            "recent_activity": [] 
        }
    except Exception as e:
        print(f"DEBUG: get_admin_stats failed (likely DB reset): {e}")
        return {
            "total_users": 0,
            "total_applications": 0,
            "total_offers": 0,
            "total_companies": 0,
            "applications_by_platform": [],
            "recent_activity": [] 
        }

def get_all_users_overview(db: Session):
    try:
        users = db.query(models.User).all()
        result = []
        for u in users:
            app_count = db.query(models.Application).filter(models.Application.user_id == u.id).count()
            offer_count = db.query(models.JobOffer).filter(models.JobOffer.user_id == u.id).count()
            result.append({
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "applications_count": app_count,
                "offers_count": offer_count,
                "last_active": "N/A"
            })
        return result
    except Exception as e:
        print(f"DEBUG: get_all_users_overview failed: {e}")
        return []

def delete_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False
    
    # Manually delete related items if cascade is not set up in DB level (safer)
    db.query(models.Application).filter(models.Application.user_id == user_id).delete()
    db.query(models.JobOffer).filter(models.JobOffer.user_id == user_id).delete()
    db.query(models.LinkedInActivity).filter(models.LinkedInActivity.user_id == user_id).delete()
    db.query(models.Recruiter).filter(models.Recruiter.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    return True

def get_user_detailed_stats(db: Session, user_id: int):
    import datetime
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
        
    # Stats
    total_apps = db.query(models.Application).filter(models.Application.user_id == user_id).count()
    total_offers = db.query(models.JobOffer).filter(models.JobOffer.user_id == user_id).count()
    
    # Recent Activity (Last 20 items combined from Apps and Offers)
    # Using simple fetch and memory sort
    recent_apps = db.query(models.Application).filter(models.Application.user_id == user_id).order_by(models.Application.id.desc()).limit(20).all()
    
    history = []
    for app in recent_apps:
        history.append({
            "type": "Application",
            "target": f"{app.company} - {app.position}",
            "date": app.dm_sent_date or "N/A",  # Rough approx of time
            "status": app.final_status
        })
    
    # Also fetch recent offers
    recent_offers = db.query(models.JobOffer).filter(models.JobOffer.user_id == user_id).order_by(models.JobOffer.id.desc()).limit(10).all()
    for offer in recent_offers:
        history.append({
            "type": "Offer",
            "target": f"{offer.company_name} - {offer.position_title}",
            "date": offer.application_date or "N/A",
            "status": offer.status
        })
        
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "total_applications": total_apps,
        "total_offers": total_offers,
        "apps_today": 0, # TODO: Calculate real daily apps
        "recent_history": history
    }

def get_all_job_offers(db: Session, limit: int = 100):
    try:
        offers = db.query(models.JobOffer).join(models.User).order_by(models.JobOffer.id.desc()).limit(limit).all()
        # Join to get user info if relationship exists, or manual fetch
        # Assuming eager load or lazy load works, or manual construction
        result = []
        for o in offers:
            # Safely access user
            user_email = "Unknown"
            if o.owner:
                user_email = o.owner.email
                
            result.append({
                "id": o.id,
                "company_name": o.company_name,
                "position_title": o.position_title,
                "status": o.status,
                "salary_range": o.salary_range,
                "user_email": user_email,
                "created_at": o.application_date # Using application_date as proxy for created
            })
        return result
    except Exception as e:
        print(f"Error fetching all offers: {e}")
        return []

def delete_job_offer(db: Session, offer_id: int):
    offer = db.query(models.JobOffer).filter(models.JobOffer.id == offer_id).first()
    if offer:
        db.delete(offer)
        db.commit()
        return True
    return False
    return False

def get_recent_system_activity(db: Session, limit: int = 15):
    """
    Fetches recent activity across the system: New Users, New Offers, New Applications.
    Since we don't have a unified 'created_at' in all tables, we use ID desc as proxy for 'newest'.
    """
    users_list = []
    offers_list = []
    apps_list = []

    # 1. New Users
    users = db.query(models.User).order_by(models.User.id.desc()).limit(5).all()
    for u in users:
        users_list.append({
            "id": f"u-{u.id}",
            "text": f"New User Registered: {u.full_name or u.email.split('@')[0]}",
            "time": "Recently",
            "type": "user",
            "icon_type": "user"
        })

    # 2. New Job Offers
    offers = db.query(models.JobOffer).order_by(models.JobOffer.id.desc()).limit(5).all()
    for o in offers:
        offers_list.append({
            "id": f"o-{o.id}",
            "text": f"New Offer Added: {o.offer_title} at {o.platform}",
            "time": str(o.save_date) if o.save_date else "Recently",
            "type": "offer",
            "icon_type": "briefcase"
        })

    # 3. New Applications
    apps = db.query(models.Application).order_by(models.Application.id.desc()).limit(5).all()
    for a in apps:
        apps_list.append({
            "id": f"a-{a.id}",
            "text": f"Application: {a.position} @ {a.company}",
            "time": str(a.dm_sent_date) if a.dm_sent_date else "Pending",
            "type": "application",
            "icon_type": "file-text"
        })
    
    # Interleave
    mixed = []
    max_len = max(len(users_list), len(offers_list), len(apps_list))
    for i in range(max_len):
        if i < len(users_list): mixed.append(users_list[i])
        if i < len(offers_list): mixed.append(offers_list[i])
        if i < len(apps_list): mixed.append(apps_list[i])
    
    return mixed[:limit]

