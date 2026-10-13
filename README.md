# 🤖 RAG Chatbot

A **Retrieval-Augmented Generation (RAG) Chatbot** that answers questions based on uploaded PDF documents or website content. Built using Python, Flask, OpenAI, and ChromaDB, it retrieves relevant information from your knowledge source and generates context-aware responses.

## ✨ Features

- 📄 **Multiple Knowledge Sources:** Upload PDF documents or provide a website URL.
- 💬 **Natural Language Queries:** Ask questions about the loaded content.
- 🔍 **Semantic Search:** Uses OpenAI embeddings (`text-embedding-ada-002`) to retrieve relevant text chunks.
- 🤖 **AI-Powered Responses:** Generates answers using GPT-3.5 Turbo.
- 🌓 **Dark/Light Mode:** Toggle between themes with preferences saved in local storage.
- 🧹 **Clear Chat History:** Clear the conversation with a single click.
- 🎨 **Responsive UI:** Modern interface with a sidebar layout.

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Frontend:** HTML5, CSS3, JavaScript
- **LLM:** OpenAI GPT-3.5 Turbo
- **Embeddings:** OpenAI `text-embedding-ada-002`
- **Vector Database:** ChromaDB
- **Document Processing:** PyPDF2, BeautifulSoup, LangChain text splitter
- **Icons:** Font Awesome

## 📁 Project Structure

```bash
RAG-Chatbot/
├── app.py                  # Flask backend and RAG logic
├── .env                    # OpenAI API key (not committed)
├── .gitignore              # Excludes sensitive and temporary files
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Main application UI
└── static/
    ├── style.css           # Styling and theme support
    └── script.js           # Frontend interactions
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sakshi-Dodke/RAG-Chatbot.git
cd RAG-Chatbot
```

### 2. Create and Activate a Virtual Environment

**Windows (PowerShell):**

```bash
python -m venv venv
venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**

```bash
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Install Dependencies

If `requirements.txt` exists, run:

```bash
pip install -r requirements.txt
```

Otherwise, install the dependencies manually:

```bash
pip install flask openai chromadb PyPDF2 requests beautifulsoup4 langchain python-dotenv
```

### 4. Configure the OpenAI API Key

Create a `.env` file in the project's root directory and add your API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Run the Application

Start the Flask server:

```bash
python app.py
```

Open the local URL displayed in your terminal, typically:

```bash
http://127.0.0.1:5000
```

## 🚀 How to Use

1. Start the application.
2. Upload a PDF document or enter a website URL.
3. Allow the application to process the content.
4. Ask questions related to the uploaded document or website.
5. Review the AI-generated answers.
6. Switch between dark and light themes or clear the chat history as needed.

---

⭐ If you find this project useful, consider giving the repository a star!
