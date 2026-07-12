import os
import requests
import uuid
from dotenv import load_dotenv

# Load env variables
load_dotenv(dotenv_path=r"C:\Users\Lenovo\Documents\marilo\.env")

WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL") or "http://localhost:5678/webhook/chat-juridico"
CHAT_TOKEN = os.environ.get("X_CHAT_TOKEN") or "AbogadaMarilo2026!"

def run_tests():
    print("=== STARTING END-TO-END CHATBOT TEST ===")
    print(f"Webhook URL: {WEBHOOK_URL}")
    print(f"Token: {CHAT_TOKEN}")
    
    session_id = str(uuid.uuid4())
    print(f"Generated test Session ID: {session_id}\n")
    
    headers = {
        "Content-Type": "application/json",
        "X-Chat-Token": CHAT_TOKEN
    }
    
    questions = [
        "¿Cuáles son los derechos humanos en el Artículo 1 de la Constitución?",
        "¿Cuáles son las causas de terminación de la relación de trabajo en la LFT?",
        "¿Qué es un convenio y un contrato según el Código Civil Federal?",
        "¿Qué pasa si el patrón no comprueba la causa de rescisión?" # 4th message - should be blocked
    ]
    
    for i, q in enumerate(questions):
        print(f"--- Query {i+1} ---")
        print(f"User: {q}")
        
        payload = {
            "session_id": session_id,
            "message": q
        }
        
        try:
            response = requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=30)
            print(f"HTTP Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Bot Response: {data.get('response')}")
                print(f"Question Count: {data.get('question_count')}")
                print(f"Remaining Questions: {data.get('remaining')}")
                print(f"Redirect to WhatsApp: {data.get('redirect_to_whatsapp')}")
                if data.get('redirect_to_whatsapp'):
                    print(f"WhatsApp URL: {data.get('whatsapp_url')}")
            else:
                print(f"Error Response: {response.text}")
                
        except Exception as e:
            print(f"Request failed: {e}")
        print()

if __name__ == "__main__":
    run_tests()
