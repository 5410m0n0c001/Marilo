import os
import json
import re
import cohere
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

# We will read extracted_corpus.json
corpus_json_path = r"C:\Users\Lenovo\.gemini\antigravity\brain\9dbe3296-2d22-46c9-95bd-9fcbfecca76b\scratch\extracted_corpus.json"

# Initialize APIs
COHERE_API_KEY = os.environ.get("COHERE_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") # service_role key

if not COHERE_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Missing environment variables! Please make sure to set:")
    print("COHERE_API_KEY, SUPABASE_URL, SUPABASE_KEY")

def chunk_text(law_name, article_num, text):
    chunks = []
    
    if law_name == "CPEUM":
        if article_num == "1":
            # Art. 1 is short, we can split by paragraph (split by double newline)
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            for i, p in enumerate(paragraphs):
                chunks.append({
                    "source": f"Constitución Art. 1 (Párrafo {i+1})",
                    "content": p
                })
        elif article_num == "4":
            # Art. 4 has multiple paragraphs covering different rights
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            for i, p in enumerate(paragraphs):
                chunks.append({
                    "source": f"Constitución Art. 4 (Párrafo {i+1})",
                    "content": p
                })
        elif article_num == "14":
            # Art. 14 is very short (811 chars), keep as 1 chunk
            chunks.append({
                "source": "Constitución Art. 14",
                "content": text
            })
        elif article_num == "16":
            # Art. 16 is medium, split by paragraphs
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            for i, p in enumerate(paragraphs):
                chunks.append({
                    "source": f"Constitución Art. 16 (Párrafo {i+1})",
                    "content": p
                })
        elif article_num == "123":
            # Art 123 is huge. Let's split it semantically.
            # First split into introduction, Apartado A, and Apartado B.
            parts = re.split(r"(Apartado A\.-|Apartado B\.-)", text)
            
            # parts[0] is intro
            if parts[0].strip():
                chunks.append({
                    "source": "Constitución Art. 123 (Introducción)",
                    "content": parts[0].strip()
                })
            
            # Walk through parts
            i = 1
            while i < len(parts):
                apartado_name = parts[i].strip() # "Apartado A.-" or "Apartado B.-"
                apartado_text = parts[i+1].strip() if i+1 < len(parts) else ""
                
                # Split the apartado text by its fractions: e.g. "I. ", "II. ", "III. ", etc. at start of line
                # Let's match roman numerals at start of line: e.g. "^[IXV]+\.\s+" or "^[0-9]+\.\s+" or "**I.**"
                fraction_pattern = re.compile(r"(?:^|\n)(?:\*\*([IVXLCDM\d]+)\.\*\*|([IVXLCDM\d]+)\.)\s+")
                
                # Let's find matches
                splits = re.split(fraction_pattern, apartado_text)
                # re.split with groups returns: [text_before, group1, group2, text_after, group1, group2, ...]
                # Let's reconstruct fractions
                intro_apartado = splits[0].strip()
                if intro_apartado:
                    chunks.append({
                        "source": f"Constitución Art. 123 ({apartado_name} - Intro)",
                        "content": f"{apartado_name} {intro_apartado}"
                    })
                
                idx = 1
                while idx < len(splits):
                    frac_num = splits[idx] if splits[idx] else splits[idx+1]
                    frac_content = splits[idx+2].strip() if idx+2 < len(splits) else ""
                    if frac_num and frac_content:
                        chunks.append({
                            "source": f"Constitución Art. 123 ({apartado_name} Fracción {frac_num})",
                            "content": f"Constitución Art. 123, {apartado_name} Fracción {frac_num}: {frac_content}"
                        })
                    idx += 3
                
                i += 2
    elif law_name == "LFT":
        # Keep LFT articles as individual chunks
        chunks.append({
            "source": f"Ley Federal del Trabajo Art. {article_num}",
            "content": text
        })
    elif law_name == "CCF":
        # Keep CCF articles as individual chunks
        chunks.append({
            "source": f"Código Civil Federal Art. {article_num}",
            "content": text
        })
        
    return chunks

def main():
    print("Loading extracted corpus...")
    with open(corpus_json_path, "r", encoding="utf-8") as f:
        corpus = json.load(f)
    
    all_chunks = []
    
    # Process CPEUM
    for art, text in corpus["CPEUM"].items():
        all_chunks.extend(chunk_text("CPEUM", art, text))
        
    # Process LFT
    for art, text in corpus["LFT"].items():
        all_chunks.extend(chunk_text("LFT", art, text))
        
    # Process CCF
    for art, text in corpus["CCF"].items():
        all_chunks.extend(chunk_text("CCF", art, text))
        
    print(f"Total semantic chunks generated: {len(all_chunks)}")
    
    # Verify a few samples
    print("\nSample chunks:")
    for c in all_chunks[:3]:
        print(f"- Source: {c['source']}")
        print(f"  Content: {c['content'][:150]}...\n")
        
    for c in all_chunks[-2:]:
        print(f"- Source: {c['source']}")
        print(f"  Content: {c['content'][:150]}...\n")
        
    if not COHERE_API_KEY or not SUPABASE_URL or not SUPABASE_KEY:
        print("Env variables not set, skipping API calls and database insertion.")
        return
        
    # Initialize Cohere and Supabase Clients
    print("Initializing Cohere and Supabase clients...")
    co = cohere.Client(COHERE_API_KEY)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Generate embeddings and insert into Supabase in batches
    batch_size = 50
    print(f"Uploading chunks in batches of {batch_size}...")
    
    for idx in range(0, len(all_chunks), batch_size):
        batch = all_chunks[idx:idx+batch_size]
        texts = [c["content"] for c in batch]
        
        try:
            print(f"Generating embeddings for batch {idx // batch_size + 1}...")
            response = co.embed(
                texts=texts,
                model="embed-multilingual-v3.0",
                input_type="search_document"
            )
            embeddings = response.embeddings
            
            records = []
            for j, c in enumerate(batch):
                records.append({
                    "source": c["source"],
                    "content": c["content"],
                    "embedding": embeddings[j]
                })
                
            print(f"Inserting batch {idx // batch_size + 1} into Supabase...")
            result = supabase.table("legal_chunks").insert(records).execute()
            print(f"Inserted {len(records)} records successfully.")
            
        except Exception as e:
            print(f"Error processing batch starting at index {idx}: {e}")
            break
            
    print("Corpus uploading process complete!")

if __name__ == "__main__":
    main()
