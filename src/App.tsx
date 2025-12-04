import React from 'react';
import './styles.css';
import PocariStickerLogo from './PocariStickerLogo';

const App: React.FC = () => {
  return (
    <div className="app-root">
      <div className="pocari-stack">
        <img
          src="/pocari_text.svg"
          alt="Pocari Text"
          className="pocari-part pocari-text"
        />
        <div className="pocari-part pocari-logo">
          <PocariStickerLogo />
        </div>
      </div>
    </div>
  );
};

export default App;
