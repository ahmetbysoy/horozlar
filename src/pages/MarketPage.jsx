import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import RoosterCanvas from '../components/rooster/RoosterCanvas.jsx';
import { RarityBadge, ElementIcon } from '../components/common/Badges.jsx';
import Modal from '../components/common/Modal.jsx';
import { spendCoins, generateRooster, buyTakviye, useTakviye, TAKVIYELER, getTakviyeler, removeRooster, addCoins } from '../store/gameStore.js';
import { useToast } from '../components/common/Toast.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';
import EquipmentShop from '../components/market/EquipmentShop.jsx';
import TradingChart from '../components/market/TradingChart.jsx';
import { baseValue, generatePriceHistory, currentValue, priceChangePct } from '../engine/TradingEngine.js';
import { audio } from '../managers/AudioManager.js';
import { vibrate } from '../utils/vibrate.js';
import { sokakLaf, J } from '../utils/sokak.js';

const RARITY_MULT = { COMMON: 1, RARE: 2, EPIC: 4, LEGENDARY: 10 };

function createListings() {
  return Array.from({ length: 5 }, (_, i) => {
    const r = GeneticsEngine.createRooster(['Çelik','Fırtına','Ceylan','Kartal','Prens'][i]);
    const total = GeneticsEngine.totalStats(r);
    const price = Math.max(150, Math.floor((total * 5) * (RARITY_MULT[r.rarity] || 1)));
    const history = generatePriceHistory(r);
    return { id: r.id, rooster: r, price, history };
  });
}

