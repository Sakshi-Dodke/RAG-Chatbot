# 🤖 RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot that answers questions based on uploaded PDFs or website content. Built with Python, Flask, OpenAI, and ChromaDB.

## ✨ Features

- 📄 Upload a PDF or provide a website URL as a knowledge source  
- 💬 Ask natural language questions about the loaded content  
- 🔍 Uses vector embeddings (OpenAI `text-embedding-ada-002`) to retrieve the most relevant chunks  
- 🤖 Generates answers with GPT‑3.5‑Turbo  
- 🌓 Dark / light mode toggle (persisted in local storage)  
- 🧹 Clear chat history button  
- 🎨 Modern, responsive UI with a sidebar layout  

## 🛠️ Tech Stack

- **Backend**: Flask, ChromaDB, OpenAI API  
- **Frontend**: HTML5, CSS3, JavaScript (Font Awesome icons)  
- **Embeddings & Generation**: OpenAI  
- **Document processing**: PyPDF2, BeautifulSoup, LangChain text splitter

## 📁 Project Structure
  RAG-Chatbot/
├── app.py               # Flask backend with RAG logic
├── .env                 # Your OpenAI API key (ignored by Git)
├── .gitignore           # Excludes sensitive and temporary files
├── requirements.txt     # Python dependencies (optional)
├── templates/
│   └── index.html       # Main UI
└── static/
    ├── style.css        # Styling (light/dark mode)
    └── script.js        # Frontend interactivity

## 📦 Installation

1. Clone the repository  
   ```bash
   git clone https://github.com/Sakshi-Dodke/RAG-Chatbot.git
   cd RAG-Chatbot
2. Create a virtual environment
   python -m venv venv
   venv\Scripts\activate         # Windows
3. Install dependencies
   pip install -r requirements.txt
   If you don't have a requirements.txt, install manually:
   pip install flask openai chromadb pypdf2 requests beautifulsoup4 langchain python-dotenv
4. Set up your OpenAI API key
   OPENAI_API_KEY=
5. Start the server
   python app.py
