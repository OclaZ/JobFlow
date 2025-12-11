from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import schemas
import sys

def promote_to_admin(email: str):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return
        
        user.role = schemas.UserRole.ADMIN
        db.commit()
        print(f"Success! User {email} is now an ADMIN.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
    else:
        promote_to_admin(sys.argv[1])
