import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import RoosterCanvas from '../components/rooster/RoosterCanvas.jsx';
import FightScene from '../components/combat/FightScene.jsx';
import { createAI, TIER_TOTAL } from '../engine/AIGenerator.js';
import { spendEnergy, recordFight, addCoins, addDiamonds, addXp, updateRooster } from '../store/gameStore.js';
import { calculateBetOdds, BET_LIMITS, calculateFightReward, encodePVPCode, decodePVPCode } from '../engine/EconomyEngine.js';
import { useToast } from '../components/common/Toast.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';
import { effectiveStats } from '../engine/EquipmentCatalog.js';
import { audio } from '../managers/AudioManager.js';
import { vibrate } from '../utils/vibrate.js';
import { TelegramService } from '../config/telegram.js';
import { addClanXp } from '../engine/ClanEngine.js';
import { updateLeaderboardEntry } from '../engine/LeaderboardEngine.js';

const LEAGUES = [
  { id: 'SOKAK', name: '🏚️ Sokak', reward: [100, 200], tier: 0 },
  { id: 'MAHALLE', name: '🏘️ Mahalle', reward: [200, 350], tier: 1 },
  { id: 'SEHIR', name: '🏙️ Şehir', reward: [300, 500], tier: 2 },
  { id: 'YERALTI', name: '🕳️ Yeraltı', reward: [500, 800], tier: 3 },
  { id: 'KARA', name: '💀 Kara Arena', reward: [800, 1500], tier: 4 },
];

