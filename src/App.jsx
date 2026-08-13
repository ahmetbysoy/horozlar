import { useState } from 'react';
import { useGame } from './hooks/useGame.js';
import TopBar from './components/common/TopBar.jsx';
import BottomNav from './components/common/BottomNav.jsx';
import { ToastHost } from './components/common/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import RoostersPage from './pages/RoostersPage.jsx';
import CombatPage from './pages/CombatPage.jsx';
import MarketPage from './pages/MarketPage.jsx';
import QuestsPage from './pages/QuestsPage.jsx';

export default function App() {
  const state = useGame();
  const [tab, setTab] = useState('home');

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
