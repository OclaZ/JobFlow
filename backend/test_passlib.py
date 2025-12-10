from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    print(pwd_context.hash("password"))
    print("Hash success")
except Exception as e:
    print(f"Hash failed: {e}")
