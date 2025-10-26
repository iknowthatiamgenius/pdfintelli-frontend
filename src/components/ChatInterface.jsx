import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const ChatInterface = ({ messages, setMessages, currentFile, onFileProcessed }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingMerge, setAwaitingMerge] = useState(false);
  const [showUploadBox, setShowUploadBox] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentFile || isProcessing) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const response = await axios.post('http://localhost:8000/process-pdf', {
        file_id: currentFile.file_id,
        command: inputMessage
      });

      // Add AI response
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.message
      };

      setMessages(prev => [...prev, aiResponse]);

      // Check if AI wants us to show upload box for merge
      if (response.data.requires_upload) {
        setAwaitingMerge(true);
        setShowUploadBox(true);
      }

      // If a new file was created (compression, extraction, delete, rotate), update the current file
      if (response.data.file_id && response.data.file_id !== currentFile.file_id && !response.data.is_word_file && !response.data.is_text_file) {
        onFileProcessed({
          file_id: response.data.file_id,
          filename: response.data.filename || `${currentFile.filename.split('.')[0]}_processed.pdf`
        });
      }

      // If it's a Word or text file, show download link in a better way
      if (response.data.is_word_file || response.data.is_text_file) {
        // The message already contains the download link
        console.log('File available at:', response.data.download_url);
      }

    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "❌ Sorry, I encountered an error processing your request. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergeUpload = async (file) => {
    if (!currentFile || !awaitingMerge) return;

    setShowUploadBox(false);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('current_file_id', currentFile.file_id);
      formData.append('new_file', file);

      const response = await axios.post('http://localhost:8000/merge-pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Add success message
      const successMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.message
      };
      setMessages(prev => [...prev, successMessage]);

      // Update with merged file
      onFileProcessed({
        file_id: response.data.file_id,
        filename: response.data.filename
      });

    } catch (error) {
      console.error('Merge error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "❌ Failed to merge PDFs. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setAwaitingMerge(false);
    }
  };

  const cancelMerge = () => {
    setShowUploadBox(false);
    setAwaitingMerge(false);
    const cancelMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: "Merge cancelled. What would you like to do instead?"
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const SimpleUploadBox = () => (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#40414f',
      padding: '30px',
      borderRadius: '10px',
      border: '2px solid #565869',
      zIndex: 1000,
      minWidth: '300px',
      textAlign: 'center'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#ececf1' }}>Upload PDF to Merge</h3>
      <div
        style={{
          border: '2px dashed #565869',
          borderRadius: '8px',
          padding: '40px 20px',
          marginBottom: '20px',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#10a37f';
          e.currentTarget.style.backgroundColor = '#40414f';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#565869';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0 && files[0].type.includes('pdf')) {
            handleMergeUpload(files[0]);
          }
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf';
          input.onchange = (e) => {
            if (e.target.files.length > 0) {
              handleMergeUpload(e.target.files[0]);
            }
          };
          input.click();
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <p style={{ color: '#9ca3af', marginBottom: '8px' }}>Drop PDF here or click to browse</p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>File will be merged with current PDF</p>
      </div>
      <button
        onClick={cancelMerge}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #565869',
          color: '#9ca3af',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <div className="chat-interface">
      {/* Upload Overlay for Merge */}
      {showUploadBox && <SimpleUploadBox />}

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">🤖</div>
            <h3>Welcome to PDF AI Assistant!</h3>
            <p>I can help you with:</p>
            <ul style={{ textAlign: 'left', marginTop: '10px', color: '#9ca3af' }}>
              <li>• Compress PDFs</li>
              <li>• Extract specific pages</li>
              <li>• Delete pages from PDF</li>
              <li>• Rotate pages (90°, 180°, 270°)</li>
              <li>• Merge with other PDFs</li>
              <li>• Split PDFs into parts</li>
              <li>• Convert to Word documents</li>
              <li>• Extract text content</li>
            </ul>
            <p style={{ marginTop: '15px', fontSize: '14px' }}>
              Try: "rotate page 3 90 degrees", "delete pages 2-4", "merge with another PDF", or "convert to Word"
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        <form onSubmit={handleSendMessage} className="input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                awaitingMerge ? 
                "Waiting for PDF upload..." : 
                currentFile ? "What would you like to do with your PDF?" : "Upload a PDF first to start chatting..."
              }
              disabled={!currentFile || isProcessing || awaitingMerge}
              className="message-input"
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim() || !currentFile || isProcessing || awaitingMerge}
              className="send-button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
        <div className="input-disclaimer">
          PDF AI Assistant can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;