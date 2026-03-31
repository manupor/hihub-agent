/* HiHub Chat Widget - Vanilla JS Version */
(function() {
  'use strict';

  const API_URL = window.HiHubConfig?.apiUrl || 'http://localhost:3000';
  
  // Widget Styles
  const styles = `
    .hihub-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .hihub-chat-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #F7941D 0%, #E85D04 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(247, 148, 29, 0.4);
      transition: all 0.3s ease;
    }
    .hihub-chat-btn:hover {
      box-shadow: 0 6px 20px rgba(247, 148, 29, 0.5);
      transform: translateY(-2px);
    }
    .hihub-chat-panel {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 380px;
      height: 520px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .hihub-chat-panel.active {
      display: flex;
    }
    .hihub-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hihub-agent-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hihub-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #F7941D;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
    }
    .hihub-agent-info h3 {
      margin: 0;
      font-size: 16px;
    }
    .hihub-status {
      font-size: 12px;
      color: #4CAF50;
    }
    .hihub-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
    }
    .hihub-message {
      margin-bottom: 16px;
      max-width: 85%;
    }
    .hihub-message.user {
      margin-left: auto;
      text-align: right;
    }
    .hihub-message-content {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      display: inline-block;
    }
    .hihub-message.user .hihub-message-content {
      background: linear-gradient(135deg, #F7941D 0%, #E85D04 100%);
      color: white;
    }
    .hihub-message.assistant .hihub-message-content {
      background: white;
      color: #1a1a2e;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .hihub-input-area {
      background: white;
      padding: 12px 16px;
      border-top: 1px solid #eee;
    }
    .hihub-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hihub-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      font-size: 14px;
    }
    .hihub-send-btn {
      background: linear-gradient(135deg, #F7941D 0%, #E85D04 100%);
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
    }
    .hihub-calendar {
      background: white;
      padding: 16px;
      border-top: 1px solid #eee;
    }
    .hihub-slots {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .hihub-slot-btn {
      padding: 10px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      font-size: 11px;
      cursor: pointer;
    }
    .hihub-slot-btn:hover {
      border-color: #F7941D;
      background: #fff8f0;
    }
  `;

  // Add styles to head
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Widget HTML
  function createWidget() {
    const container = document.createElement('div');
    container.className = 'hihub-widget-container';
    container.innerHTML = `
      <button class="hihub-chat-btn" id="hihubToggle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Chat with us</span>
      </button>
      <div class="hihub-chat-panel" id="hihubPanel">
        <div class="hihub-header">
          <div class="hihub-agent-info">
            <div class="hihub-avatar">S</div>
            <div>
              <h3>Sofía</h3>
              <div class="hihub-status">● En línea</div>
            </div>
          </div>
          <button id="hihubClose" style="background:none;border:none;color:white;cursor:pointer;font-size:20px;">×</button>
        </div>
        <div class="hihub-messages" id="hihubMessages"></div>
        <div class="hihub-input-area">
          <div class="hihub-input-row">
            <input type="text" class="hihub-input" id="hihubInput" placeholder="Escribe tu mensaje...">
            <button class="hihub-send-btn" id="hihubSend">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // State
    let isOpen = false;
    let messages = [];
    let leadId = null;

    // Elements
    const toggle = document.getElementById('hihubToggle');
    const panel = document.getElementById('hihubPanel');
    const close = document.getElementById('hihubClose');
    const messagesDiv = document.getElementById('hihubMessages');
    const input = document.getElementById('hihubInput');
    const send = document.getElementById('hihubSend');

    // Toggle chat
    toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('active', isOpen);
      if (isOpen && messages.length === 0) {
        addMessage('assistant', '¡Hola! Soy Sofía, asistente de sourcing en HiHub Global. ¿Qué equipo o producto estás buscando importar desde China?');
      }
    });

    close.addEventListener('click', () => {
      isOpen = false;
      panel.classList.remove('active');
    });

    // Add message to UI
    function addMessage(role, content) {
      messages.push({ role, content });
      const msgDiv = document.createElement('div');
      msgDiv.className = `hihub-message ${role}`;
      msgDiv.innerHTML = `<div class="hihub-message-content">${content}</div>`;
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Send message
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      addMessage('user', text);

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, message: text })
        });

        const data = await response.json();
        if (data.leadId) leadId = data.leadId;

        addMessage('assistant', data.response);

        // Show calendar if needed
        if (data.showCalendar) {
          showCalendar(data.availableSlots);
        }
      } catch (error) {
        console.error('Chat error:', error);
        addMessage('assistant', 'Lo siento, hubo un error. Intenta de nuevo.');
      }
    }

    // Show calendar picker
    function showCalendar(slots) {
      const calendarDiv = document.createElement('div');
      calendarDiv.className = 'hihub-calendar';
      calendarDiv.innerHTML = `
        <h4 style="margin:0 0 12px 0;font-size:14px;">Selecciona un horario:</h4>
        <div class="hihub-slots">
          ${slots.slice(0, 6).map((slot, i) => `
            <button class="hihub-slot-btn" data-slot="${i}">
              ${new Date(slot.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
              <br>
              ${new Date(slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </button>
          `).join('')}
        </div>
      `;
      
      // Replace input area with calendar
      const inputArea = document.querySelector('.hihub-input-area');
      inputArea.innerHTML = '';
      inputArea.appendChild(calendarDiv);

      // Add click handlers
      calendarDiv.querySelectorAll('.hihub-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => bookSlot(slots[parseInt(btn.dataset.slot)]));
      });
    }

    // Book slot
    async function bookSlot(slot) {
      const name = prompt('Tu nombre:');
      const email = prompt('Tu email:');
      if (!name || !email) return;

      try {
        const response = await fetch(`${API_URL}/api/calendar/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            slotDatetime: slot.startTime,
            userName: name,
            userEmail: email
          })
        });

        const data = await response.json();
        if (data.success) {
          addMessage('assistant', `¡Excelente! Tu llamada está agendada para ${new Date(slot.startTime).toLocaleString()}. Recibirás un email de confirmación.`);
        }
      } catch (error) {
        console.error('Booking error:', error);
      }
    }

    // Event listeners
    send.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  // Expose config globally
  window.HiHubChat = {
    config: function(options) {
      window.HiHubConfig = options;
    }
  };
})();
