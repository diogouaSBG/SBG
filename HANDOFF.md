# Handoff para nova sessão Claude

## Contexto

App React "INETUM Viagens" (coordenação de viagens Lisboa↔Porto), deployada no Netlify.
- Repo: `diogouaSBG/SBG`, branch `claude/add-claude-documentation-ZylQk`
- Deploy automático: cada push para `main` faz deploy no Netlify

## O que já está feito

- Código fonte extraído e commitado no repo (`src/`, `public/`, `package.json`)
- Integração com Supabase implementada em `src/App.js` e `src/supabase.js`
- MCPs configurados em `.mcp.json`: **Supabase** e **Netlify** (disponíveis após reinício)

**Credenciais Supabase:**
- Project ID: `avjhendtreijnqsihhfi`
- URL: `https://avjhendtreijnqsihhfi.supabase.co`
- Publishable key: `sb_publishable_sBYeBsi6ybi_IY5Yk8K9RA_jlbnIQtd`

## O que falta fazer

### 1. Criar tabela no Supabase (via Supabase MCP)

```sql
CREATE TABLE trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  zone text NOT NULL,
  depart_day text NOT NULL,
  depart_time text NOT NULL,
  return_day text NOT NULL,
  return_time text NOT NULL,
  nights integer NOT NULL,
  porto_type text NOT NULL DEFAULT 'holiday',
  porto_other text DEFAULT '',
  porto_location text,
  week_start date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON trips FOR ALL USING (true) WITH CHECK (true);
```

### 2. Adicionar variáveis de ambiente no Netlify (via Netlify MCP)

- `REACT_APP_SUPABASE_URL` = `https://avjhendtreijnqsihhfi.supabase.co`
- `REACT_APP_SUPABASE_KEY` = `sb_publishable_sBYeBsi6ybi_IY5Yk8K9RA_jlbnIQtd`

### 3. Forçar novo deploy no Netlify (via Netlify MCP)

Para que o deploy apanhe as novas variáveis de ambiente.
