/**
 * ResQ Disaster Response - Chat View Controller
 * Handles chat messages, categories, SpeechRecognition & Text-To-Speech
 */

class ChatView {
    constructor() {
        this.activeCategory = 'general';
        this.speechSynthesis = window.speechSynthesis;
        this.recognition = null;
        this.isListening = false;

        this.initDOM();
        this.initVoiceRecognition();
        this.bindEvents();
    }

    initDOM() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');
        this.voiceBtn = document.getElementById('voice-input-btn');
        this.pillsContainer = document.getElementById('chat-category-pills');
    }

    bindEvents() {
        // Category Pills Click
        if (this.pillsContainer) {
            this.pillsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('pill-btn')) {
                    this.pillsContainer.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    this.activeCategory = e.target.dataset.category || 'general';
                }
            });
        }

        // Send Button Click
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        // Enter Key in Input
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSendMessage();
                }
            });
        }
    }

    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatInput.value = transcript;
                this.stopListening();
                this.handleSendMessage();
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.stopListening();
            };

            this.recognition.onend = () => {
                this.stopListening();
            };

            if (this.voiceBtn) {
                this.voiceBtn.addEventListener('click', () => {
                    if (this.isListening) {
                        this.stopListening();
                    } else {
                        this.startListening();
                    }
                });
            }
        } else if (this.voiceBtn) {
            this.voiceBtn.title = 'Voice recognition not supported on this browser';
            this.voiceBtn.style.opacity = '0.5';
        }
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                this.voiceBtn.classList.add('listening');
            } catch (err) {
                console.error('Recognition start error:', err);
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        this.isListening = false;
        if (this.voiceBtn) {
            this.voiceBtn.classList.remove('listening');
        }
    }

    async handleSendMessage() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        // Render User Message
        this.appendMessage('user', text);
        this.chatInput.value = '';

        // Show Typing Indicator
        const typingEl = this.appendTypingIndicator();

        // Call API
        const response = await ApiService.sendChatMessage(text, this.activeCategory);

        // Remove Typing Indicator
        if (typingEl) typingEl.remove();

        // Render Bot Response
        this.appendMessage('bot', response.bot_response, response.is_offline_fallback);
    }

    appendMessage(sender, content, isFallback = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (sender === 'user') {
            msgDiv.innerHTML = `
                <div class="message-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="message-content">
                    <div class="sender-name">You</div>
                    <div class="message-body">${this.escapeHTML(content)}</div>
                    <div class="message-meta">
                        <span class="timestamp">${now}</span>
                    </div>
                </div>
            `;
        } else {
            const formattedBody = this.formatMarkdown(content);
            const fallbackBadge = isFallback ? '<span class="model-badge" style="background:rgba(245,158,11,0.2);color:#f59e0b;border-color:rgba(245,158,11,0.3);margin-left:8px;">Offline Mode</span>' : '';
            msgDiv.innerHTML = `
                <div class="message-avatar"><i class="fa-solid fa-user-ninja"></i></div>
                <div class="message-content">
                    <div class="sender-name">ResQ AI Assistant ${fallbackBadge}</div>
                    <div class="message-body">${formattedBody}</div>
                    <div class="message-meta">
                        <span class="timestamp">${now}</span>
                        <button class="speech-btn" title="Read aloud" onclick="chatView.speakMessage(this)"><i class="fa-solid fa-volume-high"></i></button>
                    </div>
                </div>
            `;
        }

        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    appendTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid fa-user-ninja"></i></div>
            <div class="message-content">
                <div class="sender-name">ResQ AI Assistant</div>
                <div class="message-body" style="color:var(--text-muted); font-style:italic;">
                    <i class="fa-solid fa-ellipsis fa-beat"></i> Consulting offline emergency knowledge...
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }

    speakMessage(btnEl) {
        if (!this.speechSynthesis) return;

        const messageBodyEl = btnEl.closest('.message-content').querySelector('.message-body');
        if (!messageBodyEl) return;

        const textToSpeak = messageBodyEl.innerText;

        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        this.speechSynthesis.speak(utterance);
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    formatMarkdown(text) {
        let html = this.escapeHTML(text);
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }
}

window.ChatView = ChatView;
