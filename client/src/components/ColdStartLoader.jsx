import { useEffect, useState } from 'react';

export default function ColdStartLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('🤔 Le Cube se réveille...');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('/api/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          setMessage('✅ Le Cube est réveillé !');
          setIsLoading(false);
          // Wait 1 sec then reload or return control
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        // Retry logic
        if (attempts < 30) {
          // Max 30 attempts = 90 seconds
          setAttempts(attempts + 1);
          setMessage(
            `🤔 Le Cube se réveille... (${attempts + 1}/${30} tentatives)`
          );
          setTimeout(checkServer, 3000); // Retry every 3 seconds
        } else {
          setMessage(
            '❌ Erreur : Le serveur ne répond pas. Rafraîchis la page.'
          );
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(checkServer, 500); // Delay first check
    return () => clearTimeout(timer);
  }, [attempts]);

  if (!isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {message}
        </h1>
        {message.includes('❌') && (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          marginBottom: '2rem',
          fontSize: '4rem',
          animation: 'spin 2s linear infinite',
        }}
      >
        🎲
      </div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        {message}
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
        Patiente quelques secondes...
      </p>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
