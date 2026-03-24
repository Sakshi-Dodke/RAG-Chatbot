// ========== Conversation Management ==========
let currentConversationId = null;

// Load conversations from localStorage
function loadConversations() {
    const stored = localStorage.getItem('rag_conversations');
    if (!stored) return [];
    return JSON.parse(stored);
}

function saveConversations(conversations) {
    localStorage.setItem('rag_conversations', JSON.stringify(conversations));
}

function getCurrentConversation() {
    const convs = loadConversations();
    if (!currentConversationId) return null;
    return convs.find(c => c.id === currentConversationId);
}

function updateConversationTitle(conversation) {
    // Use first user message as title, else "New Chat"
    const firstUserMsg = conversation.messages.find(m => m.role === 'user');
    conversation.title = firstUserMsg ? firstUserMsg.content.substring(0, 30) : 'New Chat';
    if (conversation.title.length === 30) conversation.title += '…';
    return conversation;
}

function addMessageToCurrentChat(role, content) {
    const convs = loadConversations();
    let conv = convs.find(c => c.id === currentConversationId);
    if (!conv) {
        // Create new conversation if none exists
        conv = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: []
        };
        convs.push(conv);
        currentConversationId = conv.id;
    }
    conv.messages.push({ role, content });
    updateConversationTitle(conv);
    saveConversations(convs);
    renderConversationsList();
}

function renderConversationsList() {
    const convs = loadConversations();
    const listDiv = document.getElementById('conversationsList');
    listDiv.innerHTML = '';
    convs.forEach(conv => {
        const item = document.createElement('div');
        item.className = `conversation-item ${conv.id === currentConversationId ? 'active' : ''}`;
        item.dataset.id = conv.id;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'conversation-title';
        titleSpan.textContent = conv.title;
        titleSpan.title = conv.title;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-conversation';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = 'Delete chat';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        });
        
        item.appendChild(titleSpan);
        item.appendChild(deleteBtn);
        
        item.addEventListener('click', () => switchConversation(conv.id));
        listDiv.appendChild(item);
    });
}

function switchConversation(id) {
    const convs = loadConversations();
    const conv = convs.find(c => c.id === id);
    if (!conv) return;
    currentConversationId = id;
    renderConversationsList();
    loadMessagesIntoChat(conv.messages);
}

function loadMessagesIntoChat(messages) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = ''; // Clear existing
    if (messages.length === 0) {
        // Show welcome message
        addMessageToUI("Hello! I'm your document assistant. Load a PDF or website, then ask me anything about it.", 'bot');
    } else {
        messages.forEach(msg => addMessageToUI(msg.content, msg.role));
    }
}

function addMessageToUI(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function deleteConversation(id) {
    let convs = loadConversations();
    convs = convs.filter(c => c.id !== id);
    saveConversations(convs);
    if (currentConversationId === id) {
        // Switch to another conversation or create a new one
        if (convs.length > 0) {
            switchConversation(convs[0].id);
        } else {
            currentConversationId = null;
            renderConversationsList();
            // Clear chat area and show welcome
            document.getElementById('chatMessages').innerHTML = '';
            addMessageToUI("Hello! I'm your document assistant. Load a PDF or website, then ask me anything about it.", 'bot');
        }
    } else {
        renderConversationsList();
    }
}

function newConversation() {
    // Clear current chat area
    document.getElementById('chatMessages').innerHTML = '';
    addMessageToUI("Hello! I'm your document assistant. Load a PDF or website, then ask me anything about it.", 'bot');
    // Create new conversation with empty messages
    const newId = Date.now().toString();
    const newConv = {
        id: newId,
        title: 'New Chat',
        messages: []
    };
    const convs = loadConversations();
    convs.push(newConv);
    saveConversations(convs);
    currentConversationId = newId;
    renderConversationsList();
}

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

// ========== Document Upload (unchanged) ==========
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

// ========== Ask question (modified to store messages) ==========
const askBtn = document.getElementById('askBtn');
const questionInput = document.getElementById('question');
const chatMessages = document.getElementById('chatMessages');

function addMessageToChat(text, sender) {
    addMessageToUI(text, sender);
    // Store in current conversation
    if (sender === 'user' || sender === 'bot') {
        addMessageToCurrentChat(sender, text);
    }
}

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
        addMessageToChat('Please enter a question.', 'bot');
        return;
    }
    addMessageToChat(question, 'user');
    questionInput.value = '';
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
            addMessageToChat(data.answer, 'bot');
        } else {
            addMessageToChat(`Error: ${data.error || 'Unknown error'}`, 'bot');
        }
    } catch (err) {
        clearTimeout(timeoutId);
        removeLoadingMessage();
        if (err.name === 'AbortError') {
            addMessageToChat('Request timed out. Please try again.', 'bot');
        } else {
            addMessageToChat(`Network error: ${err.message}`, 'bot');
        }
    }
});

questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askBtn.click();
    }
});

// ========== Clear Chat (modified) ==========
const clearChatBtn = document.getElementById('clearChatBtn');

function clearChat() {
    // Clear the current conversation's messages
    const convs = loadConversations();
    const conv = convs.find(c => c.id === currentConversationId);
    if (conv) {
        conv.messages = [];
        updateConversationTitle(conv);
        saveConversations(convs);
    }
    // Clear UI
    chatMessages.innerHTML = '';
    addMessageToChat("Hello! I'm your document assistant. Load a PDF or website, then ask me anything about it.", 'bot');
    renderConversationsList();
}
clearChatBtn.addEventListener('click', clearChat);

// ========== New Chat Button ==========
const newChatBtn = document.getElementById('newChatBtn');
newChatBtn.addEventListener('click', () => {
    newConversation();
});

// ========== Initialize ==========
// Load or create initial conversation
let convs = loadConversations();
if (convs.length === 0) {
    newConversation();
} else {
    // Select the most recent conversation (the last one)
    const last = convs[convs.length - 1];
    currentConversationId = last.id;
    renderConversationsList();
    loadMessagesIntoChat(last.messages);
}