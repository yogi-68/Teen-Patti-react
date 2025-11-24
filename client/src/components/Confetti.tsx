import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  duration: number;
}

const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4', '#FFA500'];
  const numParticles = 50;

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100, // percentage
        y: -20,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random(),
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}px`,
            width: '10px',
            height: '10px',
            backgroundColor: particle.color,
            borderRadius: '50%',
            animation: `fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(calc(100vh + 50px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
