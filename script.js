const evasiveBtn = document.getElementById('evasiveBtn');
const fakeCursor = document.getElementById('fakeCursor');
const trollMessage = document.getElementById('trollMessage');
const victoryModal = document.getElementById('victoryModal');
const restartBtn = document.getElementById('restartBtn');

// ===== ADMIN PASSWORD (SHA-256 hash) =====
// Hash SHA-256: d23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7
const ADMIN_PASSWORD_HASH = 'd23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7';

// ===== SISTEMA DE NAVEGAÇÃO DE PÁGINAS =====
const pages = {
    menu: document.getElementById('menuPage'),
    game: document.getElementById('gamePage'),
    ranking: document.getElementById('rankingPage'),
};

function showPage(pageKey) {
    // Ocultar todas as páginas
    Object.values(pages).forEach(page => page.classList.remove('show'));
    // Mostrar a página desejada
    if (pages[pageKey]) {
        pages[pageKey].classList.add('show');
    }
    
    // Atualizar classe do body para mostrar/ocultar cursor
    document.body.classList.remove('show-menu', 'show-game', 'show-ranking');
    document.body.classList.add(`show-${pageKey}`);
    // Ocultar cursor falso fora da página de jogo
    if (pageKey !== 'game' && fakeCursor) fakeCursor.style.display = 'none';
    // Remover dica "Pressione F1..." ao exibir o menu
    if (pageKey === 'menu') removeF1Tip();
}

// Botões de navegação
const playBtn = document.getElementById('playBtn');
const leaderboardMenuBtn = document.getElementById('leaderboardMenuBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

if (playBtn) playBtn.addEventListener('click', () => {
    // Não mudar de página ainda, apenas mostrar o modal
    const nameModal = document.getElementById('nameModal');
    if (nameModal) nameModal.classList.add('show');
    // Focar no input
    if (playerNameInput) playerNameInput.focus();
});

if (leaderboardMenuBtn) leaderboardMenuBtn.addEventListener('click', () => {
    showPage('ranking');
    loadAndDisplayRanking();
});

if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => {
    showPage('menu');
});

// ===== HANDLER PARA ESC =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const nameModal = document.getElementById('nameModal');
        if (nameModal && nameModal.classList.contains('show')) {
            // Fechar modal de nome
            nameModal.classList.remove('show');
            showPage('menu');
        }
    }
});

let realMouseX = 0;
let realMouseY = 0;
let proximityCounter = 0;
let isInvertedX = true;
let isInvertedY = true;
let buttonSpeed = 1;
let gameActive = false;
let shiftPressed = false;
let ctrlPressed = false;
// Controlar transform do botão sem sobrescrever (rotação + escala)
let btnRotDeg = 0;
let btnScale = 1;

// Debug flag ativada via hash '#debug'
const CLICK_DEBUG = (typeof window !== 'undefined' && window.location && window.location.hash && window.location.hash.indexOf('debug') !== -1);

// Ler dimensões dinamicamente (ajuda quando a janela é redimensionada)
function getWindowWidth() { return window.innerWidth; }
function getWindowHeight() { return window.innerHeight; }

const trollMessages = [
    '😈 Quase! Você estava tão pertinho que deu até dó — tenta de novo!',
    '🤔 Errou! Não desanima, é só mais uma tentativa (ou mil).',
    '⚡ Tá longe! Vai, acelera essa mão aí, campeão!',
    '💀 Boa tentativa — o botão tem vida própria hoje, sério.',
    '🎪 Escapa dele! Parece que o botão faz parkour nas horas vagas.',
    '🚀 Muito lento! O botão já tá na velocidade da luz pra te trollar.',
    '🌪️ Virou areia! Perdeu o botão no vórtice do universo, tenta de novo.',
    '🎯 Errou o alvo! Nem todo herói acerta na primeira vez (ou na 200ª).',
    '😂 Continua tentando — a persistência é a vingança do jogador.',
    '🔥 Tá pegando fogo! Quase lá, senti o calor da vitória.',
    '👻 Fantasminha esperto — o botão sumiu com estilo.',
    '🎭 Tá difícil né? Isso que é entretenimento hardcore de verdade!',
];

const floatingMessages = [
    'Kkk, tentou de novo e errou — clássico!',
    'Virou areia! O botão evaporou no ar... incrível.',
    'Escapou! O botão tá com sapatos novos.',
    'Ué? Cadê o botão? Nem eu sei.',
    'Nope! Hoje não é dia de click feliz.',
    'Errou! Mas a graça tá na tentativa, não no resultado.',
];

// ===== SHA-256 Hash Function =====
async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Elementos do novo fluxo/start
const playerNameInput = document.getElementById('playerNameInput');
const startGameBtn = document.getElementById('startGameBtn');
const victoryTimeDisplay = document.getElementById('victoryTimeDisplay');
const leaderboardEl = document.getElementById('leaderboard');
const bgCatcher = document.getElementById('bgCatcher');
const liveTimer = document.getElementById('liveTimer');
const nameModal = document.getElementById('nameModal');
const rankingList = document.getElementById('rankingList');
const registeredPlayersInfo = document.getElementById('registeredPlayersInfo');

