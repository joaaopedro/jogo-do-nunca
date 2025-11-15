# 🚀 Guia de Deployment — O Jogo do Nunca

## Visão Geral

O projeto consiste em duas partes:
1. **Site estático** (HTML/CSS/JS) — hospedado no GitHub Pages
2. **Servidor API** (Node.js) — hospedado no Render/Railway (opcional, para contagem global)

### Arquitetura
```
GitHub Pages (estático)  ←→  Render API (dinamicidad)
 https://joaaopedro         https://jogo-do-nunca
 .github.io/                 -server.onrender.com
 jogo-do-nunca/              
```

---

## Opção 1: Testes Locais (Rápido)

### Pré-requisitos
- Node.js >= 14 instalado
- Python ou Node.js (para servidor estático)

### Passos

1. **Clone o repositório** (se ainda não fez):
   ```bash
   git clone https://github.com/joaaopedro/jogo-do-nunca.git
   cd jogo-do-nunca
   ```

2. **Execute o script de inicialização**:
   ```powershell
   .\start-local.bat
   ```
   Isso abrirá:
   - Servidor Node na porta 3000 (API)
   - Servidor estático na porta 8000 (site)
   - Navegador em http://localhost:8000

3. **Configurar cliente para usar servidor local**:
   - Em `index.html`, descomente a linha (seção "CONFIGURAÇÃO DA API"):
     ```javascript
     window.API_BASE = 'http://localhost:3000';
     ```

4. **Testes**:
   - Abra http://localhost:8000
   - Recarregue a página → `#visitInfo` deve mostrar contador incremental (global)
   - Insira nome e jogue
   - Ao vencer, o Top 10 global aparece no modal
   - Recarregue → contador de visitas continua incrementando

---

## Opção 2: Deployment em Produção (Render)

