# Jogo do Nunca 🎮

Um site troll interativo e impossível de usar! O mouse se comporta de forma **invertida** e o botão sempre **escapa**. Teste sua paciência e veja se consegue clicar no botão misterioso.

## 🎯 Objetivo

Tente clicar no botão evasivo e entre para o **ranking global**! A competição é global — veja quantas pessoas já tentaram antes de você.

- ⏱️ **Cronômetro**: Quanto tempo você leva para clicar?
- 🏆 **Ranking Global**: Seu tempo é salvo e comparado com o mundo inteiro
- 👥 **Contador de Visitantes**: Acompanhe quantas pessoas já caíram nesta armadilha!

## 🎮 Como Funciona

### Game Mechanics

- **🔄 Mouse Invertido**: Você move o mouse para a **direita**? Ele vai para a **esquerda** (e vice-versa em ambos os eixos)
- **🏃 Botão Escapista**: Conforme você se aproxima, o botão **muda de posição aleatoriamente**
- **📊 Timer em Tempo Real**: Veja o tempo passar enquanto luta contra a física invertida
- **✨ Efeitos Visuais**: Animações coloridas, tremidas, glitches e emojis trolladores quando você falha

### Features

✅ **Mouse Invertido Dinâmico**
- Cálculo matemático em tempo real (windowWidth - mouseX)
- Suave e responsivo

✅ **Botão com IA Evasiva**
- Evita você automaticamente quando próximo
- Usa detecção de distância euclidiana

✅ **Sistema de Ranking Global**
- Backend Node.js com Express
- Banco de dados persistente (data.json)
- Top 10 leaderboard atualizado em tempo real
- Sincronização com GitHub Pages via API

✅ **Contador Global de Visitantes**
- Rastreia quantas pessoas acessaram o site
- Persiste entre sessões
- Exibido em tempo real na interface

✅ **Nome do Jogador**
- Modal de início para coletar seu nome
- Seu tempo é salvo com seu nome no ranking
- Persistência local via localStorage

✅ **Timer Visível**
- Exibido dentro do container do jogo
- Atualizado a cada frame com requestAnimationFrame
- Mostra milissegundos para competição justa

✅ **Autenticação Opcional**
- API_KEY para proteger o servidor (env var)
- x-api-key header no cliente
- Fallback para localStorage se servidor indisponível

## 🚀 Quick Start (Local)

### Opção 1: Script Automático (Windows)
```bash
# Na pasta do projeto, execute:
.\start-local.bat
```
O script irá:
1. Instalar dependências (se necessário)
2. Iniciar o servidor backend na porta 3000
3. Iniciar servidor estático na porta 8000
4. Abrir o navegador automaticamente

### Opção 2: Manual

**Terminal 1 — Backend (Node.js)**
```bash
cd server
npm install
npm start
# Listening on http://localhost:3000
```

**Terminal 2 — Frontend (Estático)**
```bash
# Use Python:
python -m http.server 8000

# Ou use Node.js (http-server):
npx http-server -p 8000
```

**Navegador**
Abra: http://localhost:8000

### Configuração da API

No arquivo `index.html`, procure pela seção de configuração (logo após `<body>`):

```javascript
<script>
  // 🔧 CONFIGURAÇÃO DA API
  // Para usar o backend local, descomente a linha abaixo:
  // window.API_BASE = 'http://localhost:3000';
  
  // Para usar backend em produção (ex: Render, Railway):
  // window.API_BASE = 'https://seu-dominio-backend.com';
  
  // Autenticação (opcional):
  // Somente necessário se seu servidor tiver API_KEY configurada
  // window.API_KEY = 'sua-chave-secreta-aqui';
</script>
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB PAGES (Frontend)                   │
│                  https://seu-site.github.io                  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  index.html, script.js, style.css (estáticos)        │   │
│  │  - Inverted cursor, evasive button, timer, modal      │   │
│  │  - Fetch API calls to backend (com fallback)          │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↓ API Calls
                        (fetch headers)
┌─────────────────────────────────────────────────────────────┐
│              RENDER / RAILWAY (Backend API)                  │
│              https://seu-backend.com                         │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  Node.js + Express (server/index.js)                 │   │
│  │  ├─ GET  /stats          → visits + leaderboard      │   │
│  │  ├─ POST /visit          → increment visits          │   │
│  │  └─ POST /score          → submit score + leaderboard│   │
│  │                                                        │   │
│  │  Persistence: data.json                              │   │
│  │  └─ {visits: number, leaderboard: [{name, timeMs}]} │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Fallback: localStorage (se backend indisponível)
```