// API base (defina window.API_BASE = 'https://seu-servidor' em index.html se quiser usar o servidor)
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : '';

function buildAuthHeaders() {
    const headers = {};
    if (typeof window !== 'undefined' && window.API_KEY) {
        headers['x-api-key'] = window.API_KEY;
        headers['Authorization'] = `Bearer ${window.API_KEY}`;
    }
    headers['Accept'] = 'application/json, text/plain, */*';
    return headers;
}

async function sendVisitToServer() {
    if (!API_BASE) return null;
    try {
        const res = await fetch(`${API_BASE}/visit`, { method: 'POST', headers: buildAuthHeaders() });
        if (!res.ok) return null;
        const data = await res.json();
        return data.visits;
    } catch (e) { return null; }
}

async function sendScoreToServer(name, timeMs) {
    if (!API_BASE) return null;
    try {
        const res = await fetch(`${API_BASE}/score`, {
            method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, buildAuthHeaders()),
            body: JSON.stringify({ name: name, timeMs: timeMs })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.leaderboard;
    } catch (e) { return null; }
}

async function fetchGlobalStats() {
    if (!API_BASE) return null;
    try {
        const res = await fetch(`${API_BASE}/stats`, { headers: buildAuthHeaders() });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

// Reset global do leaderboard no servidor (tenta vários endpoints, métodos e formatos)
async function resetGlobalLeaderboard(passwordHash) {
    if (!API_BASE) {
        console.log('[RESET] API_BASE não configurado, apenas reset local');
        return { ok: false, message: 'Servidor não configurado (apenas local)' };
    }

    const paths = [
        '/admin/reset-leaderboard',
        '/admin/reset',
        '/leaderboard/reset',
        '/scores/reset',
        '/score/reset',
        '/reset-leaderboard',
        '/reset'
    ];

    const makeBody = (extra = {}) => JSON.stringify(Object.assign({ 
        passwordHash, 
        password: passwordHash, 
        adminPassword: passwordHash, 
        action: 'reset' 
    }, extra));

    const attempts = [];
    for (const p of paths) {
        attempts.push({ method: 'POST', path: p, body: makeBody() });
        attempts.push({ method: 'DELETE', path: p, body: makeBody() });
    }

    const baseHeaders = Object.assign({ 
        'Content-Type': 'application/json', 
        'x-admin-pass-sha256': passwordHash,
        'x-admin-password': passwordHash 
    }, buildAuthHeaders());
    
    const errors = [];
    const isDebug = window.location && window.location.hash && window.location.hash.indexOf('debug') !== -1;
    let hasCorsError = false;

    for (const a of attempts) {
        try {
            if (isDebug) console.log('[RESET_TRY]', a.method, API_BASE + a.path);
            
            const res = await fetch(`${API_BASE}${a.path}`, {
                method: a.method,
                headers: baseHeaders,
                body: a.body,
                mode: 'cors',
                credentials: 'include'
            });
            
            if (isDebug) console.log('[RESET_RESPONSE]', a.method, a.path, 'status:', res.status);
            
            if (res.ok || res.status === 204) {
                if (isDebug) console.log('[RESET_SUCCESS]', a.method, a.path);
                return { ok: true };
            } else if (res.status === 404) {
                // 404 é esperado, continua tentando outros endpoints
                continue;
            } else {
                let detail = `HTTP ${res.status}`;
                try {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const j = await res.json();
                        if (j && (j.message || j.error)) detail += ` - ${j.message || j.error}`;
                    }
                } catch (_) {}
                errors.push(detail);
                if (isDebug) console.log('[RESET_ERROR]', detail);
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
                hasCorsError = true;
                if (isDebug) console.error('[RESET_CORS]', a.method, a.path, err.message);
            } else {
                if (isDebug) console.error('[RESET_EXCEPTION]', a.method, a.path, err);
            }
        }
    }

    let finalMsg;
    if (hasCorsError) {
        finalMsg = 'Servidor bloqueou a requisição (CORS). Configure o servidor para aceitar requisições do frontend.';
    } else if (errors.length > 0) {
        finalMsg = `Endpoint não encontrado ou erro: ${errors[0]}`;
    } else {
        finalMsg = 'Nenhum endpoint de reset disponível no servidor.';
    }
    
    return { ok: false, message: finalMsg };
}

// Timer / jogador
let playerName = '';
let startTime = null;
let elapsedMs = 0;

// Leaderboard key
const LB_KEY = 'jogoDoNunca_leaderboard_v1';

function formatTime(ms) {
    if (!ms && ms !== 0) return '--:--.---';
    const total = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const millis = total % 1000;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;
}

function loadLeaderboard() {
    try {
        const raw = localStorage.getItem(LB_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) { return []; }
}

function saveLeaderboard(entries) {
    try { localStorage.setItem(LB_KEY, JSON.stringify(entries)); } catch (e) { /* ignore */ }
}

function updateRegisteredPlayersInfo(count) {
    if (!registeredPlayersInfo) return;
    const safeCount = (typeof count === 'number' && isFinite(count) && count >= 0)
        ? Math.floor(count)
        : 0;
    registeredPlayersInfo.textContent = `Jogadores registrados: ${safeCount}`;
    // Estilo de alta legibilidade (texto escuro e sem sombra/baixa opacidade)
    Object.assign(registeredPlayersInfo.style, {
        color: '#1b1e23',
        fontWeight: '800',
        letterSpacing: '0.3px',
        textShadow: 'none',
        opacity: '1',
        mixBlendMode: 'normal' // evita clarear o texto em fundos claros
    });
}

function saveScore(name, ms) {
    const entries = loadLeaderboard();
    entries.push({ name: name || '-', timeMs: ms, at: new Date().toISOString() });
    entries.sort((a,b) => a.timeMs - b.timeMs);
    const top = entries.slice(0, 10);
    saveLeaderboard(top);
    updateRegisteredPlayersInfo(top.length);
    return top;
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

// Função ÚNICA para gerar HTML do ranking - usa estrutura .entry com spans
function renderRankingHtml(entries) {
    if (!entries || entries.length === 0) {
        return '<div class="empty-state">Nenhum resultado ainda — seja o primeiro!</div>';
    }
    const commonText = 'color:#1b1e23;text-shadow:0 1px 1px rgba(0,0,0,.15);';
    const timeText = commonText + 'font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;letter-spacing:.3px;';
    return entries.map((e, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
        const rankDisplay = medal || `#${i+1}`;
        return `<div class="entry">
            <span class="entry-rank" style="${commonText}font-weight:800;display:inline-flex;gap:6px;align-items:center;">${rankDisplay}</span>
            <span class="entry-name" style="${commonText}font-weight:700;">${escapeHtml(e.name)}</span>
            <span class="entry-time" style="${timeText}">${formatTime(e.timeMs)}</span>
        </div>`;
    }).join('');
}

// Leaderboard local
function renderLeaderboard() {
    const entries = loadLeaderboard();
    if (!leaderboardEl) return;
    leaderboardEl.innerHTML = renderRankingHtml(entries);
}

// View Leaderboard button handler (from game page - if needed)
const loadAndDisplayRanking = () => {
    const entries = loadLeaderboard();
    const totalEntries = entries ? entries.length : 0;
    updateRegisteredPlayersInfo(totalEntries);
    if (!rankingList) return;
    rankingList.innerHTML = renderRankingHtml(entries);
};

// Auto-focus input and prefill last name
window.addEventListener('load', () => {
    // Mostrar a página do menu inicialmente
    showPage('menu');
    // Garantir remoção da dica mesmo se renderizar depois
    removeF1Tip();
    setTimeout(removeF1Tip, 80);
    setTimeout(removeF1Tip, 300);
    try {
        const last = localStorage.getItem('jogoDoNunca_lastName');
        if (last && playerNameInput) playerNameInput.value = last;
    } catch (e) {}
    if (playerNameInput) playerNameInput.focus();
    // render leaderboard initially (shows previous results)
    renderLeaderboard();
    // Aplicar estilo e valor inicial ao contador (base local)
    try { updateRegisteredPlayersInfo(loadLeaderboard().length); } catch (_) {}
    // start the live timer loop
    requestAnimationFrame(tick);
    
    // tentar obter visitas globais do servidor
    (async () => {
        try {
            const stats = await fetchGlobalStats();
            if (stats && stats.visits != null) {
                // armazenar visitas globais para usar no F1
                window.globalVisits = stats.visits;
            }
            
            // se servidor disponível, também preencher leaderboard global
            if (stats && stats.leaderboard && Array.isArray(stats.leaderboard)) {
                // renderizar leaderboard global (substitui o local one)
                if (leaderboardEl) {
                    leaderboardEl.innerHTML = renderRankingHtml(stats.leaderboard);
                }
            }
        } catch (e) {}
    })();
    
    // Registrar visita no servidor (incrementa contador global)
    (async () => {
        try {
            const serverVisits = await sendVisitToServer();
            if (serverVisits != null) {
                window.globalVisits = serverVisits;
            }
        } catch (e) {}
    })();
    
    // F1: Falar apenas visitas GLOBAIS
    // Ctrl+F1: Pedir senha para resetar o Top 10
    window.addEventListener('keydown', async (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            e.stopPropagation();
            
            const isCtrlPressed = e.ctrlKey || e.metaKey;
            
            if (isCtrlPressed) {
                console.log('[DEBUG] Ctrl+F1 detectado');
                const senha = prompt('Digite a senha para resetar o Top 10:');
                
                if (senha !== null && senha !== '') {
                    try {
                        const senhaHash = await sha256(senha);
                        
                        if (senhaHash === ADMIN_PASSWORD_HASH) {
                            console.log('[DEBUG] Senha correta! Resetando...');
                            
                            // SEMPRE reseta local primeiro
                            try { 
                                localStorage.removeItem(LB_KEY);
                                console.log('[DEBUG] ✅ Ranking local resetado');
                            } catch (err) {
                                console.error('[DEBUG] ❌ Erro ao resetar local:', err);
                            }
                            
                            // Tenta resetar no servidor (mas não falha se não conseguir)
                            let serverMsg = '';
                            let serverOk = false;
                            if (API_BASE) {
                                console.log('[DEBUG] Tentando resetar servidor...');
                                const res = await resetGlobalLeaderboard(senhaHash);
                                serverOk = !!res.ok;
                                serverMsg = res.message || '';
                                console.log('[DEBUG] Servidor:', serverOk ? '✅ sucesso' : '⚠️ ' + serverMsg);
                            }
                            
                            // Mensagem de sucesso sempre menciona o reset local
                            if (serverOk) {
                                alert('✅ Top 10 resetado com sucesso!\n\n• Local: resetado\n• Servidor: resetado');
                            } else if (API_BASE) {
                                alert(`✅ Top 10 LOCAL resetado com sucesso!\n\n⚠️ Servidor: ${serverMsg}\n\n(O ranking local foi limpo. Configure o servidor se precisar de reset global.)`);
                            } else {
                                alert('✅ Top 10 local resetado com sucesso!\n\n(Servidor não configurado - apenas reset local)');
                            }
                            
                            setTimeout(() => location.reload(), 700);
                        } else {
                            alert('❌ Senha incorreta!');
                        }
                    } catch (err) {
                        console.error('[DEBUG] Erro:', err);
                        alert('❌ Erro: ' + err.message);
                    }
                }
                return;
            }
            
            // F1 normal: Falar visitas globais
            console.log('[DEBUG] F1 detectado (sem Ctrl)');
            try {
                const visitas = window.globalVisits || 'desconhecido';
                const msg = `Visitas globais: ${visitas}.`;
                if (window.speechSynthesis) {
                    const u = new SpeechSynthesisUtterance(msg);
                    u.lang = 'pt-BR';
                    speechSynthesis.cancel();
                    speechSynthesis.speak(u);
                } else {
                    alert(msg);
                }
            } catch (err) {
                console.error('[DEBUG] Erro ao falar visitas:', err);
                alert('Não foi possível recuperar o contador de visitas globais.');
            }
        }
    }, false);
});

// atualiza o timer em tempo real quando o jogo está ativo
function tick() {
    try {
        if (liveTimer) {
            if (gameActive && startTime) {
                const now = Date.now();
                const ms = now - startTime;
                liveTimer.textContent = `Tempo: ${formatTime(ms)}`;
            } else if (!gameActive && elapsedMs) {
                liveTimer.textContent = `Tempo: ${formatTime(elapsedMs)}`;
            } else {
                liveTimer.textContent = 'Tempo: --:--.---';
            }
        }
    } catch (e) {}
    requestAnimationFrame(tick);
}

// Lista de GIFs disponíveis (pasta imagens/)
const gifFiles = [
    'imagens/risos1.gif',
    'imagens/risos2.gif',
    'imagens/triste1.gif',
    'imagens/triste2.gif'
];

// controlar quantos GIFs estão ativos por canto para evitar sobreposição
const cornerCounts = { tl: 0, tr: 0, bl: 0, br: 0 };
const MAX_PER_CORNER = 1; // máximo 1 GIF por canto por vez
let gifQueue = []; // fila de GIFs pendentes

// Função que spawn um GIF no canto, evitando sobreposição
function spawnCornerGif() {
    try {
        // Se já existe um GIF ativo, adicionar à fila em vez de spawnar imediatamente
        const totalActive = Object.values(cornerCounts).reduce((a, b) => a + b, 0);
        if (totalActive >= 1) {
            // Adicionar à fila se houver espaço (máximo 3 na fila)
            if (gifQueue.length < 3) {
                gifQueue.push(true);
            }
            return;
        }

        const file = gifFiles[Math.floor(Math.random() * gifFiles.length)];
        const img = document.createElement('img');
        img.src = file;
        img.className = 'corner-gif';

        // Cantos possíveis com chaves e estilos base
        const CORNER_DEFS = [
            { key: 'tl', style: { top: '12px', left: '12px' }, dirX: 1, dirY: 1 },
            { key: 'tr', style: { top: '12px', right: '12px' }, dirX: -1, dirY: 1 },
            { key: 'bl', style: { bottom: '12px', left: '12px' }, dirX: 1, dirY: -1 },
            { key: 'br', style: { bottom: '12px', right: '12px' }, dirX: -1, dirY: -1 }
        ];

        // Escolher canto aleatório (preferencialmente vazio)
        let availableCorners = CORNER_DEFS.filter(c => cornerCounts[c.key] === 0);
        if (availableCorners.length === 0) {
            availableCorners = CORNER_DEFS; // fallback para qualquer canto
        }
        const cornerDef = availableCorners[Math.floor(Math.random() * availableCorners.length)];

        // registrar
        cornerCounts[cornerDef.key] = 1;
        img.dataset.corner = cornerDef.key;

        // aplicar estilo base
        Object.assign(img.style, cornerDef.style);

        const scale = 0.85 + Math.random() * 0.4;
        img.style.transform = `scale(${scale})`;

        document.body.appendChild(img);

        // Duração mais controlada: 1.5s a 2.5s
        const display = 1500 + Math.random() * 1000;
        setTimeout(() => {
            img.style.opacity = '0';
            img.style.transform = `scale(${scale * 0.95})`;
            setTimeout(() => {
                try {
                    const k = img.dataset.corner;
                    if (k && cornerCounts[k]) cornerCounts[k] = 0;
                    
                    // Processar fila: se houver GIFs pendentes, spawnar o próximo
                    if (gifQueue.length > 0) {
                        gifQueue.shift();
                        // pequeno delay antes de spawnar o próximo para evitar picos
                        setTimeout(() => {
                            spawnCornerGif();
                        }, 100);
                    }
                } catch (err) {}
                img.remove();
            }, 300);
        }, display);
    } catch (err) {
        // se algo falhar, não quebrar a execução
        console.warn('spawnCornerGif error', err);
    }
}

// Detectar SHIFT/Ctrl/Cmd sendo pressionado
document.addEventListener('keydown', (e) => {
    if (e.shiftKey) {
        shiftPressed = true;
    }
    if (e.ctrlKey || e.metaKey) {
        ctrlPressed = true;
    }
});
// Detectar SHIFT/Ctrl/Cmd sendo solto
document.addEventListener('keyup', (e) => {
    if (!e.shiftKey) {
        shiftPressed = false;
    }
    if (!e.ctrlKey && !e.metaKey) {
        ctrlPressed = false;
    }
});

// Rastrear a posição real do mouse / ponteiro (suporta mouse, touch e caneta)
window.addEventListener('pointermove', (e) => {
    if (!gameActive) return;

    realMouseX = e.clientX;
    realMouseY = e.clientY;

    // Inverter a posição do ponteiro (efeito trolleador)
    let invertedX = isInvertedX ? getWindowWidth() - realMouseX : realMouseX;
    let invertedY = isInvertedY ? getWindowHeight() - realMouseY : realMouseY;

    // Se SHIFT estiver pressionado, mostrar posição real
    if (shiftPressed) {
        invertedX = realMouseX;
        invertedY = realMouseY;
    }

    // Mostrar "cursor falso" apenas para mouse; esconder para touch/caneta
    if (e.pointerType === 'mouse') {
        fakeCursor.style.left = (invertedX - 15) + 'px';
        fakeCursor.style.top = (invertedY - 15) + 'px';
        fakeCursor.style.display = 'block';
    } else {
        if (fakeCursor) fakeCursor.style.display = 'none';
    }

    // Mover o botão se o ponteiro estiver muito perto
    const btnRect = evasiveBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const distX = invertedX - btnCenterX;
    const distY = invertedY - btnCenterY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Se o cursor estiver a menos de 150px do botão, ele escapa
    if (distance < 150 && !ctrlPressed) {
        moveButtonAway();
    }
}, false);

// Ocultar o cursor falso quando a janela perde foco/visibilidade ou ponteiro sai da janela
window.addEventListener('blur', () => { if (fakeCursor) fakeCursor.style.display = 'none'; }, false);
window.addEventListener('pointerleave', () => { if (fakeCursor) fakeCursor.style.display = 'none'; }, false);
document.addEventListener('visibilitychange', () => {
    if (document.hidden && fakeCursor) fakeCursor.style.display = 'none';
}, false);

// Ao passar o mouse sobre o botão com a posição invertida, ele também escapa
evasiveBtn.addEventListener('mouseenter', () => {
    if (gameActive && !ctrlPressed) moveButtonAway();
});

// Se conseguir clicar (por algum milagre!)
evasiveBtn.addEventListener('click', (e) => {
    if (gameActive) {
        e.preventDefault();
        e.stopPropagation();
        celebrateClick();
    }
});

// Contar apenas cliques falhados do mouse (quando o usuário clica em outro lugar que não seja o botão)
// Normalizamos pointerdown/mousedown para ter suporte consistente a mouse/pointers
// pequeno dedupe para evitar contagens duplicadas quando ambos pointerdown e mousedown
let __lastPointerDown = { time: 0, x: 0, y: 0, button: null };
function isDuplicatePointerEvent(e) {
    const now = Date.now();
    const x = (typeof e.clientX === 'number') ? e.clientX : (e.pageX || 0);
    const y = (typeof e.clientY === 'number') ? e.clientY : (e.pageY || 0);
    const btn = (typeof e.button === 'number') ? e.button : null;
    if (now - __lastPointerDown.time < 60 && Math.abs(x - __lastPointerDown.x) < 6 && Math.abs(y - __lastPointerDown.y) < 6 && btn === __lastPointerDown.button) {
        return true;
    }
    __lastPointerDown.time = now;
    __lastPointerDown.x = x;
    __lastPointerDown.y = y;
    __lastPointerDown.button = btn;
    return false;
}

function handlePointerDown(e) {
    if (!gameActive) return;

    // evitar duplicados muito próximos (pointerdown + mousedown)
    if (isDuplicatePointerEvent(e)) return;

    // Só exigir botão esquerdo para mouse. Touch/pen seguem sem este filtro.
    const isMouse = e.pointerType === 'mouse';
    if (isMouse) {
        if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return;
        if (typeof e.button === 'number' && e.button !== 0) return;
    }

    // coordenadas do clique (fallbacks seguros)
    const clickX = (typeof e.clientX === 'number') ? e.clientX : (e.pageX || 0);
    const clickY = (typeof e.clientY === 'number') ? e.clientY : (e.pageY || 0);

    // Debug: registrar eventos estranhos quando ativado
    // habilita debug quando a URL contém '#debug' (ex: http://localhost:8000/#debug)
    const CLICK_DEBUG = (typeof window !== 'undefined' && window.location && window.location.hash && window.location.hash.indexOf('debug') !== -1);
    if (CLICK_DEBUG) {
        console.debug('[CLICK_DEBUG] event:', { type: e.type, isTrusted: e.isTrusted, pointerType: e.pointerType, button: e.button, clientX: clickX, clientY: clickY, target: e.target && (e.target.id || e.target.className || e.target.tagName) });
    }

    // Garantir que seja um evento legítimo de clique do usuário
    if (typeof e.isTrusted !== 'undefined' && !e.isTrusted) return;

    // se clicou no próprio botão (verificação por bounding rect é mais confiável que target)
    const btnRectCheck = evasiveBtn.getBoundingClientRect();
    const downOutsideButton = !(clickX >= btnRectCheck.left && clickX <= btnRectCheck.right && clickY >= btnRectCheck.top && clickY <= btnRectCheck.bottom);

    // ignorar cliques em UI/controle (modal, restart, mensagens)
    if (e.target && e.target.closest && (e.target.closest('.victory-content') || e.target.closest('#restartBtn'))) return;
    if (e.target && e.target.classList && (e.target.classList.contains('troll-message') || e.target.classList.contains('floating-text') || e.target.id === 'fakeCursor')) return;

    // Em vez de contar imediatamente no mousedown, registramos o evento e contamos apenas
    // se o mouseup corresponder (mousedown+mouseup fora do botão). Isso previne false-positives.
    if (!downOutsideButton) {
        // se o mousedown foi dentro do botão, ignorar (possível tentativa de clique no botão)
        return;
    }

    // registrar pending mousedown para processar no mouseup
    pendingMouseDown = {
        x: clickX,
        y: clickY,
        time: Date.now(),
        button: (typeof e.button === 'number') ? e.button : null
    };
    if (CLICK_DEBUG) console.debug('[CLICK_DEBUG] pendingMouseDown set', pendingMouseDown);
    // limpar pending se não houver mouseup em 1.2s
    if (pendingMouseDownTimeout) clearTimeout(pendingMouseDownTimeout);
    pendingMouseDownTimeout = setTimeout(() => {
        if (CLICK_DEBUG) console.debug('[CLICK_DEBUG] pendingMouseDown timed out -> clearing', pendingMouseDown);
        pendingMouseDown = null; pendingMouseDownTimeout = null; }, 1200);
}

// estado de mousedown pendente para validar no mouseup
let pendingMouseDown = null;
let pendingMouseDownTimeout = null;

function handleMouseUp(e) {
    if (!gameActive) return;
    // Só exigir botão esquerdo para mouse. Touch/pen (button costuma ser -1) não retornam.
    const isMouse = e.pointerType === 'mouse';
    if (isMouse && typeof e.button === 'number' && e.button !== 0) return;
    if (!pendingMouseDown) return;

    // coordenadas do mouseup
    const upX = (typeof e.clientX === 'number') ? e.clientX : (e.pageX || 0);
    const upY = (typeof e.clientY === 'number') ? e.clientY : (e.pageY || 0);

    // se o mouseup ocorreu muito tarde, ignorar
    if (Date.now() - pendingMouseDown.time > 1200) {
        pendingMouseDown = null;
        if (pendingMouseDownTimeout) { clearTimeout(pendingMouseDownTimeout); pendingMouseDownTimeout = null; }
        return;
    }

    // checar se tanto down quanto up foram fora do botão
    const btnRect = evasiveBtn.getBoundingClientRect();
    const downOutside = (pendingMouseDown.x < btnRect.left || pendingMouseDown.x > btnRect.right || pendingMouseDown.y < btnRect.top || pendingMouseDown.y > btnRect.bottom);
    const upOutside = (upX < btnRect.left || upX > btnRect.right || upY < btnRect.top || upY > btnRect.bottom);

    // ignorar se mouseup ocorreu em UI ou em elementos proibidos
    if (e.target && e.target.closest && (e.target.closest('.victory-content') || e.target.closest('#restartBtn'))) {
        pendingMouseDown = null;
        if (pendingMouseDownTimeout) { clearTimeout(pendingMouseDownTimeout); pendingMouseDownTimeout = null; }
        return;
    }

    if (downOutside && upOutside) {
        // é um clique falhado do mouse — incrementar contador de proximidade/erros internos (não mostrado)
        if (CLICK_DEBUG) console.debug('[CLICK_DEBUG] counting failed click (hidden), pending:', pendingMouseDown, 'up:', {x: upX, y: upY, button: e.button, isTrusted: e.isTrusted});
        proximityCounter++;

        // dar feedback sutil quando houver falha (usar proximityCounter como gatilho)
        if (proximityCounter % 2 === 0) {
            createFloatingText(floatingMessages[Math.floor(Math.random() * floatingMessages.length)]);
        }
        if (proximityCounter % 5 === 0) {
            evasiveBtn.classList.add('glitch');
            setTimeout(() => evasiveBtn.classList.remove('glitch'), 500);
        }

        // spawn pequeno de GIFs em cantos quando houver falhas
        if (Math.random() < Math.min(0.06 + proximityCounter * 0.005, 0.25)) {
            spawnCornerGif();
        }
    }

    // limpar pending
    pendingMouseDown = null;
    if (pendingMouseDownTimeout) { clearTimeout(pendingMouseDownTimeout); pendingMouseDownTimeout = null; }
}

// Anexar handler no fundo usando pointerdown (suporta mouse/touch/pen)
if (bgCatcher) {
    bgCatcher.addEventListener('pointerdown', function (e) {
        // Evitar scroll/seleção/navegação acidental no fundo
        e.preventDefault();
        e.stopPropagation();
        handlePointerDown(e);
    }, false);
}

// Ouvir pointerup/pointercancel globalmente para validar/limpar o pendingMouseDown
window.addEventListener('pointerup', handleMouseUp, false);
window.addEventListener('pointercancel', () => {
    pendingMouseDown = null;
    if (pendingMouseDownTimeout) { clearTimeout(pendingMouseDownTimeout); pendingMouseDownTimeout = null; }
}, false);

// Trolagem: Inverter controles aleatoricamente
setInterval(() => {
    if (!gameActive) return;
    if (Math.random() < 0.05) { // 5% de chance a cada segundo
        const shouldInvertX = Math.random() > 0.5;
        if (shouldInvertX) {
            isInvertedX = !isInvertedX;
            showTrollMessage('🔄 Inversão X ativada!');
        } else {
            isInvertedY = !isInvertedY;
            showTrollMessage('🔄 Inversão Y ativada!');
        }
    }
}, 1000);

// Trolagem: Aumentar velocidade de escape do botão com o tempo
setInterval(() => {
    if (!gameActive) return;
    buttonSpeed = Math.min(buttonSpeed + 0.1, 3);
}, 3000);

// Botão de recomeçar
restartBtn.addEventListener('click', () => {
    location.reload();
});

function moveButtonAway() {
    if (!gameActive) return;

    // proximity-based escapes (do NOT count as failed clicks)
    proximityCounter++;

    // Mostrar mensagem troll aleatória baseada em aproximações
    if (proximityCounter % 3 === 0) {
        showTrollMessage(trollMessages[Math.floor(Math.random() * trollMessages.length)]);
    }

    // Fazer o botão tremendo aleatoricamente
    if (Math.random() > 0.7) {
        evasiveBtn.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => {
            evasiveBtn.style.animation = '';
        }, 300);
    }

    // Gerar posição aleatória dentro da viewport, evitando a borda
    const maxX = getWindowWidth() - 200;
    const maxY = getWindowHeight() - 100;
    const minX = 100;
    const minY = 100;

    // Aumentar velocidade de movimento
    const randomX = Math.random() * (maxX - minX) + minX;
    const randomY = Math.random() * (maxY - minY) + minY;

    evasiveBtn.style.position = 'fixed';
    evasiveBtn.style.transition = `all ${0.3 / buttonSpeed}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
    evasiveBtn.style.left = randomX + 'px';
    evasiveBtn.style.top = randomY + 'px';

    // Trolagem: Virar o botão (atualiza rotação sem sobrescrever a escala)
    if (Math.random() > 0.8) {
        btnRotDeg = Math.random() * 360;
    }

    // Trolagem: Mudar cor do botão aleatoriamente
    if (Math.random() > 0.7) {
        const colors = [
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        ];
        evasiveBtn.style.background = colors[Math.floor(Math.random() * colors.length)];
    }

    // Efeito glitch a cada 5 aproximações
    if (proximityCounter % 5 === 0) {
        evasiveBtn.classList.add('glitch');
        setTimeout(() => {
            evasiveBtn.classList.remove('glitch');
        }, 500);
    }

    // Aumentar size do botão após 10 aproximações (compõe com rotação)
    if (proximityCounter > 10) {
        btnScale = Math.min(0.7 + proximityCounter * 0.02, 2.2); // clamp para não ficar exagerado
    }

    // Aplicar transform composto (rotação + escala) uma única vez
    evasiveBtn.style.transform = `rotate(${btnRotDeg.toFixed(2)}deg) scale(${btnScale.toFixed(2)})`;

    // Spawnar GIFs nos cantos com chance reduzida que aumenta com a proximidade acumulada
    if (Math.random() < Math.min(0.08 + proximityCounter * 0.01, 0.4)) {
        spawnCornerGif();
    }
}

function showTrollMessage(message) {
    trollMessage.textContent = message;
    // Aumenta contraste para melhor leitura
    Object.assign(trollMessage.style, {
        background: 'rgba(0,0,0,0.65)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '12px',
        textShadow: '0 1px 2px rgba(0,0,0,.4)',
        backdropFilter: 'blur(2px)'
    });
    trollMessage.classList.add('show');
    setTimeout(() => { trollMessage.classList.remove('show'); }, 2000);
}

function createFloatingText(text) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    // posição aleatória
    const randomX = Math.random() * (getWindowWidth() - 120) + 40;
    const randomY = Math.random() * (getWindowHeight() - 160) + 60;
    floatingText.style.left = randomX + 'px';
    floatingText.style.top = randomY + 'px';

    // cor aleatória e tamanho maior
    floatingText.style.color = '#fff';
    floatingText.style.background = 'rgba(0,0,0,0.45)';
    floatingText.style.padding = '6px 10px';
    floatingText.style.borderRadius = '10px';
    floatingText.style.textShadow = '0 1px 2px rgba(0,0,0,.4), 0 0 1px rgba(0,0,0,.25)';

    // duração de animação mais curta para menos distração
    const duration = (Math.random() * 0.6) + 1.0; // 1.0s - 1.6s
    floatingText.style.animation = `floatUp ${duration}s ease-out forwards`;

    document.body.appendChild(floatingText);

    // remover quando a animação terminar (+ pequeno buffer)
    setTimeout(() => floatingText.remove(), Math.round(duration * 1000) + 200);
}

function celebrateClick() {
    gameActive = false;

    // parar timer e registrar tempo
    if (startTime) {
        elapsedMs = Date.now() - startTime;
    }

    // salvar no leaderboard e renderizar
    try {
        saveScore(playerName || 'Jogador', elapsedMs);
        renderLeaderboard();
        (async () => {
            const remote = await sendScoreToServer(playerName || 'Jogador', elapsedMs);
            if (remote && leaderboardEl) {
                leaderboardEl.innerHTML = renderRankingHtml(remote);
            }
        })();
    } catch (e) {}
    // Mostrar tempo no modal
    if (victoryTimeDisplay) {
        victoryTimeDisplay.textContent = `Tempo: ${formatTime(elapsedMs)}`;
    }

    // Criar explosão de emojis
    const emojis = ['🎉', '🎊', '✨', '🎈', '🎁', '🏆', '👏', '🌟', '💥', '⚡'];
    
    for (let i = 0; i < 30; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'celebration';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.left = (Math.random() * 100) + '%';
        emoji.style.top = (Math.random() * 100) + '%';
        document.body.appendChild(emoji);

        setTimeout(() => emoji.remove(), 1500);
    }

    // Mostrar modal de vitória
    victoryModal.classList.add('show');
    // Mostrar o mouse ao aparecer o modal
    document.body.classList.add('show-victory');
    // Esconder cursor falso na vitória
    if (fakeCursor) fakeCursor.style.display = 'none';

    // Som de vitória (usando Web Audio)
    playVictorySound();
}

function playVictorySound() {
    // Criar som de vitória simples com Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99]; // Do, Mi, Sol
        
        notes.forEach((freq, idx) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime + idx * 0.1);
            oscillator.stop(audioContext.currentTime + idx * 0.1 + 0.2);
        });
    } catch (e) {
        // Ignorar erro se Web Audio não estiver disponível
    }
}

// Utilitário para remover a dica "Pressione F1 para ouvir visitantes globais"
function removeF1Tip() {
    try {
        const root = document.getElementById('menuPage') || document.body;
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const toRemove = new Set();
        while (walker.nextNode()) {
            const t = (walker.currentNode.nodeValue || '').trim();
            if (t && /Pressione\s*F1/i.test(t)) {
                const el = walker.currentNode.parentElement;
                // remove o container mais próximo que faça sentido
                toRemove.add(el.closest('.tip, .info, p, div') || el);
            }
        }
        toRemove.forEach(el => el && el.remove());
    } catch (_) {}
}

// Start button handler
if (startGameBtn) startGameBtn.addEventListener('click', () => {
    const val = (playerNameInput && playerNameInput.value) ? playerNameInput.value.trim() : '';
    playerName = val || 'Jogador';
    try { localStorage.setItem('jogoDoNunca_lastName', playerName); } catch (e) {}
    // Fechar modal e iniciar jogo
    if (nameModal) nameModal.classList.remove('show');
    showPage('game');
    startTime = Date.now();
    elapsedMs = 0;
    proximityCounter = 0;
    buttonSpeed = 1;
    gameActive = true;
    // Resetar posição/escala/rotação do botão
    btnRotDeg = 0;
    btnScale = 1;
    evasiveBtn.style.transform = 'rotate(0deg) scale(1)';
    evasiveBtn.style.left = '50%';
    evasiveBtn.style.top = '50%';
    evasiveBtn.style.transition = '';
});
