/**
 * Feel Bohol - AI Chat Assistant Frontend
 * Handles chat widget UI and API communication
 */

(function() {
  'use strict';

  // Configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  const CHAT_API = API_BASE_URL + '/chat';

  // State
  let conversationHistory = [];
  let isWidgetOpen = false;
  let isLoading = false;

  // DOM Elements (will be created dynamically)
  let chatToggle, chatWidget, chatMessages, chatInput, sendBtn;

  /**
   * Initialize the chat widget
   */
  function init() {
    createChatWidget();
    bindEvents();
  }

  /**
   * Create chat widget DOM elements
   */
  function createChatWidget() {
    // Create toggle button
    chatToggle = document.createElement('button');
    chatToggle.className = 'chat-toggle';
    chatToggle.setAttribute('aria-label', 'Open chat assistant');
    chatToggle.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;
    document.body.appendChild(chatToggle);

    // Create chat widget
    chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.setAttribute('role', 'dialog');
    chatWidget.setAttribute('aria-label', 'Feel Bohol Chat Assistant');
    chatWidget.innerHTML = `
      <div class="chat-header">
        <div class="chat-header__info">
          <div class="chat-header__avatar">🌴</div>
          <div class="chat-header__details">
            <h3>Bohol Assistant</h3>
            <span><span class="status-dot"></span> Online</span>
          </div>
        </div>
        <div class="chat-header__actions">
          <button class="chat-header__btn" id="chat-minimize" aria-label="Minimize chat">
            <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          </button>
          <button class="chat-header__btn" id="chat-close" aria-label="Close chat">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-welcome">
          <div class="chat-welcome__icon">🏝️</div>
          <div class="chat-welcome__text">
            Mabuhay! I'm your Bohol travel assistant.<br>Ask me anything about exploring this beautiful island!
          </div>
          <div class="chat-suggestions">
            <button class="chat-suggestion" data-message="What are the top attractions in Bohol?">Top attractions</button>
            <button class="chat-suggestion" data-message="How do I get to Chocolate Hills?">Chocolate Hills</button>
            <button class="chat-suggestion" data-message="What's the best time to visit Bohol?">Best time to visit</button>
            <button class="chat-suggestion" data-message="Tell me about local food">Local food</button>
          </div>
        </div>
      </div>
      <div class="chat-input">
        <input type="text" id="chat-input-field" placeholder="Ask about Bohol..." aria-label="Chat message input">
        <button id="chat-send" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(chatWidget);

    // Cache DOM references
    chatMessages = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input-field');
    sendBtn = document.getElementById('chat-send');
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Toggle button
    chatToggle.addEventListener('click', toggleWidget);

    // Close/minimize buttons
    document.getElementById('chat-minimize').addEventListener('click', closeWidget);
    document.getElementById('chat-close').addEventListener('click', closeWidget);

    // Send button
    sendBtn.addEventListener('click', sendMessage);

    // Enter key
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !isLoading) {
        sendMessage();
      }
    });

    // Input state
    chatInput.addEventListener('input', function() {
      sendBtn.disabled = this.value.trim() === '';
    });

    // Quick suggestions
    chatWidget.addEventListener('click', function(e) {
      if (e.target.classList.contains('chat-suggestion')) {
        const message = e.target.getAttribute('data-message');
        if (message) {
          chatInput.value = message;
          sendBtn.disabled = false;
          sendMessage();
        }
      }
    });

    // Close on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isWidgetOpen) {
        closeWidget();
      }
    });
  }

  /**
   * Toggle chat widget visibility
   */
  function toggleWidget() {
    if (isWidgetOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  /**
   * Open chat widget
   */
  function openWidget() {
    isWidgetOpen = true;
    chatWidget.classList.add('is-open');
    chatToggle.style.opacity = '0';
    chatToggle.style.pointerEvents = 'none';
    chatInput.focus();
  }

  /**
   * Close chat widget
   */
  function closeWidget() {
    isWidgetOpen = false;
    chatWidget.classList.remove('is-open');
    chatToggle.style.opacity = '1';
    chatToggle.style.pointerEvents = 'all';
  }

  /**
   * Send a message to the API
   */
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || isLoading) return;

    // Clear input
    chatInput.value = '';
    sendBtn.disabled = true;

    // Add user message to UI
    addMessage(message, 'user');

    // Add to conversation history
    conversationHistory.push({ role: 'user', content: message });

    // Show typing indicator
    showTypingIndicator();
    isLoading = true;

    try {
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          conversation_history: conversationHistory
        })
      });

      const data = await response.json();

      // Remove typing indicator
      hideTypingIndicator();

      if (data.success && data.response) {
        // Add assistant response to UI
        addMessage(data.response, 'assistant');

        // Add to conversation history
        conversationHistory.push({ role: 'assistant', content: data.response });
      } else {
        showError(data.error || 'Failed to get response');
      }
    } catch (error) {
      hideTypingIndicator();
      showError('Connection error. Make sure the assistant server is running.');
      console.error('Chat API error:', error);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Add a message to the chat UI
   */
  function addMessage(content, sender) {
    // Remove welcome message if it exists
    const welcome = chatMessages.querySelector('.chat-welcome');
    if (welcome) {
      welcome.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const avatar = sender === 'user' ? '👤' : '🌴';

    // Convert markdown-like formatting to HTML
    const formattedContent = formatMessage(content);

    messageDiv.innerHTML = `
      <div class="chat-message__avatar">${avatar}</div>
      <div class="chat-message__content">${formattedContent}</div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
  }

  /**
   * Format message content (basic markdown support)
   */
  function formatMessage(text) {
    if (!text) return '';

    // Escape HTML
    let html = text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    if (html.includes('<li>')) {
      html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    }

    return html;
  }

  /**
   * Show typing indicator
   */
  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="chat-message__avatar">🌴</div>
      <div class="chat-message__content">
        <div class="chat-typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chat-error';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    scrollToBottom();

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Scroll chat to bottom
   */
  function scrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();