import os
import cohere
from dotenv import load_dotenv

# Load env variables
load_dotenv(dotenv_path=r"C:\Users\Lenovo\Documents\marilo\.env")

api_key = os.environ.get("COHERE_API_KEY")

print(f"Cohere Key length: {len(api_key) if api_key else 0} chars")

if not api_key:
    print("Error: Missing Cohere key in .env file!")
    exit(1)

try:
    print("Initializing Cohere Client...")
    co = cohere.Client(api_key)
    print("Generating a test embedding...")
    response = co.embed(
        texts=["Hola mundo legal"],
        model="embed-multilingual-v3.0",
        input_type="search_query"
    )
    print("Connection successful! Embedding generated successfully!")
    print(f"Embedding dimensions: {len(response.embeddings[0])}")
except Exception as e:
    print(f"Cohere verification failed: {e}")
