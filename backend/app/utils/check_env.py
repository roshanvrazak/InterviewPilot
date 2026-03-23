import os
import sys

def check_environment():
    required_vars = ["GOOGLE_API_KEY", "DATABASE_URL"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        print(f"CRITICAL: Missing environment variables: {', '.join(missing)}")
        sys.exit(1)
    print("Environment variables validated.")

if __name__ == "__main__":
    check_environment()
