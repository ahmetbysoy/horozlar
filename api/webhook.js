// Telegram Bot webhook — /start ve /oyna komutlarına WebApp butonuyla yanıt verir
// Vercel serverless fonksiyonu. WEBHOOK_SECRET'teki bot token'ı ile setWebhook edilir.

const GAME_URL = 'https://horoz-imparatorlugu.vercel.app';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

function sendMessage(chatId, text, replyMarkup) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup, parse_mode: 'HTML' }),
  }).then(r => r.json());
}

const mainButton = {
  inline_keyboard: [[
    { text: '🐓 Hemen Oyna', web_app: { url: GAME_URL } },
    { text: 'ℹ️ Nasıl Oynanır', web_app: { url: GAME_URL + '/#nasil' } },
  ]],
};

const WELCOME = `🐓 <b>Horoz İmparatorluğu</b>'na hoş geldin!

🧬 Genetik horozlarını üret
🏋️ Antrenmanla güçlendir
⚔️ Arenada dövüş, bahis koy
🤺 Arkadaşlarınla PVP yap
🛡️ Ekipmanlarla güçlen
🏆 İmparatorluğunu kur!

Aşağıdaki butona dokunarak oyunu başlat!`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const msg = body?.message;
    if (msg && typeof msg.text === 'string') {
      const text = msg.text.trim();
      const chatId = msg.chat.id;
      if (text === '/start' || text === '/oyna' || text.toLowerCase().includes('oyna') || text.toLowerCase().includes('başla')) {
        await sendMessage(chatId, WELCOME, mainButton);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}