export default function MarketPage() {
  const state = useGame();
  const toast = useToast();
  const [listings, setListings] = useState(createListings);
  const [buying, setBuying] = useState(null);
  const [tab, setTab] = useState('roosters');
  const [sellModal, setSellModal] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = () => { setListings(createListings()); toast(sokakLaf()); };

  // Borsa fiyatlarını zamanla dalgalandır (her 15 sn)
  const reprice = () => {
    setListings(prev => prev.map(l => {
      const last = l.history[l.history.length - 1];
      const drift = (Math.random() - 0.48) * 0.16;
      const newPrice = Math.max(l.history[0].price * 0.6, last.price * (1 + drift));
      const history = [...l.history.slice(-11), { t: l.history.length, price: Math.floor(newPrice) }];
      return { ...l, price: Math.floor(newPrice), history };
    }));
    setRefreshTick(t => t + 1);
  };

  const buy = () => {
    if (!buying) return;
    if (state.coins < buying.price) return toast('🟡 Papelin yetmiyor koçum');
    if (!spendCoins(buying.price)) return;
    generateRooster(buying.rooster.name);
    setListings(l => l.filter(x => x.id !== buying.id));
    setBuying(null);
    audio.coin(); vibrate('success');
    toast(`🛒 ${buying.rooster.name} alındı!`);
  };

  const buyItem = (item) => {
    const res = buyTakviye(item.id);
    if (!res.ok) return toast(res.msg || '⚠️ Alınamadı');
    audio.coin(); vibrate('success');
    toast(`✅ ${item.name} alındı`);
  };

  // Borsadan kendi horozunu sat
  const sellRooster = (r) => {
    const hist = generatePriceHistory(r);
    const val = currentValue(r, hist);
    addCoins(val);
    removeRooster(r.id);
    setSellModal(null);
    audio.coin(); vibrate('success');
    toast(`💰 ${r.name} ${val} papelle elden çıktı!`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🛒 Karaborsa</h1>
        <button className="btn btn-sm btn-secondary" onClick={refresh}>🔄 Yenile</button>
      </div>

      <div className="seg mb">
        <button className={tab === 'roosters' ? 'active' : ''} onClick={() => setTab('roosters')}>🐓 Horozlar</button>
        <button className={tab === 'borsa' ? 'active' : ''} onClick={() => setTab('borsa')}>📈 Bahis Kulübü</button>
        <button className={tab === 'takviye' ? 'active' : ''} onClick={() => setTab('takviye')}>💉 Takviye</button>
        <button className={tab === 'equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>🛡️ Ekipman</button>
      </div>

      {/* ---------- Horozlar ---------- */}
      {tab === 'roosters' && (
        <>
          <p className="muted mb" style={{ fontSize: 13 }}>{sokakLaf()}</p>
          <div className="grid grid-roosters">
            {listings.map(l => (
              <div key={l.id} className={`card rooster-card rarity-glow-${l.rooster.rarity}`} onClick={() => setBuying(l)}>
                <div className="center"><RoosterCanvas rooster={l.rooster} size={95} animated /></div>
                <div className="center" style={{ fontWeight: 700 }}>{l.rooster.name}</div>
                <div className="center" style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '4px 0' }}>
                  <RarityBadge rarity={l.rooster.rarity} /> <ElementIcon element={l.rooster.element} />
                </div>
                <div className="muted center" style={{ fontSize: 11 }}>Toplam {GeneticsEngine.totalStats(l.rooster)}</div>
                <div className="center" style={{ fontWeight: 800, color: 'var(--accent-yellow)', marginTop: 4 }}>🪙 {l.price}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------- Bahis Kulübü (Borsa) ---------- */}
      {tab === 'borsa' && (
        <>
          <div className="glass mb" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            📈 Horozların piyasa değeri her an dalgalanır. Düşükken al, yükselince sat. Grafik senin kulağın!
          </div>
          <button className="btn btn-sm btn-secondary mb" onClick={reprice}>🔄 Fiyatları Güncelle</button>

          <div className="glass mb">
            <h2 style={{ fontSize: 16 }}>🏦 Piyasada Satılık</h2>
            {listings.map(l => {
              const pct = priceChangePct(l.history);
              return (
                <div key={l.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 28 }}>{l.rooster.rarity === 'LEGENDARY' ? '🐲' : '🐓'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{l.rooster.name} <span className="muted" style={{ fontSize: 11 }}>{l.rooster.rarity}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <TradingChart history={l.history} width={130} height={50} />
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 800, color: 'var(--accent-yellow)' }}>🪙 {currentValue(l.rooster, l.history)}</div>
                        <div style={{ color: pct >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{pct >= 0 ? '▲' : '▼'} %{Math.abs(pct).toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-green" onClick={() => setBuying(l)}>AL</button>
                </div>
              );
            })}
          </div>

          <div className="glass">
            <h2 style={{ fontSize: 16 }}>💰 Horozlarım (Elden Çıkar)</h2>
            <p className="muted" style={{ fontSize: 12 }}>Piyasa değerinden sat, tabii değeri tutuyorsa...</p>
            {state.roosters.map(r => {
              const hist = generatePriceHistory(r);
              const val = currentValue(r, hist);
              const base = baseValue(r);
              const pct = ((val - base) / base) * 100;
              return (
                <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 24 }}>🐓</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 12 }} className={pct >= 0 ? '' : ''}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-yellow)' }}>🪙 {val}</span>
                      <span className="muted"> (baz {base})</span>{' '}
                      <span style={{ color: pct >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{pct >= 0 ? '▲' : '▼'} %{Math.abs(pct).toFixed(1)}</span>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => setSellModal(r)}>Sat</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- Takviyeler ---------- */}
      {tab === 'takviye' && (
        <>
          <p className="muted mb" style={{ fontSize: 13 }}>💉 Sokak takviyeleri — kural burada işlemez, sadece fırsat.</p>
          {TAKVIYELER.map(t => {
            const owned = getTakviyeler().find(x => x.id === t.id && !x.used);
            return (
              <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{t.name.split(' ')[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{t.name} <span className="badge" style={{ background: t.slot === 'KALICI' ? '#22c55e22' : t.slot === 'ANINDA' ? '#a855f722' : '#3b82f622', color: t.slot === 'KALICI' ? '#22c55e' : t.slot === 'ANINDA' ? '#a855f7' : '#3b82f6' }}>{t.slot === 'GECICI' ? '1 maç' : t.slot}</span></div>
                  <div className="muted" style={{ fontSize: 12 }}>{t.desc}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{t.sokak}</div>
                </div>
                <button className="btn btn-sm btn-gold" disabled={!!owned} onClick={() => buyItem(t)}>
                  {owned ? '✅ Sende' : `🪙 ${t.cost}`}
                </button>
              </div>
            );
          })}
          <div className="glass mt">
            <h2 style={{ fontSize: 15 }}>🎒 Çantamdakiler</h2>
            {getTakviyeler().filter(t => !t.used).length === 0 ? (
              <div className="muted" style={{ fontSize: 12 }}>Henüz takviyen yok.</div>
            ) : (
              getTakviyeler().filter(t => !t.used).map((t, i) => (
                <div key={i} className="card" style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{t.name}</span>
                  <button className="btn btn-sm btn-purple" onClick={() => { useTakviye(t.id); toast('✅ Uygulandı'); }}>Kullan</button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ---------- Ekipman ---------- */}
      {tab === 'equipment' && <EquipmentShop state={state} ownedIds={state.equipment.map(i => i.id)} />}

      {/* Satın alma modalı */}
      {buying && (
        <Modal title="Satın Al" onClose={() => setBuying(null)}>
          <div className="center">
            <RoosterCanvas rooster={buying.rooster} size={120} animated />
            <h2 style={{ margin: '8px 0 4px' }}>{buying.rooster.name}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <RarityBadge rarity={buying.rooster.rarity} /> <ElementIcon element={buying.rooster.element} />
            </div>
            <div className="glass mt" style={{ textAlign: 'left', fontSize: 13 }}>
              <div>⚔️ Güç: {buying.rooster.stats.power}</div>
              <div>💨 Hız: {buying.rooster.stats.speed}</div>
              <div>🛡️ Dayanıklılık: {buying.rooster.stats.stamina}</div>
              <div>❤️ Can: {buying.rooster.stats.maxHealth}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-yellow)', margin: '10px 0' }}>🪙 {buying.price}</div>
            <button className="btn btn-gold btn-block" onClick={buy} disabled={state.coins < buying.price}>
              {state.coins < buying.price ? 'Papel yetmiyor' : '🛒 Al'}
            </button>
          </div>
        </Modal>
      )}

      {/* Satış modalı */}
      {sellModal && (() => {
        const hist = generatePriceHistory(sellModal);
        const val = currentValue(sellModal, hist);
        return (
          <Modal title="💰 Horozu Elden Çıkar" onClose={() => setSellModal(null)}>
            <div className="center">
              <RoosterCanvas rooster={sellModal} size={110} />
              <h2 style={{ margin: '8px 0' }}>{sellModal.name}</h2>
              <div className="muted" style={{ fontSize: 13 }}>Piyasa değeri: <b style={{ color: 'var(--accent-yellow)' }}>🪙 {val}</b></div>
              <TradingChart history={hist} width={220} height={60} />
              <button className="btn btn-gold btn-block mt" onClick={() => sellRooster(sellModal)}>💸 {val} papelle Sat</button>
              <button className="btn btn-secondary btn-block mt" onClick={() => setSellModal(null)}>Vazgeç</button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
