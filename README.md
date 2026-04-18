# 🚄 INETUM Viagens — Teams Tab App

Coordenação de viagens semanais Lisboa ↔ Porto para consultores INETUM.

---

## 🚀 Instalação e desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edita o .env com o URL do webhook do Teams (opcional)

# 3. Iniciar em modo de desenvolvimento
npm start
# → Abre em http://localhost:3000
```

---

## ☁️ Deploy — Azure Static Web Apps (recomendado)

1. Faz build da app:
   ```bash
   npm run build
   ```

2. No portal Azure, cria um recurso **Static Web App**:
   - Plano: Free
   - Região: West Europe
   - Origem: pasta `build/` gerada

3. Ou usa o CLI:
   ```bash
   npm install -g @azure/static-web-apps-cli
   swa deploy ./build --app-name inetum-viagens
   ```

---

## 📦 Adicionar ao Microsoft Teams

### Opção A — Tab num canal (mais usado em equipa)

1. No Teams, abre o canal do projeto
2. Clica em **+** (adicionar separador)
3. Escolhe **Website** (ou "App" se fizeres upload do manifesto)
4. Cola o URL da app: `https://inetum-viagens.azurestaticapps.net`
5. Dá o nome **"Viagens"** e confirma

### Opção B — App personalizada (manifesto)

1. Edita `teams-manifest/manifest.json`:
   - Substitui `YOUR_APP_URL` pelo URL real da app
   - Substitui `YOUR_APP_DOMAIN` pelo domínio (ex: `inetum-viagens.azurestaticapps.net`)
   - Adiciona ícones `icon-color.png` (192×192) e `icon-outline.png` (32×32)

2. Faz zip da pasta `teams-manifest/`:
   ```bash
   cd teams-manifest && zip -r ../inetum-viagens-teams.zip .
   ```

3. No Teams: **Apps** > **Gerir as tuas apps** > **Carregar uma app** > seleciona o `.zip`

---

## 🔔 Notificações automáticas (Webhook)

A app envia notificações ao canal Teams automaticamente quando:
- ✅ Um consultor se regista numa viagem
- 🚗 Se atingem 3 pessoas num dia (podem ir de carro!)
- ❌ Alguém cancela uma viagem

### Como configurar o Webhook:

1. No canal Teams: `...` > **Connectors** > **Incoming Webhook** > **Add**
2. Dá o nome **"INETUM Viagens"** e confirma
3. Copia o URL gerado
4. Cola no `.env`:
   ```
   REACT_APP_TEAMS_WEBHOOK=https://outlook.office.com/webhook/XXXXX
   ```
5. Faz rebuild e redeploy

---

## 🗂 Estrutura do projeto

```
inetum-viagens/
├── public/
│   └── index.html
├── src/
│   ├── index.js          # Entry point React
│   ├── App.js            # App principal
│   ├── useTeams.js       # Hook de integração Teams SDK
│   └── teamsNotify.js    # Notificações via Webhook
├── teams-manifest/
│   └── manifest.json     # Manifesto para Teams App
├── .env.example
└── package.json
```

---

## 🛠 Próximos passos sugeridos

- [ ] Backend com base de dados (ex: Azure Cosmos DB ou Supabase) para persistência
- [ ] Login automático com conta Microsoft (SSO via Teams SDK)
- [ ] Bot que responde a comandos no Teams (ex: `/viagens segunda`)
- [ ] Resumo semanal automático enviado toda segunda-feira de manhã
