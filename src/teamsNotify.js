/**
 * Teams Incoming Webhook Notifier
 * 
 * Como configurar:
 * 1. No canal Teams, clica em "..." > "Connectors"
 * 2. Adiciona "Incoming Webhook", dá-lhe um nome (ex: "INETUM Viagens")
 * 3. Copia o URL gerado e cola em REACT_APP_TEAMS_WEBHOOK no .env
 */

const WEBHOOK_URL = process.env.REACT_APP_TEAMS_WEBHOOK || null;

const sendTeamsMessage = async (card) => {
  if (!WEBHOOK_URL) return; // silently skip if no webhook configured
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
  } catch (err) {
    console.warn('Teams webhook notification failed:', err);
  }
};

export const notifyNewTrip = async ({ name, zone, departDay, departTime, returnDay, returnTime, nights, portoLocation }) => {
  const isOffice = portoLocation.includes('Escritório');
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "6366f1",
    "summary": `${name} registou viagem para ${departDay}`,
    "sections": [{
      "activityTitle": `🚄 Nova viagem registada`,
      "activitySubtitle": `${name} vai a Lisboa→Porto`,
      "activityImage": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/240px-Microsoft_logo.svg.png",
      "facts": [
        { "name": "👤 Consultor", "value": name },
        { "name": "📍 Zona Lisboa", "value": zone },
        { "name": "🔵 Partida Lisboa", "value": `${departDay} às ${departTime}` },
        { "name": "🟣 Regresso Porto", "value": `${returnDay} às ${returnTime}` },
        { "name": "🌙 Noites no Porto", "value": `${nights} noite${nights !== 1 ? 's' : ''}` },
        { "name": isOffice ? "🏢 Escritório" : "🏨 Hotel", "value": portoLocation },
      ],
      "markdown": true
    }]
  };
  await sendTeamsMessage(card);
};

export const notifyCarReady = async ({ day, travelers }) => {
  const names = travelers.map(t => `• ${t.name} (${t.zone}, parte às ${t.departTime})`).join('\n');
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "22c55e",
    "summary": `🚗 Já há 3 pessoas para carro na ${day}!`,
    "sections": [{
      "activityTitle": `🚗 Podem ir de carro na ${day}!`,
      "activitySubtitle": `${travelers.length} consultores registados — carro é mais económico que comboio`,
      "facts": travelers.map(t => ({
        "name": t.name,
        "value": `📍 ${t.zone} · 🕐 ${t.departTime} · 🌙 ${t.nights}n · ${t.portoLocation}`
      })),
      "markdown": true
    }]
  };
  await sendTeamsMessage(card);
};

export const notifyTripRemoved = async ({ name, day }) => {
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "ef4444",
    "summary": `${name} cancelou viagem de ${day}`,
    "sections": [{
      "activityTitle": `❌ Viagem cancelada`,
      "activitySubtitle": `${name} removeu a viagem de **${day}**`,
      "markdown": true
    }]
  };
  await sendTeamsMessage(card);
};
