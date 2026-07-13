// Chatbot Client Logic - Init Idea Studio

// CONFIGURATION - Update these values with your actual deployment endpoints
const N8N_WEBHOOK_URL = 'https://alexramz.app.n8n.cloud/webhook/chat-juridico'; // URL de producción de n8n Cloud
const CHAT_TOKEN = 'AbogadaMarilo2026!'; // Token secreto configurado en el nodo de validación

// State variables
let sessionId = '';
let isPanelOpen = false;
let isWaitingForBot = false;
let remainingQuestions = 3;

// Fallback UUID generator (works on file:// and HTTP without SSL)
function generateUUID() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize Chat Session
function initSession() {
  let storedSessionId = sessionStorage.getItem('chatbot_session_id');
  if (!storedSessionId) {
    storedSessionId = generateUUID();
    sessionStorage.setItem('chatbot_session_id', storedSessionId);
  }
  sessionId = storedSessionId;
  console.log('Chatbot Session ID:', sessionId);
}

// Render Welcome Message
function showWelcomeMessage() {
  const messageFeed = document.getElementById('chat-messages-feed');
  if (messageFeed && messageFeed.children.length === 0) {
    appendMessage('bot', '¡Hola! Soy el asistente informativo inteligente de la abogada mariló.\n\nLa información proporcionada tiene fines informativos y no constituye asesoría jurídica personalizada.\n\nPuedo ayudarte con dudas generales sobre los siguientes temas:\n- Derechos Humanos y Garantías en México (Constitución).\n- Contratos Civiles (Disposiciones Generales del Código Civil).\n- Terminación de la Relación de Trabajo (Ley Federal del Trabajo).\n\n*¿En qué tema te puedo informar hoy?*');
  }
}

// Open / Close Panel
function togglePanel() {
  const panel = document.getElementById('chatbot-panel');
  const bubble = document.getElementById('chatbot-bubble');
  
  isPanelOpen = !isPanelOpen;
  
  if (isPanelOpen) {
    panel.classList.add('open');
    bubble.classList.add('active');
    bubble.innerHTML = '×';
    showWelcomeMessage();
    // Scroll to bottom
    const messageFeed = document.getElementById('chat-messages-feed');
    messageFeed.scrollTop = messageFeed.scrollHeight;
  } else {
    panel.classList.remove('open');
    bubble.classList.remove('active');
    bubble.innerHTML = '💬';
  }
}

// Append Message to UI
function appendMessage(sender, text) {
  const messageFeed = document.getElementById('chat-messages-feed');
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('chat-msg', sender);
  
  // Replace newlines with <br> and format simple markdown bolding
  let formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
  msgDiv.innerHTML = formattedText;
  messageFeed.appendChild(msgDiv);
  
  // Auto scroll
  messageFeed.scrollTop = messageFeed.scrollHeight;
}

// Show Typing Indicator
function showTypingIndicator() {
  const messageFeed = document.getElementById('chat-messages-feed');
  const indicator = document.createElement('div');
  indicator.id = 'chat-typing-indicator';
  indicator.classList.add('chat-msg', 'bot');
  indicator.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  messageFeed.appendChild(indicator);
  messageFeed.scrollTop = messageFeed.scrollHeight;
}

// Remove Typing Indicator
function removeTypingIndicator() {
  const indicator = document.getElementById('chat-typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// Update Counter in UI
function updateCounter(countVal) {
  remainingQuestions = Math.max(0, 3 - countVal);
  const counterElement = document.getElementById('chat-counter');
  if (counterElement) {
    counterElement.textContent = `${remainingQuestions}/3`;
  }
  
  // If no remaining questions, replace input area with WhatsApp Button
  if (remainingQuestions <= 0) {
    disableChatInput();
  }
}

// Replace text input with WhatsApp CTA
function disableChatInput() {
  const footer = document.getElementById('chat-footer-area');
  footer.innerHTML = `
    <a href="https://wa.me/5217771035134?text=Hola%20abogada%20maril%C3%B3%2C%20agoto%20mis%203%20consultas%20de%20demostraci%C3%B3n%20y%20deseo%20una%20asesor%C3%ADa%20personal%20de%20pago" 
       target="_blank" 
       class="chat-whatsapp-cta">
      💬 Asesoría por WhatsApp
    </a>
    <div class="chat-meta-bar" style="justify-content: center; margin-top: 5px;">
      <span>Límite gratuito alcanzado. Agenda tu videollamada.</span>
    </div>
  `;
}

// Send Message
async function sendMessage() {
  const input = document.getElementById('chat-input-field');
  const sendBtn = document.getElementById('chat-send-btn');
  
  if (!input || !input.value.trim() || isWaitingForBot || remainingQuestions <= 0) {
    return;
  }
  
  const text = input.value.trim();
  input.value = '';
  
  // Show user message in UI
  appendMessage('user', text);
  
  // State: waiting
  isWaitingForBot = true;
  if (sendBtn) sendBtn.disabled = true;
  showTypingIndicator();
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chat-Token': CHAT_TOKEN
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: text
      })
    });
    
    // Remove typing
    removeTypingIndicator();
    
    if (!response.ok) {
      if (response.status === 401) {
        appendMessage('system', 'Error: No autorizado. Verifica el X-Chat-Token.');
      } else {
        appendMessage('system', 'Hubo un error de conexión con el asistente informativo.');
      }
      return;
    }
    
    const data = await response.json();
    
    // Show bot message
    appendMessage('bot', data.response);
    
    // Update counter
    updateCounter(data.question_count);
    
    if (data.redirect_to_whatsapp) {
      appendMessage('system', 'Has agotado las 3 consultas gratuitas.');
    }
    
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    removeTypingIndicator();
    appendMessage('system', 'No se pudo contactar al servidor. Revisa tu conexión.');
  } finally {
    isWaitingForBot = false;
    if (sendBtn && remainingQuestions > 0) sendBtn.disabled = false;
  }
}

