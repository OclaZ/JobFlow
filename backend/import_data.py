import pandas as pd
from sqlalchemy.orm import Session
from . import models, schemas, database, crud, auth
import math
from datetime import datetime

def parse_date(date_val):
    if pd.isna(date_val):
        return None
    try:
        return date_val.date()
    except:
        return None

def parse_bool(val):
    if isinstance(val, str):
        return val.lower() == "oui"
    return False

def import_data():
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    
    # Create default user
    email = "admin@example.com"
    user = crud.get_user_by_email(db, email=email)
    if not user:
        print(f"Creating default user: {email}")
        user_in = schemas.UserCreate(
            email=email,
            password="password",
            full_name="Admin User",
            role=schemas.UserRole.ADMIN
        )
        user = crud.create_user(db, user_in)
    else:
        print(f"User {email} already exists")

    file_path = r"d:\postulation\Aslikh Hamza ¬ Dashboard Individuel de suivi TRE.xlsx"
    xls = pd.ExcelFile(file_path)

    # Import Job Offers
    if "Plateformes_Offres" in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name="Plateformes_Offres")
        print(f"Importing {len(df)} job offers...")
        for _, row in df.iterrows():
            if pd.isna(row.get("Plateforme")) and pd.isna(row.get("Offre identifiée (Titre)")):
                continue
            
            offer = models.JobOffer(
                user_id=user.id,
                platform=str(row.get("Plateforme")) if not pd.isna(row.get("Plateforme")) else "Unknown",
                type=str(row.get("Type")) if not pd.isna(row.get("Type")) else None,
                registration_done=parse_bool(row.get("Inscription faite ?")),
                registration_date=parse_date(row.get("Date inscription")),
                profile_link=str(row.get("Lien Profil")) if not pd.isna(row.get("Lien Profil")) else None,
                offer_title=str(row.get("Offre identifiée (Titre)")) if not pd.isna(row.get("Offre identifiée (Titre)")) else "Untitled",
                offer_link=str(row.get("Lien Offre")) if not pd.isna(row.get("Lien Offre")) else None,
                save_date=parse_date(row.get("Date sauvegarde")),
                application_sent=parse_bool(row.get("Candidature envoyée ?")),
                application_date=parse_date(row.get("Date candidature")),
                status=str(row.get("Statut candidature")) if not pd.isna(row.get("Statut candidature")) else "Pending"
            )
            db.add(offer)
    
    # Import Recruiters
    if "Recruteurs_TA" in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name="Recruteurs_TA")
        print(f"Importing {len(df)} recruiters...")
        for _, row in df.iterrows():
            if pd.isna(row.get("Nom")) and pd.isna(row.get("Entreprise")):
                continue

            recruiter = models.Recruiter(
                user_id=user.id,
                name=str(row.get("Nom")) if not pd.isna(row.get("Nom")) else "Unknown",
                company=str(row.get("Entreprise")) if not pd.isna(row.get("Entreprise")) else "Unknown",
                linkedin_profile=str(row.get("Lien Profil LinkedIn")) if not pd.isna(row.get("Lien Profil LinkedIn")) else None,
                sector=str(row.get("Secteur")) if not pd.isna(row.get("Secteur")) else None,
                connection_request_sent=parse_bool(row.get("Demande connexion envoyée ?")),
                request_date=parse_date(row.get("Date envoi")),
                connection_status=str(row.get("Statut connexion")) if not pd.isna(row.get("Statut connexion")) else "Pending",
                dm_sent=parse_bool(row.get("DM envoyé ?")),
                dm_date=parse_date(row.get("Date DM")),
                message_type=str(row.get("Type de Message envoyé")) if not pd.isna(row.get("Type de Message envoyé")) else None,
                response_received=parse_bool(row.get("Réponse obtenue ?")),
                notes=str(row.get("Notes / Suivi")) if not pd.isna(row.get("Notes / Suivi")) else None
            )
            db.add(recruiter)

    # Import LinkedIn Activities
    if "Animation_LinkedIn_3C" in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name="Animation_LinkedIn_3C")
        print(f"Importing {len(df)} activities...")
        for _, row in df.iterrows():
            if pd.isna(row.get("Date")): # Assuming Date is required
                continue
                
            # Determine type and link based on flags
            activity_type = "Other"
            link = None
            description = ""
            
            if parse_bool(row.get("Action Commenter")):
                activity_type = "Comment"
                link = str(row.get("Lien Publication")) if not pd.isna(row.get("Lien Publication")) else None
            elif parse_bool(row.get("Action Complimenter")):
                activity_type = "Like/Compliment"
                link = str(row.get("Lien Post")) if not pd.isna(row.get("Lien Post")) else None
            elif parse_bool(row.get("Action Cibler (Ressource)")):
                activity_type = "Target Resource"
                link = str(row.get("Lien Ressource")) if not pd.isna(row.get("Lien Ressource")) else None
            
            obs = str(row.get("Observations")) if not pd.isna(row.get("Observations")) else ""
            if obs:
                description = obs
            else:
                description = f"Activity: {activity_type}"

            activity = models.LinkedInActivity(
                user_id=user.id,
                activity_date=parse_date(row.get("Date")),
                activity_type=activity_type,
                description=description,
                link=link
            )
            db.add(activity)

    # Import Applications
    if "Candidatures_Relances" in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name="Candidatures_Relances")
        print(f"Importing {len(df)} applications...")
        for _, row in df.iterrows():
            if pd.isna(row.get("Entreprise")) and pd.isna(row.get("Poste")):
                continue

            app_entry = models.Application(
                user_id=user.id,
                company=str(row.get("Entreprise")) if not pd.isna(row.get("Entreprise")) else "Unknown",
                position=str(row.get("Poste")) if not pd.isna(row.get("Poste")) else "Unknown",
                company_link=str(row.get("Lien Entreprise")) if not pd.isna(row.get("Lien Entreprise")) else None,
                offer_link=str(row.get("Lien Offre")) if not pd.isna(row.get("Lien Offre")) else None,
                recruiter_name=str(row.get("Recruteur Associé")) if not pd.isna(row.get("Recruteur Associé")) else None,
                dm_sent_date=parse_date(row.get("Date DM envoyé")),
                follow_up_5_date=parse_date(row.get("Relance J+5")),
                follow_up_15_date=parse_date(row.get("Relance J+15")),
                follow_up_30_date=parse_date(row.get("Relance J+30")),
                final_status=str(row.get("Statut Final")) if not pd.isna(row.get("Statut Final")) else "Pending",
                notes=str(row.get("Notes")) if not pd.isna(row.get("Notes")) else None
            )
            db.add(app_entry)

    db.commit()
    print("Import completed.")
    db.close()

if __name__ == "__main__":
    import_data()