## 🛠️ Stack Técnico

### Frontend
- **HTML5**: Semântica, estrutura
- **CSS3**: Animações (keyframes), gradientes, positioning
- **Vanilla JavaScript**: Game loop (requestAnimationFrame), DOM manipulation
- **Web APIs**: 
  - localStorage (persistência local)
  - Fetch API (chamadas HTTP)
  - Web Speech API (leitura de contadores via voz - F1)
  - Web Audio API (efeitos sonoros opcionais)

### Backend
- **Node.js**: Runtime JavaScript server-side
- **Express**: Framework web minimalista
- **body-parser**: Parse JSON
- **CORS**: Cross-Origin Resource Sharing
- **fs**: Persistência em arquivo (data.json)

### DevOps
- **GitHub Pages**: Hosting estático gratuito
- **Render / Railway**: Hosting backend gratuito
- **Local Testing**: Python http.server ou npx http-server

## 📚 Endpoints da API

**Base URL**: Configurada em `window.API_BASE` (index.html)

### `GET /stats`
Retorna estatísticas globais.

**Response**:
```json
{
  "visits": 1337,
  "leaderboard": [
    {"name": "João", "timeMs": 5234},
    {"name": "Maria", "timeMs": 7891}
  ]
}
```

### `POST /visit`
Incrementa o contador global de visitantes.

**Headers** (opcional):
```
x-api-key: sua-chave-secreta
```

**Response**:
```json
{
  "visits": 1338
}
```

### `POST /score`
Submete um tempo e retorna o leaderboard atualizado (top 10).

**Body**:
```json
{
  "name": "João",
  "timeMs": 5234
}
```

**Headers** (opcional):
```
x-api-key: sua-chave-secreta
```

**Response**:
```json
{
  "leaderboard": [
    {"name": "João", "timeMs": 5234},
    {"name": "Maria", "timeMs": 7891}
  ]
}
```

## 🔐 Segurança

### API Key (Opcional)

Se você quer proteger seus endpoints:

1. **No servidor** (`server/index.js`):
   ```bash
   export API_KEY="sua-chave-super-secreta"
   npm start
   ```

2. **No cliente** (`index.html`):
   ```javascript
   window.API_KEY = 'sua-chave-super-secreta';
   ```

O cliente irá enviar a chave no header `x-api-key` automaticamente.

### Rate Limiting

Para produção, considere adicionar rate limiting (via middleware Express como `express-rate-limit`):
```bash
npm install express-rate-limit
```

## 📖 Deployment

Veja o arquivo `DEPLOYMENT.md` para guias detalhados:
- ✅ Local testing (start-local.bat)
- ✅ Deploy no Render.com
- ✅ Deploy no Railway.app
- ✅ Troubleshooting comum

## 🎓 Como Funciona o "Mouse Invertido"?

O cálculo é bem simples:

```javascript
// Posição real do mouse
const realMouseX = e.clientX;
const realMouseY = e.clientY;

// Posição invertida
const invertedX = window.innerWidth - realMouseX;
const invertedY = window.innerHeight - realMouseY;

// Renderizar fake cursor nessa posição
fakeCursor.style.left = invertedX + 'px';
fakeCursor.style.top = invertedY + 'px';
```

Simples, mas eficaz! 🤯

## 🎯 O Desafio

