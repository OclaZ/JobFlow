import os
from sqlalchemy import create_engine, text

# Use the URL provided by the user previously
DATABASE_URL = "postgresql://neondb_owner:npg_g0h3qFfEorLp@ep-lively-wildflower-a20k9s96-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

def fix_schema():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        # Check avatar_url
        print("Checking for avatar_url column...")
        try:
            # Attempt to select it to see if it exists
            connection.execute(text("SELECT avatar_url FROM users LIMIT 1"))
            print("avatar_url column exists.")
        except Exception:
            print("avatar_url column missing. Adding it...")
            # We need to rollback the transaction if the previous select failed
            # connection.rollback() # SQLAlchemy might handle this, but with autocommit=False default, transaction is aborted.
            # Actually, just start a new block or allow the error to bubble if I didn't handle it well. 
            # Better way: inspection.
            pass

    # A cleaner way using text execution for altering
    try:
        with engine.connect() as connection:
             with connection.begin():
                connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR"))
                print("Added avatar_url column (if it didn not exist).")
                
                connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR DEFAULT 'local'"))
                print("Added auth_provider column (if it didn not exist).")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    fix_schema()
