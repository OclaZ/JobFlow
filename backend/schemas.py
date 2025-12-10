from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

# User Schemas
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    COLLABORATEUR = "collaborateur"

class UserCVBase(BaseModel):
    filename: str

class UserCV(UserCVBase):
    id: int
    user_id: int
    upload_date: datetime

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.COLLABORATEUR
    avatar_url: Optional[str] = None
    auth_provider: Optional[str] = "local"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool = True
    cvs: List[UserCV] = []

    class Config:
        orm_mode = True

# JobOffer Schemas
class JobOfferBase(BaseModel):
    platform: str
    type: Optional[str] = None
    registration_done: bool = False
    registration_date: Optional[date] = None
    profile_link: Optional[str] = None
    offer_title: str
    offer_link: Optional[str] = None
    save_date: Optional[date] = None
    application_sent: bool = False
    application_date: Optional[date] = None
    status: str = "Pending"

class JobOfferCreate(JobOfferBase):
    pass

class JobOffer(JobOfferBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# Recruiter Schemas
class RecruiterBase(BaseModel):
    name: str
    company: str
    linkedin_profile: Optional[str] = None
    sector: Optional[str] = None
    connection_request_sent: bool = False
    request_date: Optional[date] = None
    connection_status: str = "Pending"
    dm_sent: bool = False
    dm_date: Optional[date] = None
    message_type: Optional[str] = None
    response_received: bool = False
    notes: Optional[str] = None

class RecruiterCreate(RecruiterBase):
    pass

class Recruiter(RecruiterBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# LinkedInActivity Schemas
class LinkedInActivityBase(BaseModel):
    activity_date: date
    activity_type: str
    description: str
    link: Optional[str] = None

class LinkedInActivityCreate(LinkedInActivityBase):
    pass

class LinkedInActivity(LinkedInActivityBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# Application Schemas
class ApplicationBase(BaseModel):
    company: str
    position: str
    company_link: Optional[str] = None
    offer_link: Optional[str] = None
    recruiter_name: Optional[str] = None
    dm_sent_date: Optional[date] = None
    follow_up_5_date: Optional[date] = None
    follow_up_15_date: Optional[date] = None
    follow_up_30_date: Optional[date] = None
    final_status: str = "Pending"
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class Application(ApplicationBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
