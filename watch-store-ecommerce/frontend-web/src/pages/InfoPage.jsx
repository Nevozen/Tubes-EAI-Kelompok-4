import React from 'react';

const InfoPage = ({ title, paragraphs }) => (
  <div className="container" style={{ padding: '60px 20px 100px', minHeight: '60vh', maxWidth: '900px' }}>
    <h1 style={{ marginBottom: '24px' }}>{title}</h1>
    <div style={{ display: 'grid', gap: '16px', color: 'var(--color-grey)' }}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  </div>
);

export default InfoPage;