Conseguir clicar no botão com o mouse invertido é **surpreendentemente difícil**. A maioria das pessoas leva entre 5 a 30 segundos. Os top jogadores? Menos de 2 segundos! 🚀

Você consegue entrar para o ranking?

## 📝 Licença

MIT — Fique à vontade para copiar, modificar e distribuir!

## 🤝 Contribuições

Encontrou um bug? Quer adicionar um feature? Abra uma issue ou faça um PR!

---

**Feito com ❤️ (e um toque de trolismo)** 🎮
- **CTRL (Segurando)**: O botão fica parado e não se move mais!

## 🎊 Quando conseguir clicar

Uma explosão de emojis, som de vitória, e uma tela comemorativa mostra quantas vezes você errou!

## 📁 Estrutura do Projeto

```
jogo-do-nunca/
├── index.html      # Estrutura HTML
├── style.css       # Estilos e animações
├── script.js       # Lógica do jogo
├── .gitignore      # Arquivos ignorados
└── README.md       # Este arquivo
```

## 🚀 Como usar

1. Abra o `index.html` em um navegador
2. Tente clicar no botão (boa sorte!)
3. Se ficar muito difícil, use os cheat codes com SHIFT ou CTRL

## 🌐 Versão Online

Acesse via ngrok em: `https://semibiologic-quondam-teri.ngrok-free.dev`

## 👨‍💻 Desenvolvido com

- HTML5
- CSS3 (Animações e Gradientes)
- JavaScript Vanilla
- Web Audio API (para sons)

## 📝 Notas

Este é um projeto de trolagem para divertir amigos! 😈

Divirta-se!

# Jogo do Nunca

Jogo interativo onde você tenta clicar em um botão impossível!

## 🌐 Endpoints da API (Render)

Quando você fizer deploy no Render, sua API estará disponível em:
`https://seu-app.onrender.com`

### Endpoints disponíveis:

```
GET  /                  - Informações da API
GET  /health            - Health check
POST /visit             - Registrar visita
POST /score             - Enviar score
GET  /stats             - Estatísticas globais
POST /admin/reset       - Resetar leaderboard (requer senha)
```

### Como testar os endpoints:

#### 1. Health Check
```bash
curl https://seu-app.onrender.com/health
```

#### 2. Enviar Score
```bash
curl -X POST https://seu-app.onrender.com/score \
  -H "Content-Type: application/json" \
  -d '{"name":"Jogador Teste","timeMs":12345}'
```

#### 3. Ver Estatísticas
```bash
curl https://seu-app.onrender.com/stats
```

#### 4. Resetar Leaderboard (Admin)
```bash
curl -X POST https://seu-app.onrender.com/admin/reset \
  -H "Content-Type: application/json" \
  -H "x-admin-pass-sha256: d23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7" \
  -d '{"passwordHash":"d23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7"}'
```

## 🚀 Deploy no Render

### Passo a passo completo:

#### 1. Preparar o código
```bash
cd c:\Projetos\jogo-do-nunca
git add .
git commit -m "feat: configura API para Render"
git push origin main
```

#### 2. Criar Web Service no Render
1. Acesse https://render.com/
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `jogo-do-nunca-api` (ou qualquer nome)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Clique em "Create Web Service"

#### 3. Aguardar deploy
- O primeiro deploy leva ~2-3 minutos
- Acompanhe os logs no dashboard
- Quando aparecer "Live", copie a URL

#### 4. Configurar frontend
Edite `index.html` e cole sua URL do Render:
```javascript
window.API_BASE = 'https://jogo-do-nunca-api.onrender.com';
```

#### 5. Testar
1. Abra o jogo localmente
2. Jogue e veja se o score é salvo
3. Pressione F1 para ver visitas globais
4. Pressione Ctrl+F1 com senha `JpGv1209` para resetar

## 🚨 SOLUÇÃO DE PROBLEMAS - 404 no Render

Se você está recebendo erro 404 ao acessar o Render, siga estes passos:

