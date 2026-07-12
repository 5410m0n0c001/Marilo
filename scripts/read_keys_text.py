import os
import re
from playwright.sync_api import sync_playwright

def main():
    dest_dir = r"C:\Users\Lenovo\.gemini\antigravity\scratch\chrome-profile"
    env_path = r"C:\Users\Lenovo\Documents\marilo\.env"
    
    print("Launching persistent Chrome to extract JWT keys...")
    with sync_playwright() as p:
        try:
            context = p.chromium.launch_persistent_context(
                user_data_dir=dest_dir,
                channel="chrome",
                headless=False,
                no_viewport=True
            )
            
            page = context.pages[0] if context.pages else context.new_page()
            
            api_keys_url = "https://supabase.com/dashboard/project/btkgrkkxfdicsyrknabk/settings/api-keys"
            page.goto(api_keys_url, timeout=60000)
            page.wait_for_timeout(8000)
            
            # Click all Reveal buttons
            buttons = page.query_selector_all("button")
            reveal_count = 0
            for btn in buttons:
                html = btn.evaluate("el => el.outerHTML")
                if "reveal" in html.lower() or "eye" in html.lower():
                    try:
                        print("Clicking reveal button...")
                        btn.click()
                        page.wait_for_timeout(1000)
                        reveal_count += 1
                    except Exception as e:
                        print("Click failed:", e)
            
            print(f"Clicked {reveal_count} reveal buttons.")
            page.wait_for_timeout(3000)
            
            # Search the entire page DOM for JWT tokens
            # We can evaluate a script that searches for any text matching eyJ...
            html_content = page.content()
            
            # Regex for JWT tokens: starts with eyJ and has length > 100
            jwt_pattern = re.compile(r"(eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+)")
            matches = jwt_pattern.findall(html_content)
            
            # De-duplicate matches
            matches = list(set(matches))
            print(f"Found {len(matches)} JWT token candidates on the page:")
            
            anon_key = None
            service_role_key = None
            
            for m in matches:
                print(f"  Token candidate: {m[:20]}...")
                # Let's inspect the page content around this match to see if it's service_role or anon
                # Or we can decode the JWT to check!
                # A Supabase JWT contains payload: {"role": "anon"} or {"role": "service_role"}!
                # Decoding a JWT in Python is extremely simple (no library needed, just base64 decode the second part!)
                try:
                    parts = m.split('.')
                    if len(parts) >= 2:
                        payload_b64 = parts[1]
                        # Fix padding
                        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                        import base64
                        payload_json = base64.b64decode(payload_b64).decode('utf-8', errors='ignore')
                        print(f"    Payload: {payload_json}")
                        if '"service_role"' in payload_json or '"role":"service_role"' in payload_json:
                            service_role_key = m
                            print("    Identified as service_role key!")
                        elif '"anon"' in payload_json or '"role":"anon"' in payload_json:
                            anon_key = m
                            print("    Identified as anon key!")
                except Exception as e:
                    print("    Failed to decode payload:", e)
            
            if not service_role_key and len(matches) >= 2:
                # Fallback order
                service_role_key = matches[1]
            elif not service_role_key and len(matches) == 1:
                service_role_key = matches[0]
                
            print(f"Service Role Key: {service_role_key[:20] if service_role_key else 'None'}...")
            
            # Preserve Cohere key from existing .env
            cohere_key = "your_cohere_trial_api_key_here"
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    content = f.read()
                match = re.search(r"COHERE_API_KEY=(.*)", content)
                if match:
                    cohere_key = match.group(1).strip()
            
            # Write to .env
            project_url = "https://btkgrkkxfdicsyrknabk.supabase.co"
            print("Updating .env file...")
            env_content = f"""# Cohere API Credentials
COHERE_API_KEY={cohere_key}

# Supabase Credentials (for chatbot-juridico-mx-demo)
SUPABASE_URL={project_url}
SUPABASE_KEY={service_role_key}
X_CHAT_TOKEN=AbogadaMarilo2026!
"""
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(env_content)
            print(f"Successfully updated credentials in {env_path}!")
            
            context.close()
            
        except Exception as e:
            print("Automation failed:", e)

if __name__ == "__main__":
    main()