export default function CombatPage({ onNavigate }) {
  const state = useGame();
  const toast = useToast();
  const [mode, setMode] = useState('arena'); // arena | pvp
  const [step, setStep] = useState('select'); // select | arena | fight | result | pvp
  const [selectedRooster, setSelectedRooster] = useState(null);
  const [fighter, setFighter] = useState(null);
  const [league, setLeague] = useState(LEAGUES[0]);
  const [enemy, setEnemy] = useState(null);
  const [auto, setAuto] = useState(true);
  const [outcome, setOutcome] = useState(null);
  const [rewardMult, setRewardMult] = useState(1);

  // Bahis
  const [betAmount, setBetAmount] = useState(0);
  const [betOdds, setBetOdds] = useState(2.0);
  const [betActive, setBetActive] = useState(false);
  const [betWon, setBetWon] = useState(false);

  // PVP
  const [pvpCode, setPvpCode] = useState('');
  const [pvpEnemy, setPvpEnemy] = useState(null);
  const [pvpInput, setPvpInput] = useState('');

  const hasEquipment = state.equipment && state.equipment.some(i => i.equippedTo === selectedRooster?.id);

  const equippedBonus = (rooster) => {
    const items = state.equipment.filter(i => i.equippedTo === rooster.id);
    return items.reduce((s, i) => s + i.value, 0);
  };

  const startFight = (isPVP = false) => {
    if (!selectedRooster) return toast('Önce bir horoz seç');
    const energyCost = isPVP ? 15 : 10;
    if (state.energy < energyCost) return toast(`⚠️ Yeterli enerji yok (${energyCost} ⚡)`);
    spendEnergy(energyCost);
    if (betActive) { spendCoinsLocal(); }
    setFighter(buildFighter(selectedRooster));
    setEnemy(isPVP ? pvpEnemy : createAI(league.tier));
    setRewardMult(isPVP ? 2 : 1);
    setOutcome(null);
    setStep('fight');
  };

  const buildFighter = (rooster) => {
    const eff = effectiveStats(rooster, state.equipment);
    return { ...rooster, stats: eff };
  };

  const spendCoinsLocal = () => { addCoins(-betAmount); };

  // Bahis yerleştir
  const placeBet = () => {
    const amt = Math.floor(Number(betAmount) || 0);
    if (amt < BET_LIMITS.min) return toast(`Min bahis ${BET_LIMITS.min} 🪙`);
    if (amt > BET_LIMITS.max) return toast(`Max bahis ${BET_LIMITS.max} 🪙`);
    if (amt > state.coins) return toast('⚠️ Yeterli coin yok');
    const oppTotal = TIER_TOTAL[league.tier] || 90;
    setBetOdds(calculateBetOdds(GeneticsEngine.totalStats(selectedRooster), oppTotal));
    setBetActive(true);
    setBetAmount(amt);
    audio.click();
    toast(`🎰 Bahis koyuldu: ${amt} 🪙 @ x${betOdds}`);
  };

  const clearBet = () => { setBetActive(false); setBetAmount(0); };

  const onFinish = (res) => {
    const coinReward = calculateFightReward(league, res.win) * rewardMult;
    let diamonds = 0;
    if (res.win) { if (Math.random() < 0.1 * rewardMult) diamonds = 1; }
    let betPayout = 0, betLost = false;
    if (betActive) {
      if (res.win) { betPayout = Math.floor(betAmount * betOdds); addCoins(betPayout); setBetWon(true); }
      else { betLost = true; setBetWon(false); }
    }
    setOutcome({
      win: res.win,
      coin: res.win ? coinReward : Math.floor(coinReward * 0.25),
      diamonds,
      enemyName: res.enemyRooster?.name || enemy?.name,
      roosterId: selectedRooster.id,
      betPayout, betLost, betActive,
    });
    if (res.win) { addCoins(coinReward); addXp(25 * rewardMult); if (diamonds) addDiamonds(diamonds); }
    else { addCoins(Math.floor(coinReward * 0.25)); addXp(5); }
    recordFight(selectedRooster.id, res.win, league.tier);
    if (res.win) addClanXp([10, 25, 50, 100, 200][league.tier] || 10);
    // Lider tablosunu güncelle
    const totalPower = state.roosters.reduce((s, r) => s + GeneticsEngine.totalStats(r), 0);
    updateLeaderboardEntry({ prestigePoints: state.prestigePoints, wins: state.wins, totalPower, level: state.level, seasonXp: state.seasonXp, fights: state.fights, clanId: state.clanId });
    if (res.win && betPayout) { audio.coin(); vibrate('success'); }
    if (res.win && rewardMult > 1) toast('🏆 PVP galibiyeti — 2x ödül!');
    // %30 gizli keşif
    const r = state.roosters.find(x => x.id === selectedRooster.id);
    if (r) {
      const undiscovered = ['critChanceRevealed', 'dodgeChanceRevealed', 'lateGameRevealed'].filter(k => !r.discovered[k]);
      if (undiscovered.length && Math.random() < 0.3) {
        const key = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        updateRooster(r.id, { discovered: { ...r.discovered, [key]: true } });
        setTimeout(() => toast('🔍 Gizli özellik keşfedildi!'), 300);
      }
    }
    setStep('result');
  };

  const reset = () => { setStep('select'); setSelectedRooster(null); setFighter(null); setEnemy(null); clearBet(); };

  const goPVP = () => { setMode('pvp'); setStep('pvp'); };

  // ---------------- MODE SELECTOR ----------------
  const modeBar = (
    <div className="seg mb">
      <button className={mode === 'arena' && step !== 'pvp' ? 'active' : ''} onClick={() => { setMode('arena'); setStep('select'); }}>🏟️ Arena</button>
      <button className={mode === 'pvp' ? 'active' : ''} onClick={() => { setMode('pvp'); setStep('pvp'); }}>🤺 PVP</button>
    </div>
  );

  // ---------------- PVP PANEL ----------------
  if (step === 'pvp') {
    return (
      <div>
        {modeBar}
        <h1>🤺 PVP Dövüş</h1>
        <p className="muted mb" style={{ fontSize: 13 }}>Horozunu kodla paylaş ya da rakibin kodunu girerek asenkron dövüş yap. Galibiyet = 2x ödül.</p>

        <div className="glass mb">
          <h2 style={{ fontSize: 15 }}>📤 Kod Oluştur</h2>
          <div className="grid grid-roosters" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {state.roosters.map(r => (
              <div key={r.id} className="card rooster-card"
                style={{ padding: 8, ...(selectedRooster?.id === r.id ? { border: '2px solid var(--accent-yellow)' } : {}) }}
                onClick={() => {
                  setSelectedRooster(r);
                  setPvpCode(encodePVPCode(r));
                  navigator.clipboard?.writeText(encodePVPCode(r));
                  toast('📋 Kod kopyalandı!');
                }}>
                <div className="center"><RoosterCanvas rooster={r} size={70} /></div>
                <div className="center" style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
              </div>
            ))}
          </div>
          {pvpCode && (
            <div className="mt">
              <div className="log mb" style={{ wordBreak: 'break-all', fontSize: 12, userSelect: 'all' }}>{pvpCode}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-blue" style={{ flex: 1 }} onClick={() => { navigator.clipboard?.writeText(pvpCode); toast('📋 Kod kopyalandı'); }}>📋 Kopyala</button>
                {TelegramService.isAvailable() ? (
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { TelegramService.shareUrl(pvpCode, '🐓 Horoz İmparatorluğu — benimle dövüş! Kodum: '); toast('📤 Paylaşım açıldı'); }}>📤 TG'de Paylaş</button>
                ) : (
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { TelegramService.shareUrl(pvpCode, '🐓 Dövüşme kodu: '); }}>📤 Paylaş</button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="glass">
          <h2 style={{ fontSize: 15 }}>🎮 Kod ile Dövüş</h2>
          <textarea
            value={pvpInput}
            placeholder="Rakibin HI-... kodunu buraya yapıştır"
            onChange={e => { setPvpInput(e.target.value); setPvpEnemy(null); }}
            style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#1a1a2e', color: '#fff', minHeight: 60, fontSize: 12 }}
          />
          <div className="mt" style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-purple" style={{ flex: 1 }} onClick={loadPvpEnemy}>🔓 Kodu Çöz</button>
            <button className="btn btn-green" style={{ flex: 1 }} onClick={() => startFight(true)} disabled={!pvpEnemy || !selectedRooster}>⚔️ Dövüş (⚡15)</button>
          </div>
          {pvpEnemy && (
            <div className="card mt" style={{ marginBottom: 0 }}>
              <div className="center" style={{ fontWeight: 700 }}>{pvpEnemy.name}</div>
              <div className="muted center" style={{ fontSize: 12 }}>Toplam {GeneticsEngine.totalStats(pvpEnemy)} · {pvpEnemy.breed} · {pvpEnemy.element}</div>
            </div>
          )}
        </div>
        <button className="btn btn-secondary btn-block mt" onClick={() => setStep('select')}>← Ana Dövüşe Dön</button>
      </div>
    );
  }

  const loadPvpEnemy = () => {
    const dec = decodePVPCode(pvpInput);
    if (!dec) return toast('❌ Geçersiz kod');
    setPvpEnemy(dec);
    audio.click();
    toast(`🔓 ${dec.name} yüklendi!`);
  };

  // ---------------- HOROZ SEÇ ----------------
  if (step === 'select') {
    if (state.roosters.length === 0) {
      return (
        <div>
          {modeBar}
          <div className="glass center" style={{ marginTop: 40, padding: 40 }}>
            <div style={{ fontSize: 56 }}>🐣</div>
            <h1>Horozun yok!</h1>
            <p className="muted">Dövüşebilmek için önce bir horoz üretmen gerekiyor.</p>
            <button className="btn btn-gold btn-block" onClick={() => onNavigate?.('roosters')}>🐓 Horoz Üret</button>
          </div>
        </div>
      );
    }
    return (
      <div>
        {modeBar}
        <h1>⚔️ Dövüş</h1>
        <p className="muted mb">Dövüşecek horozunu seç</p>
        <div className="grid grid-roosters">
          {state.roosters.map(r => {
            const equipped = state.equipment.some(i => i.equippedTo === r.id);
            return (
              <div key={r.id} className={`card rooster-card rarity-glow-${r.rarity}`}
                style={selectedRooster?.id === r.id ? { border: '2px solid var(--accent-yellow)' } : {}}
                onClick={() => setSelectedRooster(r)}>
                <div className="center"><RoosterCanvas rooster={r} size={90} /></div>
                <div className="center" style={{ fontWeight: 700 }}>{r.name}</div>
                <div className="muted center" style={{ fontSize: 11 }}>Toplam {GeneticsEngine.totalStats(r)}{equipped && <span style={{ color: '#a855f7' }}> 🛡️+{equippedBonus(r)}</span>}</div>
              </div>
            );
          })}
        </div>
        {selectedRooster && <button className="btn btn-primary btn-block mt" onClick={() => setStep('arena')}>Devam → Arena Seç</button>}
      </div>
    );
  }

  // ---------------- LİG + BAHİS ----------------
  if (step === 'arena') {
    const oppTotal = TIER_TOTAL[league.tier] || 90;
    const liveOdds = selectedRooster ? calculateBetOdds(GeneticsEngine.totalStats(selectedRooster), oppTotal) : 2.0;
    return (
      <div>
        <h1>⚔️ Lig Seç</h1>
        <button className="btn btn-secondary btn-sm mb" onClick={() => setStep('select')}>← Geri</button>
        {LEAGUES.map(l => (
          <div key={l.id} className={`card rooster-card`} onClick={() => { setLeague(l); clearBet(); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800 }}>{l.name}</span>
              <span className="muted" style={{ fontSize: 12 }}>🪙 {l.reward[0]}-{l.reward[1]}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>Rakip gücü: {'⭐'.repeat(l.tier + 1)} · ⚡10 enerji</div>
          </div>
        ))}

        <div className="glass mt">
          <h2 style={{ fontSize: 15 }}>🎰 Bahis Yap</h2>
          {selectedRooster && (
            <div className="muted mb" style={{ fontSize: 13 }}>
              {selectedRooster.name} için oran: <b style={{ color: 'var(--accent-yellow)' }}>x{liveOdds}</b>
              {betActive && <span className="badge" style={{ background: '#22c55e22', color: '#22c55e', marginLeft: 8 }}>🎰 Aktif: {betAmount} @ x{betOdds}</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              value={betAmount || ''}
              onChange={e => setBetAmount(Number(e.target.value))}
              placeholder={`Min ${BET_LIMITS.min}`}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#1a1a2e', color: '#fff' }}
            />
            <button className="btn btn-gold" onClick={placeBet} disabled={!selectedRooster}>🎰 Bahis Koy</button>
          </div>
          {betActive && <button className="btn btn-secondary btn-sm mt" onClick={clearBet}>✖ Bahsi Kaldır</button>}
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Kazanırsan: {betAmount} × x{betOdds} = <b>{Math.floor(betAmount * betOdds)} 🪙</b></div>
        </div>

        <button className="btn btn-primary btn-block mt" onClick={() => startFight()}>⚔️ Dövüşe Başla (⚡10)</button>

        <div className="glass mt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14 }}>Dövüş modu</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setAuto(!auto)}>{auto ? '⚡ Otomatik' : '👆 Manuel'}</button>
        </div>
      </div>
    );
  }

  // ---------------- DÖVÜŞ ----------------
  if (step === 'fight' && enemy && fighter) {
    return (
      <div>
        {betActive && <div className="glass mb" style={{ padding: 10, textAlign: 'center', color: 'var(--accent-yellow)', fontWeight: 800 }}>🎰 Bahis: {betAmount} 🪙 @ x{betOdds} → Kazanç: {Math.floor(betAmount * betOdds)} 🪙</div>}
        {hasEquipment && <div className="glass mb" style={{ padding: 8, textAlign: 'center', fontSize: 12, color: '#a855f7' }}>🛡️ Ekipman bonusu uygulandı</div>}
        <FightScene playerRooster={fighter} enemyRooster={enemy} auto={auto} onFinish={onFinish} />
      </div>
    );
  }

  // ---------------- SONUÇ ----------------
  if (step === 'result' && outcome) {
    return (
      <div className="center" style={{ marginTop: 30 }}>
        <span className="result-emoji">{outcome.win ? '🏆' : '💀'}</span>
        <div className="result-title" style={{ color: outcome.win ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
          {outcome.win ? 'KAZANDIN!' : 'KAYBETTİN'}
        </div>
        <p className="muted">Rakip: {outcome.enemyName}</p>
        <div className="reward-card mt">
          <div style={{ fontSize: 16 }}>🪙 +{outcome.coin} Coin {rewardMult > 1 && <span>(2x)</span>}</div>
          {outcome.diamonds > 0 && <div style={{ fontSize: 16 }}>💎 +{outcome.diamonds} Elmas</div>}
          <div style={{ fontSize: 14, opacity: .8 }}>+{outcome.win ? 25 * rewardMult : 5} XP</div>
        </div>
        {outcome.betActive && (
          <div className="card mt" style={{ border: outcome.betPayout > 0 ? '1px solid #22c55e' : '1px solid #ef4444' }}>
            {outcome.betPayout > 0
              ? <div style={{ fontWeight: 800, color: '#22c55e' }}>🎰 Bahis KAZANDI! +{outcome.betPayout} 🪙</div>
              : <div style={{ fontWeight: 800, color: '#ef4444' }}>🎰 Bahis kaybedildi (-{betAmount} 🪙)</div>}
          </div>
        )}
        <div className="mt" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          <button className="btn btn-primary btn-block" onClick={() => { reset(); }}>⚔️ Yeni Dövüş</button>
          <button className="btn btn-secondary btn-block" onClick={() => setStep('select')}>🐓 Horoz Değiştir</button>
        </div>
      </div>
    );
  }

  return null;
}
