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
import ClanPage from './pages/ClanPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { audio } from './managers/AudioManager.js';
import { TelegramService } from './config/telegram.js';
import { initFromCloud } from './store/gameStore.js';
import Onboarding from './components/common/Onboarding.jsx';

export default function App() {
  const state = useGame();
  const [tab, setTab] = useState('home');
  const [tgTheme, setTgTheme] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // İlk açılışta onboarding göster (henüz tamamlanmadıysa)
  useEffect(() => {
    if (state && !state.onboarded && !localStorage.getItem('horoz-onboarded')) {
      setShowOnboarding(true);
    }
  }, []);

  // Buluttan kayıtlı veriyi yükle
  useEffect(() => {
    initFromCloud().then(ok => {
      setCloudReady(true);
      setCloudError(!ok && !navigator.onLine === false);
      setTimeout(() => setCloudError(false), 2500);
    });
  }, []);

  // Telegram başlat + tema uygula
  useEffect(() => {
    TelegramService.init();
    const theme = TelegramService.getTheme();
    setTgTheme(theme);
    // Telegram renklerini CSS değişkenlerine uygula (mobil görünüm)
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.bgColor);
    root.style.setProperty('--bg-secondary', theme.secondaryBgColor || theme.bgColor);
    root.style.setProperty('--bg-card', theme.secondaryBgColor || theme.bgColor);
    root.style.setProperty('--text-primary', theme.textColor);
    root.style.setProperty('--text-secondary', theme.hintColor);
    try {
      if (TelegramService.isAvailable()) document.body.style.background = theme.bgColor;
    } catch (e) { /* ignore */ }

    // İlk etkileşimde sesi başlat (autoplay policy) + buton tıklama sesi
    const initAudio = () => {
      audio.init();
      document.addEventListener('click', (e) => {
        if (e.target.closest('.btn')) { audio.click(); TelegramService.haptic.selection(); }
      });
    };
    window.addEventListener('pointerdown', initAudio, { once: true });
    return () => window.removeEventListener('pointerdown', initAudio);
  }, []);

  const render = () => {
    switch (tab) {
      case 'home': return <HomePage onNavigate={setTab} />;
      case 'roosters': return <RoostersPage />;
      case 'combat': return <CombatPage onNavigate={setTab} />;
      case 'market': return <MarketPage />;
      case 'quests': return <QuestsPage />;
      case 'clan': return <ClanPage />;
      case 'profile': return <ProfilePage onNavigate={setTab} />;
      default: return <HomePage onNavigate={setTab} />;
    }
  };

  return (
    <div className="app">
      <TopBar state={state} onNavigate={setTab} />
      <div className="content" key={tab}>{render()}</div>
      <BottomNav active={tab} onChange={setTab} />
      <ToastHost />
      {showOnboarding && <Onboarding onDone={() => { setShowOnboarding(false); localStorage.setItem('horoz-onboarded', '1'); }} />}
    </div>
  );
}
