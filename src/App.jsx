import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame.js';
import TopBar from './components/common/TopBar.jsx';
import BottomNav from './components/common/BottomNav.jsx';
import { ToastHost } from './components/common/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import RoostersPage from './pages/RoostersPage.jsx';
import CombatPage from './pages/CombatPage.jsx';
import MarketPage from './pages/MarketPage.jsx';
import QuestsPage from './pages/QuestsPage.jsx';
import { audio } from './managers/AudioManager.js';

export default function App() {
  const state = useGame();
  const [tab, setTab] = useState('home');

  // İlk etkileşimde sesi başlat (autoplay policy) + buton tıklama sesi
  useEffect(() => {
    const init = () => {
      audio.init();
      // Buton tıklamalarında ses çal
      document.addEventListener('click', (e) => {
        if (e.target.closest('.btn')) audio.click();
      });
    };
    window.addEventListener('pointerdown', init, { once: true });
    return () => window.removeEventListener('pointerdown', init);
  }, []);

  const render = () => {
    switch (tab) {
      case 'home': return <HomePage onNavigate={setTab} />;
      case 'roosters': return <RoostersPage />;
      case 'combat': return <CombatPage />;
      case 'market': return <MarketPage />;
      case 'quests': return <QuestsPage />;
      default: return <HomePage onNavigate={setTab} />;
    }
  };

  return (
    <div className="app">
      <TopBar state={state} />
      <div className="content" key={tab}>{render()}</div>
      <BottomNav active={tab} onChange={setTab} />
      <ToastHost />
    </div>
  );
}
