import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatWidget.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [leadId, setLeadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({ name: '', email: '', phone: '' });
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy Sofía, asistente de sourcing en HiHub Global. ¿Qué equipo o producto estás buscando importar desde China?'
      }]);
    }
  }, [isOpen]);

  const handleSend = async (imageBase64 = null) => {
    if (!input.trim() && !imageBase64) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      image: previewImage 
    }]);
    setPreviewImage(null);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          message: userMessage,
          imageBase64
        })
      });

      const data = await response.json();

      if (data.leadId) setLeadId(data.leadId);

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);

      // Show calendar if ready
      if (data.showCalendar) {
        setShowCalendar(true);
        setAvailableSlots(data.availableSlots);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. Por favor intenta de nuevo.'
      }]);
    }

    setIsLoading(false);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleBookAppointment = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/calendar/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          slotDatetime: selectedSlot.startTime,
          userName: bookingData.name,
          userEmail: bookingData.email,
          userPhone: bookingData.phone
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppointmentConfirmed(true);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `¡Excelente! Tu llamada está agendada para ${new Date(selectedSlot.startTime).toLocaleString()}. Recibirás un email de confirmación.`
        }]);
      }
    } catch (error) {
      console.error('Booking error:', error);
    }

    setIsLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sendImage = () => {
    if (previewImage) {
      const base64 = previewImage.split(',')[1];
      handleSend(base64);
    }
  };

  return (
    <div className="chat-widget-container">
      {/* Chat Button */}
      <motion.button
        className="chat-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="chat-badge">Chat with us</span>
          </>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="agent-info">
                <img 
                  src="/sofia-avatar.png" 
                  alt="Sofia" 
                  className="agent-avatar"
                  onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Sofia&background=F7941D&color=fff'}
                />
                <div>
                  <h3>Sofía</h3>
                  <span className="status">
                    <span className="status-dot"></span>
                    En línea
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`message ${msg.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded" className="message-image" />
                  )}
                  <div className="message-content">{msg.content}</div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="message assistant">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Calendar Picker */}
            {showCalendar && !appointmentConfirmed && (
              <motion.div
                className="calendar-picker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <h4>Selecciona un horario para tu llamada:</h4>
                <div className="slots-grid">
                  {availableSlots.slice(0, 6).map((slot, idx) => (
                    <button
                      key={idx}
                      className={`slot-btn ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {new Date(slot.startTime).toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      <br />
                      {new Date(slot.startTime).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Booking Form */}
            {showBookingForm && !appointmentConfirmed && (
              <motion.div
                className="booking-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h4>Completa tus datos:</h4>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={bookingData.name}
                  onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                />
                <button 
                  className="book-btn"
                  onClick={handleBookAppointment}
                  disabled={!bookingData.name || !bookingData.email}
                >
                  {isLoading ? 'Agendando...' : 'Confirmar llamada'}
                </button>
              </motion.div>
            )}

            {/* Confirmation */}
            {appointmentConfirmed && (
              <motion.div
                className="confirmation"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="success-icon">✓</div>
                <h4>¡Llamada agendada!</h4>
                <p>Recibirás un email con los detalles.</p>
              </motion.div>
            )}

            {/* Input Area */}
            {!showCalendar && !appointmentConfirmed && (
              <div className="input-area">
                {previewImage && (
                  <div className="image-preview">
                    <img src={previewImage} alt="Preview" />
                    <button onClick={() => setPreviewImage(null)}>×</button>
                    <button className="send-image-btn" onClick={sendImage}>Enviar imagen</button>
                  </div>
                )}
                
                <div className="input-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar imagen"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe tu mensaje..."
                    disabled={isLoading}
                  />
                  
                  <button 
                    className="send-btn"
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