### 1. Verifique se o deploy foi feito
```bash
# Acesse o dashboard do Render
https://dashboard.render.com/
```

- Veja se seu serviço aparece na lista
- Status deve estar "Live" (verde)
- Se aparecer "Build Failed" (vermelho), veja os logs

### 2. Verifique a URL correta
No dashboard do Render, a URL será algo como:
```
https://jogo-do-nunca-XXXXX.onrender.com
```
(Note o sufixo `-XXXXX` que o Render adiciona automaticamente)

### 3. Teste a API com curl
```bash
# Windows PowerShell
Invoke-WebRequest https://SUA-URL.onrender.com/health

# Ou use o arquivo de teste
node test-api.js https://SUA-URL.onrender.com
```

### 4. Atualizar index.html com URL correta
```javascript
window.API_BASE = 'https://SUA-URL-CORRETA.onrender.com';
```

## 🎯 Deploy Passo a Passo Completo

### Passo 1: Preparar repositório
```bash
cd c:\Projetos\jogo-do-nunca
git add .
git commit -m "feat: prepara deploy"
git push origin main
```

### Passo 2: Criar Web Service no Render
1. Acesse https://render.com/ e faça login
2. Clique em "New +" → "Web Service"
3. Escolha "Connect a repository"
4. Autorize o Render no GitHub
5. Selecione o repositório `jogo-do-nunca`
6. Configure:
   - **Name**: `jogo-do-nunca`
   - **Region**: `Oregon (US West)` ou mais próximo
   - **Branch**: `main`
   - **Root Directory**: (deixe vazio)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
7. Clique em "Create Web Service"

### Passo 3: Aguardar deploy
- Primeira vez leva ~2-3 minutos
- Acompanhe os logs em tempo real
- Quando aparecer "Live", está pronto!

### Passo 4: Copiar URL e testar
```bash
# Copie a URL (ex: https://jogo-do-nunca-abc123.onrender.com)
# Teste no navegador ou PowerShell:

Invoke-WebRequest https://SUA-URL.onrender.com/health | Select-Object -Expand Content
```

### Passo 5: Atualizar frontend
Edite `index.html`:
```javascript
window.API_BASE = 'https://jogo-do-nunca-abc123.onrender.com';
```

Faça commit e push:
```bash
git add index.html
git commit -m "fix: atualiza URL da API para Render"
git push origin main
```

## 🧪 Testar localmente ANTES do deploy

```bash
# Terminal 1: Iniciar servidor local
npm install
npm start

# Terminal 2: Testar endpoints
node test-api.js http://localhost:10000

# Ou manual com curl:
curl http://localhost:10000/health
curl -X POST http://localhost:10000/visit
curl http://localhost:10000/stats
```

## 📋 Checklist de Deploy

- [ ] Código commitado no GitHub
- [ ] Web Service criado no Render
- [ ] Build concluído com sucesso (sem erros)
- [ ] Status "Live" no dashboard
- [ ] Endpoint `/health` responde 200 OK
- [ ] URL atualizada no `index.html`
- [ ] Frontend commitado e publicado

## 🐛 Erros Comuns

### 404 Not Found
**Causa**: URL errada ou serviço não deployado
**Solução**: Verifique a URL no dashboard do Render

### 502 Bad Gateway
**Causa**: Servidor está "dormindo" (plano Free)
**Solução**: Aguarde 30s e tente novamente

### CORS Error
**Causa**: Servidor configurado incorretamente
**Solução**: Já está corrigido no `server.js`

### Build Failed
**Causa**: Erro no código ou `package.json`
**Solução**: Veja os logs no Render → "Logs" → últimas linhas

## 📞 Suporte

Se ainda tiver problemas:
1. Copie os logs do Render
2. Copie a mensagem de erro completa
3. Verifique se todos os arquivos foram commitados

## 🔗 Links Úteis

- Dashboard Render: https://dashboard.render.com/
- Docs Render Node: https://render.com/docs/deploy-node-express-app
- Status Render: https://status.render.com/
