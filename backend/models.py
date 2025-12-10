from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Float, Enum
from sqlalchemy.orm import relationship
import enum
try:
    from .database import Base
except ImportError:
    from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    COLLABORATEUR = "collaborateur"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.COLLABORATEUR)
    
    # Relationships
    job_offers = relationship("JobOffer", back_populates="owner")
    recruiters = relationship("Recruiter", back_populates="owner")
    linkedin_activities = relationship("LinkedInActivity", back_populates="owner")
    applications = relationship("Application", back_populates="owner")

class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    platform = Column(String, index=True) # Plateforme
    type = Column(String) # Type
    registration_done = Column(Boolean, default=False) # Inscription faite ?
    registration_date = Column(Date, nullable=True) # Date inscription
    profile_link = Column(String, nullable=True) # Lien Profil
    offer_title = Column(String, index=True) # Offre identifiée (Titre)
    offer_link = Column(String, nullable=True) # Lien Offre
    save_date = Column(Date, nullable=True) # Date sauvegarde
    application_sent = Column(Boolean, default=False) # Candidature envoyée ?
    application_date = Column(Date, nullable=True) # Date candidature
    status = Column(String, default="Pending") # Statut candidature

    owner = relationship("User", back_populates="job_offers")

class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String, index=True) # Nom
    company = Column(String, index=True) # Entreprise
    linkedin_profile = Column(String, nullable=True) # Lien Profil LinkedIn
    sector = Column(String, nullable=True) # Secteur
    connection_request_sent = Column(Boolean, default=False) # Demande connexion envoyée ?
    request_date = Column(Date, nullable=True) # Date envoi
    connection_status = Column(String, default="Pending") # Statut connexion
    dm_sent = Column(Boolean, default=False) # DM envoyé ?
    dm_date = Column(Date, nullable=True) # Date DM
    message_type = Column(String, nullable=True) # Type de Message envoyé
    response_received = Column(Boolean, default=False) # Réponse obtenue ?
    notes = Column(String, nullable=True) # Notes / Suivi

    owner = relationship("User", back_populates="recruiters")

class LinkedInActivity(Base):
    __tablename__ = "linkedin_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    activity_date = Column(Date) # Date
    activity_type = Column(String) # Type (Post, Comment, etc.)
    description = Column(String) # Description
    link = Column(String, nullable=True) # Link

    owner = relationship("User", back_populates="linkedin_activities")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    company = Column(String, index=True) # Entreprise
    position = Column(String, index=True) # Poste
    company_link = Column(String, nullable=True) # Lien Entreprise
    offer_link = Column(String, nullable=True) # Lien Offre
    recruiter_name = Column(String, nullable=True) # Recruteur Associé (Could be FK but keeping simple as per Excel)
    dm_sent_date = Column(Date, nullable=True) # Date DM envoyé
    follow_up_5_date = Column(Date, nullable=True) # Relance J+5
    follow_up_15_date = Column(Date, nullable=True) # Relance J+15
    follow_up_30_date = Column(Date, nullable=True) # Relance J+30
    final_status = Column(String, default="Pending") # Statut Final
    notes = Column(String, nullable=True) # Notes

    owner = relationship("User", back_populates="applications")
