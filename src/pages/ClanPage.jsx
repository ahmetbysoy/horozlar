import { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame.js';
import { createClan, joinClan, leaveClan, getClan, CLAN_COST } from '../engine/ClanEngine.js';
import { getPlayerId } from '../config/firebase.js';
import { useToast } from '../components/common/Toast.jsx';
import { audio } from '../managers/AudioManager.js';
import { vibrate } from '../utils/vibrate.js';

export default function ClanPage() {
  const state = useGame();
  const toast = useToast();
  const myPid = getPlayerId();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [joinTag, setJoinTag] = useState('');
  const [clan, setClan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.clanId) loadClan(state.clanId);
  }, [state.clanId]);

  async function loadClan(tag) {
    setLoading(true);
    const c = await getClan(tag);
    setClan(c);
    setLoading(false);
  }

  async function handleCreate() {
    setLoading(true);
    const res = await createClan(name, tag);
    setLoading(false);
    if (!res.ok) return toast('❌ ' + res.msg);
    audio.win(); vibrate('success');
    toast(`🏰 ${res.clan.name} klanı kuruldu!`);
    setClan(res.clan);
  }

  async function handleJoin() {
    setLoading(true);
    const res = await joinClan(joinTag);
    setLoading(false);
    if (!res.ok) return toast('❌ ' + res.msg);
    audio.win(); vibrate('success');
    toast(`🏰 ${res.clan.name} klanına katıldın!`);
    setClan(res.clan);
  }

  async function handleLeave() {
    setLoading(true);
    await leaveClan();
    setLoading(false);
    setClan(null);
    toast('👋 Klandan ayrıldın');
  }

  // Klan yoksa: kur/katıl ekranı
  if (!state.clanId && !clan) {
    return (
      <div>
        <h1>🏰 Klanlar</h1>
        <p className="muted mb">Bir klana katılarak arkadaşlarınla oyna, klan XP'si ve seviye kazan.</p>

        <div className="glass mb">
          <h2 style={{ fontSize: 16 }}>🏗️ Klan Kur</h2>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Klan adı (3+ karakter)"
            style={inputStyle} />
          <input value={tag} onChange={e => setTag(e.target.value.toUpperCase())} placeholder="Tag (3-5 harf, ör: HOROZ)" maxLength={5} style={inputStyle} />
          <button className="btn btn-gold btn-block mt" disabled={loading} onClick={handleCreate}>🏰 Kur ({CLAN_COST} 🪙)</button>
        </div>

        <div className="glass">
          <h2 style={{ fontSize: 16 }}>🔍 Klandan Katıl</h2>
          <input value={joinTag} onChange={e => setJoinTag(e.target.value.toUpperCase())} placeholder="Klan tag'ı gir" maxLength={5} style={inputStyle} />
          <button className="btn btn-blue btn-block mt" disabled={loading} onClick={handleJoin}>🤝 Katıl</button>
        </div>
      </div>
    );
  }

  // Klan yok ama clanId var (yükleniyor)
  if (!clan) {
    return (
      <div className="center" style={{ marginTop: 60 }}>
        <div style={{ fontSize: 40 }}>🏰</div>
        <p className="muted">Klan yükleniyor...</p>
      </div>
    );
  }

  // Klan görünümü
  const members = Object.entries(clan.members || {});
  return (
    <div>
      <h1>🏰 {clan.name} <span className="muted" style={{ fontSize: 14 }}>[{clan.tag}]</span></h1>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Seviye {clan.level}</div>
            <div className="muted" style={{ fontSize: 12 }}>XP: {clan.xp} · Üye: {clan.memberCount}/{clan.maxMembers}</div>
          </div>
          <span className="badge" style={{ background: '#3b82f622', color: '#3b82f6' }}>👑 Lider: {clan.leaderId === myPid ? 'Sen' : clan.members?.[clan.leaderId]?.name || clan.leaderId.slice(0, 8)}</span>
        </div>
      </div>

      <div className="glass">
        <h2 style={{ fontSize: 16 }}>👥 Üyeler ({members.length})</h2>
        {members.map(([id, m]) => (
          <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span>{m.role === 'leader' ? '👑' : '🐓'} {m.name || id.slice(0, 10)}</span>
            <span className="muted" style={{ fontSize: 12 }}>{m.role === 'leader' ? 'Lider' : 'Üye'} · +{m.contribution}</span>
          </div>
        ))}
      </div>

      <div className="glass mt">
        <h2 style={{ fontSize: 16 }}>ℹ️ Klan Seviyeleri</h2>
        <div className="muted" style={{ fontSize: 13 }}>
          Lv1: 10 üye · Lv2: 15 üye (1000 XP) · Lv3: 20 üye (2000 XP) · Lv5: 30 üye (4000 XP)
        </div>
      </div>

      <button className="btn btn-secondary btn-block mt" onClick={handleLeave}>👋 Klandan Ayrıl</button>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: 10, borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.2)', background: '#1a1a2e', color: '#fff',
  marginBottom: 8,
};
