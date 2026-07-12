import os
import re
from playwright.sync_api import sync_playwright

def main():
    dest_dir = r"C:\Users\Lenovo\.gemini\antigravity\scratch\chrome-profile"
    env_path = r"C:\Users\Lenovo\Documents\marilo\.env"
    
    print("Launching persistent Chrome to extract Supabase publishable & secret keys...")
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
            
            # Click reveal buttons
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
            
            # Extract keys using javascript evaluation to get all texts on the page
            # specifically looking for sb_publishable_ and sb_secret_
            print("Searching DOM elements for keys...")
            all_elements = page.query_selector_all("*")
            
            anon_key = None
            service_role_key = None
            
            for el in all_elements:
                try:
                    text = el.inner_text().strip()
                    if text.startswith("sb_publishable_"):
                        anon_key = text
                        print(f"Found publishable key: {anon_key[:25]}...")
                    elif text.startswith("sb_secret_"):
                        service_role_key = text
                        print(f"Found secret key: {service_role_key[:20]}...")
                except:
                    pass
            
            # Fallback using page.content() regex in case they are stored in raw attributes
            if not service_role_key or not anon_key:
                print("Running regex search on raw page content...")
                html_content = page.content()
                
                pub_match = re.search(r"(sb_publishable_[a-zA-Z0-9_\-]+)", html_content)
                if pub_match and not anon_key:
                    anon_key = pub_match.group(1)
                    print(f"Regex found publishable: {anon_key[:25]}...")
                    
                sec_match = re.search(r"(sb_secret_[a-zA-Z0-9_\-]+)", html_content)
                if sec_match and not service_role_key:
                    service_role_key = sec_match.group(1)
                    print(f"Regex found secret: {service_role_key[:20]}...")
            
            print(f"Final Anon Key: {anon_key[:25] if anon_key else 'None'}...")
            print(f"Final Service Role Key: {service_role_key[:20] if service_role_key else 'None'}...")
            
            # Preserve Cohere API key from .env first
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
            
            # Save screenshot for validation
            screenshot_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\9dbe3296-2d22-46c9-95bd-9fcbfecca76b\supabase_api_keys_done.png"
            page.screenshot(path=screenshot_path)
            
            context.close()
            
        except Exception as e:
            print("Automation failed:", e)

if __name__ == "__main__":
    main()
