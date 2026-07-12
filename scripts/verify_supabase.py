import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv(dotenv_path=r"C:\Users\Lenovo\Documents\marilo\.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"Supabase URL: {url}")
print(f"Supabase Key length: {len(key) if key else 0} chars")

if not url or not key:
    print("Error: Missing credentials in .env file!")
    exit(1)

try:
    print("Connecting to Supabase...")
    supabase: Client = create_client(url, key)
    print("Querying table 'legal_chunks'...")
    response = supabase.table("legal_chunks").select("source, content").limit(1).execute()
    print("Connection successful! Query returned:")
    print(response.data)
except Exception as e:
    print(f"Supabase verification failed: {e}")
