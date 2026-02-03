import React from 'react';

const SocialProof = () => {
  const logos = [
    { name: 'Google' },
    { name: 'Meta' },
    { name: 'Netflix' },
    { name: 'Spotify' },
    { name: 'Uber' },
  ];

  return (
    <div 
      className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-40 px-6"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        opacity: '0.4'
      }}
    >
      <p 
        className="text-xs uppercase tracking-[0.2em] text-white/60 font-bold"
        style={{
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'var(--font-sans)'
        }}
      >
        Trusted by teams at
      </p>
      
      {logos.map((logo) => (
        <span 
          key={logo.name}
          className="text-lg font-bold text-white/40 grayscale transition-all duration-300 hover:text-white hover:opacity-100 cursor-default"
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          {logo.name}
        </span>
      ))}
    </div>
  );
};

export default SocialProof;