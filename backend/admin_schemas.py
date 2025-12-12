from pydantic import BaseModel
from typing import List, Dict, Optional

class GlobalStats(BaseModel):
    total_users: int
    total_applications: int
    total_offers: int
    total_companies: int
    applications_by_platform: List[dict]
    recent_activity: List[Dict[str, str]]

class AdminUserOverview(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    applications_count: int
    offers_count: int
    last_active: Optional[str]  # Just a placeholder for now

    class Config:
        from_attributes = True
