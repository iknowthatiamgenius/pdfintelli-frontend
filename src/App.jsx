import { useState } from 'react';
import FileUpload from './components/FileUpload';
import PDFPreview from './components/PDFPreview';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [messages, setMessages] = useState([]);

  // When a new file is uploaded
  const handleFileUploaded = (fileData) => {
    setCurrentFile(fileData);
    // Add welcome message when file is uploaded
    setMessages([{
      id: 1,
      type: 'assistant',
      content: `I've loaded your PDF "${fileData.filename}". What would you like me to do with it? I can help you compress, convert to Word, extract pages, and more!`
    }]);
  };

  // When a file is processed/updated from chat actions
  const handleFileProcessed = (newFileData) => {
    setCurrentFile(newFileData);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">PdfINTELLI</h1>
          <div className="header-subtitle">
            Chat with your PDF like you chat with ChatGPT
          </div>
        </div>
      </header>

      {/* Main Content - Grid layout */}
      <main className="main-content">
        {/* Left Panel - PDF Preview (Larger) */}
        <div className="preview-panel">
          {!currentFile ? (
            <div className="upload-container">
              <FileUpload onFileUploaded={handleFileUploaded} />
            </div>
          ) : (
            <PDFPreview fileId={currentFile?.file_id} />
          )}
        </div>

        {/* Right Panel - Chat (Smaller) */}
        <div className="chat-panel">
          <ChatInterface 
            messages={messages} 
            setMessages={setMessages}
            currentFile={currentFile}
            onFileProcessed={handleFileProcessed}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
