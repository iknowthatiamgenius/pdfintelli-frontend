import { useEffect, useRef, useState } from 'react';

const PDFPreview = ({ fileId }) => {
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fileId && iframeRef.current) {
      setError(null);
      const pdfUrl = `http://localhost:8000/get-pdf/${fileId}`;
      console.log('Loading PDF from:', pdfUrl);
      iframeRef.current.src = pdfUrl;
      
      const handleIframeError = () => {
        setError('Failed to load PDF preview');
      };
      
      iframeRef.current.addEventListener('error', handleIframeError);
      
      return () => {
        if (iframeRef.current) {
          iframeRef.current.removeEventListener('error', handleIframeError);
        }
      };
    }
  }, [fileId]);

  if (!fileId) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#444654'
      }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <p>PDF will appear here after upload</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#444654'
      }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h3>Error loading PDF</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#444654'
    }}>
      {/* Minimal header - you can remove this entirely if you want */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#4B5563',
        color: 'white',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>PDF Preview</span>
        <span style={{ opacity: 0.7 }}>Ready</span>
      </div>
      
      {/* PDF container that takes ALL remaining space */}
      <div style={{
        flex: 1,
        padding: '10px',
        backgroundColor: '#444654'
      }}>
        <iframe
          ref={iframeRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
          title="PDF Preview"
        />
      </div>
    </div>
  );
};

export default PDFPreview;