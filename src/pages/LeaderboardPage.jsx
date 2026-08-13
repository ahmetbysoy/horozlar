import { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame.js';
import { fetchLeaderboard, sortByMode, rankMedal } from '../engine/LeaderboardEngine.js';
import { getPlayerId } from '../config/firebase.js';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';

const MODES = [
  { id: 'prestige', label: '⭐ Prestij' },
  { id: 'power', label: '💪 Güç' },
  { id: 'wins', label: '🏆 Galibiyet' },
  { id: 'season', label: '📅 Sezon' },
];

export default function LeaderboardPage() {
  const state = useGame();
  const [mode, setMode] = useState('prestige');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const myPid = getPlayerId();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchLeaderboard().then(list => {
      if (!mounted) return;
      setEntries(list);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [mode]);

  const sorted = sortByMode(entries, mode);
  const myIndex = sorted.findIndex(e => e.id === myPid);
  const myEntry = sorted[myIndex];

  const fmt = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n || 0;
  };

  const valueOf = (e) => e[mode] || 0;

  return (
    <div>
      <h1>🏆 Lider Tablosu</h1>
      <p className="muted mb" style={{ fontSize: 13 }}>Dünyanın en güçlü horoz yetiştiricileri.</p>

      <div className="seg mb">
        {MODES.map(m => (
          <button key={m.id} className={mode === m.id ? 'active' : ''} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="center" style={{ marginTop: 50 }}><div style={{ fontSize: 40 }}>⏳</div><p className="muted">Yükleniyor...</p></div>
      ) : sorted.length === 0 ? (
        <div className="glass center" style={{ padding: 40 }}>
          <div style={{ fontSize: 48 }}>🏆</div>
          <p>Henüz kayıtlı oyuncu yok. İlk sen ol!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podyum */}
          <div className="mb" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 110 }}>
            {[1, 0, 2].map(place => {
              const e = sorted[place];
              if (!e) return <div key={place} style={{ flex: 1 }} />;
              const heights = ['96px', '110px', '80px'];
              const colors = ['#C0C0C0', '#FFD700', '#CD7F32'];
              return (
                <div key={place} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                  <div style={{ margin: '4px 0', fontSize: 20 }}>{rankMedal(place)}</div>
                  <div style={{ height: heights[place], background: `linear-gradient(180deg, ${colors[place]}, rgba(255,255,255,0.1))`, borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6 }}>
                    <b>{fmt(valueOf(e))}</b>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Listeleme */}
          <div className="glass">
            {sorted.slice(0, 20).map((e, i) => {
              const isMe = e.id === myPid;
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: isMe ? 'rgba(245,158,11,0.12)' : 'transparent',
                  borderRadius: 8,
                }}>
                  <span style={{ width: 28, textAlign: 'center', fontWeight: 800 }}>{rankMedal(i)}</span>
                  <span style={{ fontSize: 18 }}>{isMe ? '🐓' : (e.clanId ? '🏰' : '🐔')}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.name}{isMe && <span className="badge" style={{ background: '#f59e0b22', color: '#f59e0b', marginLeft: 6 }}>Sen</span>}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>Sv {e.level || 1} · {e.wins || 0} galibiyet</div>
                  </div>
                  <b style={{ color: 'var(--accent-yellow)' }}>{fmt(valueOf(e))}</b>
                </div>
              );
            })}
          </div>

          {/* Benim sıram */}
          {myEntry && myIndex >= 20 && (
            <div className="card mt" style={{ border: '1px solid #f59e0b55' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, textAlign: 'center', fontWeight: 800 }}>#{myIndex + 1}</span>
                <span style={{ fontSize: 18 }}>🐓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{myEntry.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>Senin sıran</div>
                </div>
                <b style={{ color: 'var(--accent-yellow)' }}>{fmt(valueOf(myEntry))}</b>
              </div>
            </div>
          )}

          <div className="muted center mt" style={{ fontSize: 11 }}>Skorun her dövüş/işlem sonrası otomatik güncellenir.</div>
        </>
      )}
    </div>
  );
}
