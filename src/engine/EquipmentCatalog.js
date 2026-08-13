// ============================================================
// EQUIPMENT CATALOG — Ekipman tanımları (doküman §6.14/§6.15)
// Slot: BEAK=Güç, FEATHER=Dayanıklılık, CLAW=Hız
// ============================================================

export const EQUIPMENT_SLOT = {
  BEAK:   { label: 'Gaga',   stat: 'power',   icon: '👄' },
  FEATHER: { label: 'Tüy',   stat: 'stamina', icon: '🪶' },
  CLAW:   { label: 'Tırnak', stat: 'speed',   icon: '🐾' },
};

const RARITY_COLOR = { COMMON: '#9CA3AF', RARE: '#3B82F6', EPIC: '#A855F7', LEGENDARY: '#F59E0B' };

export const EQUIPMENT_ITEMS = [
  // COMMON — 200 coin
  { id: 'beak_sharp',   name: 'Keskin Gaga',   slot: 'BEAK',   rarity: 'COMMON', stat: 'power',   value: 5,  cost: { coins: 200 } },
  { id: 'feather_shield', name: 'Kalkan Tüyler', slot: 'FEATHER', rarity: 'COMMON', stat: 'stamina', value: 5,  cost: { coins: 200 } },
  { id: 'claw_fast',    name: 'Hızlı Tırnak',  slot: 'CLAW',   rarity: 'COMMON', stat: 'speed',   value: 5,  cost: { coins: 200 } },
  // RARE — 500 coin
  { id: 'beak_gold',    name: 'Altın Gaga',    slot: 'BEAK',   rarity: 'RARE', stat: 'power',   value: 10, cost: { coins: 500 } },
  { id: 'feather_steel', name: 'Çelik Zırh',   slot: 'FEATHER', rarity: 'RARE', stat: 'stamina', value: 10, cost: { coins: 500 } },
  { id: 'claw_wind',    name: 'Rüzgar Tırnağı', slot: 'CLAW',  rarity: 'RARE', stat: 'speed',   value: 10, cost: { coins: 500 } },
  // EPIC — 1 diamond
  { id: 'beak_legend',  name: 'Efsane Gaga',   slot: 'BEAK',   rarity: 'EPIC', stat: 'power',   value: 20, cost: { diamonds: 1 } },
  { id: 'feather_dragon', name: 'Ejder Zırhı', slot: 'FEATHER', rarity: 'EPIC', stat: 'stamina', value: 20, cost: { diamonds: 1 } },
  { id: 'claw_lightning', name: 'Yıldırım Tırnağı', slot: 'CLAW', rarity: 'EPIC', stat: 'speed', value: 20, cost: { diamonds: 1 } },
];

export function getEquipmentById(id) {
  return EQUIPMENT_ITEMS.find(i => i.id === id) || null;
}

export function rarityColor(rarity) { return RARITY_COLOR[rarity] || '#9CA3AF'; }

// Ekipman bonusunu hesapla: verilen inventory item'larından (equippedTo) bonus
export function equipmentBonusForRooster(inventory, roosterId) {
  const bonus = { power: 0, speed: 0, stamina: 0 };
  inventory.forEach(item => {
    if (item.equippedTo === roosterId) bonus[item.stat] += item.value;
  });
  return bonus;
}

// Ekipman dahil etkin statları ver
export function effectiveStats(rooster, inventory) {
  const bonus = equipmentBonusForRooster(inventory, rooster.id);
  const power = rooster.stats.power + bonus.power;
  const speed = rooster.stats.speed + bonus.speed;
  const stamina = rooster.stats.stamina + bonus.stamina;
  return { power, speed, stamina, maxHealth: stamina * 10 };
}
