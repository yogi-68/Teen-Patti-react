import React, { useState } from 'react';

const container: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  color: '#ffd700',
  padding: '1rem',
};

const card: React.CSSProperties = {
  maxWidth: 720,
  width: '100%',
  background: 'rgba(0,0,0,0.6)',
  border: '2px solid #ffd700',
  borderRadius: 16,
  padding: '1.5rem',
  boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
};

const title: React.CSSProperties = {
  margin: 0,
  marginBottom: '0.75rem',
};

const text: React.CSSProperties = {
  color: '#e0e0e0',
  lineHeight: 1.6,
};

const actions: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1rem',
};

const btn: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  borderRadius: 10,
  border: '1px solid rgba(195, 171, 28, 0.3)',
  cursor: 'pointer',
  fontWeight: 600,
};

const acceptStyle: React.CSSProperties = {
  ...btn,
  background: '#ffd700',
  color: '#000',
  borderColor: '#ffd700',
};

const declineStyle: React.CSSProperties = {
  ...btn,
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
};

export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [declined, setDeclined] = useState(false);

  const accept = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    onAccept();
  };

  const decline = () => {
    localStorage.setItem('disclaimerAccepted', 'false');
    setDeclined(true);
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={title}>Disclaimer</h2>
        <p style={text}>
          This platform is for entertainment purposes only. Any coins or money used here are not refundable or recoverable.
          Real cash transactions happen manually and outside the app. The company or its developers are not responsible for any
          money losses, misuse, or unauthorized payments. By continuing, you confirm that you are 18+ and you agree to these terms.
        </p>
        <p style={{ ...text, color: '#ffa726' }}>If you decline, the game dashboard remains inaccessible.</p>
        <div style={actions}>
          <button onClick={decline} style={declineStyle}>Decline</button>
          <button onClick={accept} style={acceptStyle}>I Agree</button>
        </div>
        {declined && (
          <p style={{ ...text, color: '#ef5350', textAlign: 'center', marginTop: '0.5rem' }}>
            Access blocked. Accept the disclaimer to continue.
          </p>
        )}
      </div>
    </div>
  );
}
