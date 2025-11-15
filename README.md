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

## 🚀 Deploy no Render

### 1. Criar conta no Render
- Acesse: https://render.com/
- Crie uma conta gratuita
- Conecte com GitHub

### 2. Fazer Deploy
1. Faça push do código para o GitHub:
```bash
git add .
git commit -m "feat: configura deploy no Render"
git push origin main
```

2. No Render Dashboard:
   - Clique em "New +"
   - Escolha "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name**: `jogo-do-nunca-api`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: `Free`

3. Clique em "Create Web Service"

4. Copie a URL gerada (ex: `https://jogo-do-nunca-api.onrender.com`)

### 3. Configurar Frontend
Edite `index.html` e altere:
```javascript
window.API_BASE = 'https://jogo-do-nunca-api.onrender.com';
```

### 4. Deploy do Frontend (GitHub Pages)
```bash
# Habilite GitHub Pages nas configurações do repositório
# Branch: main, Folder: / (root)
```

Pronto! Seu jogo estará online em:
- Frontend: `https://seu-usuario.github.io/jogo-do-nunca/`
- Backend: `https://jogo-do-nunca-api.onrender.com`

## 🎮 Como jogar localmente

### Frontend
1. Abra `index.html` no navegador
2. Ou use Python: `python -m http.server 8000`
3. Ou Live Server do VS Code

### Backend (opcional para desenvolvimento)
```bash
npm install
npm start
# Servidor em http://localhost:10000
```

## 🔑 Recursos

- ✅ Ranking local (funciona offline)
- ✅ Ranking global (Render + GitHub Pages)
- ✅ Contador de visitas global
- ✅ Reset de ranking com senha (Ctrl+F1)
- ✅ Suporte touch/mouse/caneta
- ✅ Cursor invertido e botão evasivo
- ✅ GIFs animados

## 🔐 Admin

- **Reset**: `Ctrl+F1` → senha: `JpGv1209`
- Reseta ranking local e global

## 📁 Estrutura

```
jogo-do-nunca/
├── index.html          # Frontend
├── style.css           # Estilos
├── script.js           # Lógica
├── imagens/            # GIFs
├── server.js           # Backend API
├── package.json        # Dependências
├── render.yaml         # Config Render
└── README.md           # Este arquivo
```

## 🌐 Endpoints da API

- `GET /` - Informações da API
- `GET /health` - Health check
- `POST /visit` - Registrar visita
- `POST /score` - Enviar score
  ```json
  { "name": "Jogador", "timeMs": 12345 }
  ```
- `GET /stats` - Estatísticas
- `POST /admin/reset` - Reset (requer senha SHA-256)

## 🐛 Troubleshooting

### Render dorme após 15min de inatividade
- Primeira requisição após sleep leva ~30s
- É normal no plano Free

### CORS Error
- Certifique-se que a URL da API está correta no `index.html`
- O Render deve estar online (verifique o dashboard)

### Dados perdidos no Render
- O plano Free não persiste dados entre deploys
- Para persistência permanente, use um banco de dados (ex: MongoDB Atlas)

## 📝 Licença

MIT
