import os
import sys
from dotenv import load_dotenv

def check_env():
    load_dotenv()
    required_vars = ["GOOGLE_API_KEY", "DATABASE_URL"]
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        sys.exit(1)
    
    print("✅ All required environment variables are set.")
    sys.exit(0)

if __name__ == "__main__":
    check_env()