### Pré-requisitos
- Conta GitHub (você já tem)
- Conta no Render (https://render.com) — gratuita

### Passos

#### 1. Deploy do Servidor (Render)

1. Acesse https://render.com e faça login com sua conta GitHub
2. Clique em **New** → **Web Service**
3. Configure:
   - **Name**: `jogo-do-nunca-server`
   - **Repository**: `joaaopedro/jogo-do-nunca`
   - **Branch**: `main`
   - **Root Directory**: `server` ← **importante**
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Starter (gratuito, ok para testes)

4. **Environment Variables** (opcional, para segurança):
   - Se quiser proteger a API com uma chave:
     - Chave: `API_KEY`
     - Valor: coloque uma senha forte (ex: `seu-secret-key-aqui`)
   - Deixe em branco se não quiser usar chave (acesso aberto)

5. Clique em **Create Web Service**
6. Aguarde o deploy (2-3 minutos)
7. Após sucesso, copie o URL que aparece no topo (ex: `https://jogo-do-nunca-server.onrender.com`)

#### 2. Configurar Cliente (GitHub Pages)

1. Em seu repositório local, abra `index.html`
2. Na seção **"CONFIGURAÇÃO DA API"**, descomente e configure:
   ```javascript
   window.API_BASE = 'https://jogo-do-nunca-server.onrender.com';
   // window.API_KEY = 'seu-secret-key-aqui'; // descomente se usou API_KEY no Render
   ```

3. Faça commit e push:
   ```bash
   git add index.html
   git commit -m "Configure API_BASE for Render deployment"
   git push
   ```

4. GitHub Pages atualizará automaticamente (em ~1 minuto)

#### 3. Teste

- Acesse https://joaaopedro.github.io/jogo-do-nunca/
- Recarregue a página → `#visitInfo` mostra contador global
- Jogue e submeta um score → Top 10 global aparece

---

## Opção 3: Deployment no Railway (Alternativa ao Render)

Se preferir Railway ao Render:

1. Acesse https://railway.app e faça login com GitHub
2. Clique em **New Project** → **Deploy from GitHub repo**
3. Selecione `jogo-do-nunca`
4. Configure:
   - **Service Name**: `server`
   - **Root Directory**: deixe automático ou especifique `server`
   - **Start Command**: `npm install && node index.js`
5. Defina **Environment Variables** (se quiser API_KEY)
6. Deploy → copie o URL público (ex: `https://jogo-do-nunca-server-prod.up.railway.app`)
7. Configure em `index.html` conforme Opção 2

---

## Segurança (Recomendações)

### API_KEY (Proteção contra spam)

Se ativar `API_KEY` no servidor:

1. Defina uma senha forte no Render/Railway (ex: 32 caracteres aleatórios)
2. Configure no cliente (`index.html`):
   ```javascript
   window.API_BASE = 'https://seu-servidor.com';
   window.API_KEY = 'sua-chave-secreta';
   ```
3. O cliente enviará o header `x-api-key` em todas as requisições; servidor válida

**Nota**: Não coloque a chave real no repositório público. Se o repo for público, use um arquivo `.env` local que não é commitado, ou configure a chave apenas no deploy (Render/Railway).

### Rate Limiting (Futuro)

Considere adicionar rate limiting no servidor para evitar abuso:
- Limitar requisições por IP
- Limitar submissões de score (máx 1 por minuto por IP)
- Usar reCAPTCHA em /score

---

## Estrutura de Diretórios

```
jogo-do-nunca/
├── index.html           ← Página principal (hospedada no GitHub Pages)
├── style.css            ← Estilos
├── script.js            ← Lógica do jogo (inclui client API)
├── imagens/             ← GIFs do jogo
├── start-local.bat      ← Script para testes locais (Windows)
├── server/              ← Servidor Node (hospedado em Render)
│   ├── package.json
│   ├── index.js         ← App Express (endpoints /visit, /score, /stats)
│   └── data.json        ← Dados persistidos (visits, leaderboard)
├── DEPLOYMENT.md        ← Este arquivo
└── ...
```

---

## Endpoints da API

### GET /stats
Retorna contagem global e leaderboard.

**Resposta:**
```json
{
  "visits": 42,
  "leaderboard": [
    {"name": "João", "timeMs": 5234, "at": "2025-11-15T..."},
    {"name": "Maria", "timeMs": 7891, "at": "2025-11-15T..."}
  ]
}
```

### POST /visit
Incrementa contador global de visitas.

**Headers:**
- `x-api-key`: (opcional; só se servidor tiver API_KEY)

**Resposta:**
```json
{"visits": 43}
```

### POST /score
Submete um score e atualiza leaderboard.

**Body:**
```json
{"name": "João", "timeMs": 5234}
```

**Headers:**
- `Content-Type: application/json`
- `x-api-key`: (opcional)

**Resposta:**
```json
{
  "leaderboard": [
    {"name": "João", "timeMs": 5234, "at": "2025-11-15T..."},
    ...
  ]
}
```

---

## Troubleshooting

### "Visitação não aparece no #visitInfo"
- Verifique se `window.API_BASE` está correto em `index.html`
- Abra DevTools (F12) → Console e procure por erros de fetch
- Teste manualmente: `curl https://seu-servidor/stats`

### "Servidor não inicia localmente"
- Verifique Node.js: `node --version` (deve ser >= 14)
- Reinstale dependências: `cd server && npm install`
- Verifique porta 3000 em uso: `netstat -ano | findstr :3000` (Windows)

### "API_KEY não funciona"
- Certifique-se de que `window.API_KEY` no cliente corresponde ao valor em Render/Railway
- Verifique header enviado: abra DevTools → Network → requisição POST /visit → Headers

### "data.json não persiste"
- Render persiste o arquivo, mas se você deletar o serviço, os dados são perdidos
- Para persistência confiável, migre para Supabase/PostgreSQL

---

## Próximas Melhorias

1. **Banco de dados** (Supabase/PostgreSQL): substitui data.json, escalável
2. **Rate limiting**: limita requisições por IP
3. **Validação**: sanitizar nomes, rechear requisiçoes anormais
4. **Autenticação de score**: evitar trapaça (ex: assinatura digital)
5. **Histórico de visitas**: guardar data/hora de cada visita

---

## Suporte

Para dúvidas ou problemas:
- Abra uma issue em https://github.com/joaaopedro/jogo-do-nunca/issues
- Verifique logs do Render: painel de serviço → Logs

---

**Última atualização**: 15 de Novembro de 2025