// Build and Inject HTML DOM Elements on window load
function injectWidget() {
  // Create chatbot container
  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'chatbot-widget-container';
  chatbotContainer.innerHTML = `
    <!-- Floating Bubble -->
    <div id="chatbot-bubble" onclick="togglePanel()">💬</div>
    
    <!-- Chat Panel -->
    <div id="chatbot-panel">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <h4 class="chat-header-title">mariló - Asesoría Legal</h4>
          <span class="chat-header-subtitle">Chatbot Demo Activo</span>
        </div>
        <button class="chat-close-btn" onclick="togglePanel()">&times;</button>
      </div>
      
      <!-- Messages Feed -->
      <div class="chat-messages" id="chat-messages-feed"></div>
      
      <!-- Footer -->
      <div class="chat-footer" id="chat-footer-area">
        <div class="chat-input-container">
          <textarea 
            id="chat-input-field" 
            class="chat-input" 
            placeholder="Escribe tu consulta legal aquí..." 
            rows="1"
          ></textarea>
          <button id="chat-send-btn" class="chat-send-btn" onclick="sendMessage()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div class="chat-meta-bar">
          <span>Demo Derecho Mexicano</span>
          <span>Consultas libres: <strong id="chat-counter">3/3</strong></span>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(chatbotContainer);
  
  // Attach event listener for Enter key inside textarea
  const inputField = document.getElementById('chat-input-field');
  if (inputField) {
    inputField.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  // Setup embedded panel in Section VI
  setupEmbeddedPanel();
}

// Global state for embedded panel
let isWaitingForEmbeddedBot = false;
let remainingEmbeddedQuestions = 3;

function setupEmbeddedPanel() {
  const sendBtn = document.getElementById('live-chat-send-btn');
  const inputField = document.getElementById('live-chat-input-field');
  
  if (sendBtn) {
    sendBtn.addEventListener('click', sendEmbeddedMessage);
  }
  
  if (inputField) {
    inputField.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendEmbeddedMessage();
      }
    });
  }
}

function appendEmbeddedMessage(sender, text) {
  const messageFeed = document.getElementById('live-chat-messages-feed');
  if (!messageFeed) return;
  
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('chat-msg', sender);
  
  // Style embedded messages dynamically to match widget CSS without global collision
  if (sender === 'user') {
    msgDiv.style.background = 'var(--color-lime)';
    msgDiv.style.color = 'var(--color-charcoal)';
    msgDiv.style.padding = '10px 12px';
    msgDiv.style.borderRadius = '8px 8px 0 8px';
    msgDiv.style.alignSelf = 'flex-end';
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.fontWeight = '500';
  } else if (sender === 'bot') {
    msgDiv.style.background = 'rgba(255, 255, 255, 0.05)';
    msgDiv.style.color = '#ffffff';
    msgDiv.style.padding = '10px 12px';
    msgDiv.style.borderRadius = '8px 8px 8px 0';
    msgDiv.style.alignSelf = 'flex-start';
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.border = '1px solid rgba(255,255,255,0.05)';
  } else {
    msgDiv.style.color = '#9ca3af';
    msgDiv.style.fontSize = '0.75rem';
    msgDiv.style.alignSelf = 'center';
    msgDiv.style.margin = '5px 0';
  }
  
  let formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
  msgDiv.innerHTML = formattedText;
  messageFeed.appendChild(msgDiv);
  messageFeed.scrollTop = messageFeed.scrollHeight;
}

function showEmbeddedTypingIndicator() {
  const messageFeed = document.getElementById('live-chat-messages-feed');
  if (!messageFeed) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'live-chat-typing-indicator';
  indicator.classList.add('chat-msg', 'bot');
  indicator.style.background = 'rgba(255, 255, 255, 0.05)';
  indicator.style.padding = '12px 15px';
  indicator.style.borderRadius = '8px 8px 8px 0';
  indicator.style.alignSelf = 'flex-start';
  indicator.style.border = '1px solid rgba(255,255,255,0.05)';
  indicator.innerHTML = `
    <div class="typing-indicator" style="display: flex; gap: 4px; align-items: center; height: 10px;">
      <div class="typing-dot" style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%; animation: typingBounce 1.4s infinite both;"></div>
      <div class="typing-dot" style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%; animation: typingBounce 1.4s infinite both; animation-delay: 0.2s;"></div>
      <div class="typing-dot" style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%; animation: typingBounce 1.4s infinite both; animation-delay: 0.4s;"></div>
    </div>
  `;
  messageFeed.appendChild(indicator);
  messageFeed.scrollTop = messageFeed.scrollHeight;
}

function removeEmbeddedTypingIndicator() {
  const indicator = document.getElementById('live-chat-typing-indicator');
  if (indicator) indicator.remove();
}

function updateEmbeddedCounter(countVal) {
  remainingEmbeddedQuestions = Math.max(0, 3 - countVal);
  const counterElement = document.getElementById('live-chat-counter');
  if (counterElement) {
    counterElement.textContent = `${remainingEmbeddedQuestions}/3`;
  }
  
  if (remainingEmbeddedQuestions <= 0) {
    disableEmbeddedChatInput();
  }
}

function disableEmbeddedChatInput() {
  const footer = document.getElementById('live-chat-footer-area');
  if (!footer) return;
  
  footer.innerHTML = `
    <a href="https://wa.me/5217771035134?text=Hola%20abogada%20maril%C3%B3%2C%20agoto%20mis%203%20consultas%20de%20demostraci%C3%B3n%20y%20deseo%20una%20asesor%C3%ADa%20personal%20de%20pago" 
       target="_blank" 
       class="chat-whatsapp-cta"
       style="display: block; background: #25d366; color: #ffffff; text-align: center; padding: 12px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.85rem; transition: background 0.3s; margin-top: 5px;">
      💬 Asesoría por WhatsApp
    </a>
    <div style="text-align: center; color: #6b7280; font-size: 0.7rem; margin-top: 5px;">
      Límite gratuito alcanzado. Agenda tu videollamada.
    </div>
  `;
}

async function sendEmbeddedMessage() {
  const input = document.getElementById('live-chat-input-field');
  const sendBtn = document.getElementById('live-chat-send-btn');
  
  if (!input || !input.value.trim() || isWaitingForEmbeddedBot || remainingEmbeddedQuestions <= 0) {
    return;
  }
  
  const text = input.value.trim();
  input.value = '';
  
  appendEmbeddedMessage('user', text);
  
  isWaitingForEmbeddedBot = true;
  if (sendBtn) sendBtn.disabled = true;
  showEmbeddedTypingIndicator();
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chat-Token': CHAT_TOKEN
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: text
      })
    });
    
    removeEmbeddedTypingIndicator();
    
    if (!response.ok) {
      if (response.status === 401) {
        appendEmbeddedMessage('system', 'Error: No autorizado. Verifica el X-Chat-Token.');
      } else {
        appendEmbeddedMessage('system', 'Hubo un error de conexión con el asistente informativo.');
      }
      return;
    }
    
    const data = await response.json();
    appendEmbeddedMessage('bot', data.response);
    updateEmbeddedCounter(data.question_count);
    
    if (data.redirect_to_whatsapp) {
      appendEmbeddedMessage('system', 'Has agotado las 3 consultas gratuitas.');
    }
    
  } catch (error) {
    console.error('Error sending message to embedded chatbot:', error);
    removeEmbeddedTypingIndicator();
    appendEmbeddedMessage('system', 'No se pudo contactar al servidor. Revisa tu conexión.');
  } finally {
    isWaitingForEmbeddedBot = false;
    if (sendBtn && remainingEmbeddedQuestions > 0) sendBtn.disabled = false;
  }
}

// Run setup on load
window.addEventListener('DOMContentLoaded', () => {
  initSession();
  injectWidget();
});
