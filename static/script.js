// ========== Theme Toggle ==========
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    setTheme('dark');
} else if (savedTheme === 'light') {
    setTheme('light');
} else if (prefersDarkScheme.matches) {
    setTheme('dark');
} else {
    setTheme('light');
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        setTheme('light');
    } else {
        setTheme('dark');
    }
});

// ========== Existing code (unchanged) ==========
// Toggle between PDF and URL inputs
const sourceRadios = document.querySelectorAll('input[name="sourceType"]');
const pdfDiv = document.getElementById('pdfInput');
const urlDiv = document.getElementById('urlInput');
const loadStatus = document.getElementById('loadStatus');

sourceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'pdf') {
            pdfDiv.style.display = 'block';
            urlDiv.style.display = 'none';
        } else {
            pdfDiv.style.display = 'none';
            urlDiv.style.display = 'block';
        }
    });
});

// Load document
const loadBtn = document.getElementById('loadBtn');

loadBtn.addEventListener('click', async () => {
    const sourceType = document.querySelector('input[name="sourceType"]:checked').value;
    let payload = { type: sourceType };

    if (sourceType === 'pdf') {
        const fileInput = document.getElementById('pdfFile');
        const file = fileInput.files[0];
        if (!file) {
            showStatus('Please select a PDF file.', 'error');
            return;
        }
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            payload.file = reader.result;
            await sendLoad(payload);
        };
        reader.onerror = () => showStatus('Error reading file.', 'error');
    } else {
        const url = document.getElementById('url').value.trim();
        if (!url) {
            showStatus('Please enter a URL.', 'error');
            return;
        }
        payload.url = url;
        await sendLoad(payload);
    }
});

async function sendLoad(payload) {
    showStatus('Loading document...', 'info');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
        const response = await fetch('/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            showStatus(`✅ Document loaded! Created ${data.num_chunks} chunks.`, 'success');
            // Removed the bot message from the chat
        } else {
            showStatus(`❌ Error: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            showStatus('❌ Request timed out. The document may be too large or the server is busy.', 'error');
        } else {
            showStatus(`❌ Network error: ${err.message}`, 'error');
        }
    }
}

function showStatus(message, type) {
    loadStatus.textContent = message;
    loadStatus.className = `status-message ${type}`;
    if (type === 'success') {
        setTimeout(() => {
            loadStatus.style.display = 'none';
            loadStatus.className = 'status-message';
        }, 3000);
    }
}

// Ask question
const askBtn = document.getElementById('askBtn');
const questionInput = document.getElementById('question');
const chatMessages = document.getElementById('chatMessages');

// Add a message to the chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add a loading indicator
function addLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = 'loading-message';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<div class="loading"><span class="spinner"></span> Thinking...</div>';
    loadingDiv.appendChild(contentDiv);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) loadingMsg.remove();
}

askBtn.addEventListener('click', async () => {
    const question = questionInput.value.trim();
    if (!question) {
        addMessage('Please enter a question.', 'bot');
        return;
    }
    
    // Add user message to chat
    addMessage(question, 'user');
    questionInput.value = '';
    
    // Add loading indicator
    addLoadingMessage();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        removeLoadingMessage();
        
        if (response.ok) {
            addMessage(data.answer, 'bot');
        } else {
            addMessage(`Error: ${data.error || 'Unknown error'}`, 'bot');
        }
    } catch (err) {
        clearTimeout(timeoutId);
        removeLoadingMessage();
        if (err.name === 'AbortError') {
            addMessage('Request timed out. Please try again.', 'bot');
        } else {
            addMessage(`Network error: ${err.message}`, 'bot');
        }
    }
});

// Allow Enter to send (Shift+Enter for newline)
questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askBtn.click();
    }
});

// ========== Clear Chat Button ==========
const clearChatBtn = document.getElementById('clearChatBtn');

function clearChat() {
    // Keep only the initial bot welcome message
    chatMessages.innerHTML = '';
    addMessage("Hello! I'm your document assistant. Load a PDF or website, then ask me anything about it.", 'bot');
}

clearChatBtn.addEventListener('click', clearChat);