import os
import openai
import chromadb
import requests
from bs4 import BeautifulSoup
import PyPDF2
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='templates')
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024   # 50 MB max upload
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("Please set OPENAI_API_KEY in .env file.")
openai.api_key = OPENAI_API_KEY

CHROMA_DB_PATH = "./chroma_db"
COLLECTION_NAME = "my_docs"
CHUNK_SIZE = 500          # smaller chunks for code
CHUNK_OVERLAP = 100       # overlap to preserve continuity

client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

# ----- Helper functions -----
def load_pdf(file_path):
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        print("\n=== Extracted PDF text sample (first 500 chars) ===")
        print(text[:500])
        print("=================================================\n")
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def load_website(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        text = "\n".join(line for line in lines if line)
        print("\n=== Extracted website text sample (first 500 chars) ===")
        print(text[:500])
        print("=====================================================\n")
        return text
    except Exception as e:
        print(f"Error loading website: {e}")
        return ""

def split_text(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_text(text)

def get_embeddings(texts):
    response = openai.Embedding.create(
        model="text-embedding-ada-002",
        input=texts
    )
    return [data["embedding"] for data in response["data"]]

def store_in_chromadb(chunks, embeddings):
    try:
        client.delete_collection(COLLECTION_NAME)
    except:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        collection.add(
            embeddings=[embedding],
            documents=[chunk],
            metadatas=[{"source": "document", "chunk_id": i}],
            ids=[f"chunk_{i}"]
        )
    return collection

def retrieve(query, collection, n_results=7):
    response = openai.Embedding.create(
        model="text-embedding-ada-002",
        input=query
    )
    query_embedding = response["data"][0]["embedding"]
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "distances"]
    )
    chunks = results["documents"][0] if results["documents"] else []
    print("\n=== Retrieved chunks for query: ===")
    print(f"Query: {query}")
    for i, chunk in enumerate(chunks):
        print(f"\n--- Chunk {i+1} (first 300 chars) ---")
        print(chunk[:300])
    return chunks

def generate_answer(query, context_chunks):
    context = "\n\n".join(context_chunks)
    prompt = f"""You are a helpful assistant. Answer the question based on the provided context.
If the question asks for a "brief explanation", provide a concise but complete overview covering the main points.
Include relevant details such as types, algorithms, or components when available.
If the question asks for code, output the code exactly as shown in the context.
Only say "I don't have enough information to answer that." if the context contains no relevant information.

Context:
{context}

Question: {query}

Answer:"""
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You provide thorough yet concise answers, including key details from the context."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=1200
    )
    answer = response.choices[0].message.content.strip()
    print("\n=== Generated answer ===")
    print(answer)
    return answer

# ----- Routes -----
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ping')
def ping():
    return "pong"

@app.route('/routes')
def list_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(f"{rule.endpoint}: {rule.methods} {rule}")
    return "<br>".join(routes)

@app.route('/test-post', methods=['POST'])
def test_post():
    return jsonify({'message': 'POST works'})

@app.route('/load', methods=['POST'])
def load_document():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data'}), 400

        source_type = data.get('type')
        if source_type == 'pdf':
            file_data = data.get('file')
            if not file_data:
                return jsonify({'error': 'No file data'}), 400
            import base64
            import uuid
            filename = secure_filename(f"{uuid.uuid4().hex}.pdf")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(file_data.split(',')[1]))
            text = load_pdf(filepath)
            os.remove(filepath)
        elif source_type == 'url':
            url = data.get('url')
            if not url:
                return jsonify({'error': 'No URL provided'}), 400
            text = load_website(url)
        else:
            return jsonify({'error': 'Invalid source type'}), 400

        if not text:
            return jsonify({'error': 'Could not extract text from source'}), 400

        chunks = split_text(text)
        if not chunks:
            return jsonify({'error': 'No text chunks created'}), 400

        embeddings = get_embeddings(chunks)
        store_in_chromadb(chunks, embeddings)

        print(f"✅ Document loaded! Created {len(chunks)} chunks.")
        return jsonify({'status': 'success', 'num_chunks': len(chunks)})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        question = request.get_json().get('question')
        if not question:
            return jsonify({'error': 'No question provided'}), 400

        try:
            collection = client.get_collection(COLLECTION_NAME)
        except:
            return jsonify({'error': 'No document loaded yet. Please load a document first.'}), 400

        relevant_chunks = retrieve(question, collection, n_results=7)
        if not relevant_chunks:
            return jsonify({'answer': 'No relevant information found.'})

        answer = generate_answer(question, relevant_chunks)
        return jsonify({'answer': answer})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)