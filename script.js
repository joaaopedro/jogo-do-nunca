const evasiveBtn = document.getElementById('evasiveBtn');
const fakeCursor = document.getElementById('fakeCursor');
const failCountDisplay = document.getElementById('failCount');
const trollMessage = document.getElementById('trollMessage');
const victoryModal = document.getElementById('victoryModal');
const victoryFailCount = document.getElementById('victoryFailCount');
const restartBtn = document.getElementById('restartBtn');

let realMouseX = 0;
let realMouseY = 0;
let failCount = 0;
let proximityCounter = 0;
let isInvertedX = true;
let isInvertedY = true;
let buttonSpeed = 1;
let gameActive = true;
let shiftPressed = false;
let ctrlPressed = false;

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
    'Tá bravinho? Respira, tenta outra vez, guerreiro.',
];

// GIFs na pasta imagens — atualizados para os nomes presentes no projeto
const gifFiles = [
    'imagens/risos1.gif',
    'imagens/risos2.gif',
    'imagens/triste1.gif',
    'imagens/triste2.gif'
];

/** Spawnar um GIF em um canto aleatório por um curto período */
function spawnCornerGif() {
    // escolher arquivo
    const file = gifFiles[Math.floor(Math.random() * gifFiles.length)];
    const img = document.createElement('img');
    img.src = file;
    img.className = 'corner-gif';

    // Cantos possíveis
    const corners = [
        { top: '12px', left: '12px' },
        { top: '12px', right: '12px' },
        { bottom: '12px', left: '12px' },
        { bottom: '12px', right: '12px' }
    ];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    Object.assign(img.style, corner);

    // Leve variação de escala/posição para evitar sobreposição exata
    const scale = 0.85 + Math.random() * 0.4; // 0.85 - 1.25
    img.style.transform = `scale(${scale})`;

    document.body.appendChild(img);

    // tempo aleatório de exibição (1.2s - 2.8s)
    const display = Math.random() * 1600 + 1200;
    setTimeout(() => {
        img.style.opacity = '0';
        img.style.transform = `scale(${scale * 0.95}) translateY(-6px)`;
        setTimeout(() => img.remove(), 300);
    }, display);
}

// Detectar SHIFT sendo pressionado
document.addEventListener('keydown', (e) => {
    if (e.shiftKey) {
        shiftPressed = true;
    }
    if (e.ctrlKey) {
        ctrlPressed = true;
    }
});

// Detectar SHIFT sendo solto
document.addEventListener('keyup', (e) => {
    if (!e.shiftKey) {
        shiftPressed = false;
    }
    if (!e.ctrlKey) {
        ctrlPressed = false;
    }
});

// Rastrear a posição real do mouse
document.addEventListener('mousemove', (e) => {
    if (!gameActive) return;

    realMouseX = e.clientX;
    realMouseY = e.clientY;

    // Inverter a posição do mouse (efeito trolleador)
    let invertedX = isInvertedX ? getWindowWidth() - realMouseX : realMouseX;
    let invertedY = isInvertedY ? getWindowHeight() - realMouseY : realMouseY;

    // Se SHIFT estiver pressionado, mostrar posição real
    if (shiftPressed) {
        invertedX = realMouseX;
        invertedY = realMouseY;
    }

    // Mostrar o "cursor falso" na posição invertida
    fakeCursor.style.left = (invertedX - 15) + 'px';
    fakeCursor.style.top = (invertedY - 15) + 'px';
    fakeCursor.style.display = 'block';

    // Mover o botão se o mouse estiver muito perto
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
});

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
function handlePointerDown(e) {
    if (!gameActive) return;

    // Se for um pointer event e não for do tipo 'mouse', ignorar (queremos apenas cliques de mouse)
    if (e.pointerType && e.pointerType !== 'mouse') return;

    // contar apenas cliques de mouse esquerdo (se informado)
    if (typeof e.button === 'number' && e.button !== 0) return;

    // coordenadas do clique (fallbacks seguros)
    const clickX = (typeof e.clientX === 'number') ? e.clientX : (e.pageX || 0);
    const clickY = (typeof e.clientY === 'number') ? e.clientY : (e.pageY || 0);

    // se clicou no próprio botão (verificação por bounding rect é mais confiável que target)
    const btnRectCheck = evasiveBtn.getBoundingClientRect();
    if (clickX >= btnRectCheck.left && clickX <= btnRectCheck.right && clickY >= btnRectCheck.top && clickY <= btnRectCheck.bottom) {
        return;
    }

    // ignorar cliques em UI/controle (modal, restart, mensagens)
    if (e.target && e.target.closest && (e.target.closest('.victory-content') || e.target.closest('#restartBtn'))) return;
    if (e.target && e.target.classList && (e.target.classList.contains('troll-message') || e.target.classList.contains('floating-text') || e.target.id === 'fakeCursor')) return;

    // é um clique falhado do mouse
    failCount++;
    failCountDisplay.textContent = failCount;

    // dar feedback sutil quando houver falha
    if (failCount % 2 === 0) {
        createFloatingText(floatingMessages[Math.floor(Math.random() * floatingMessages.length)]);
    }
    if (failCount % 5 === 0) {
        evasiveBtn.classList.add('glitch');
        setTimeout(() => evasiveBtn.classList.remove('glitch'), 500);
    }

    // spawn pequeno de GIFs em cantos quando houver falhas
    if (Math.random() < Math.min(0.12 + failCount * 0.01, 0.5)) {
        spawnCornerGif();
    }
}

// Anexar handler tanto para pointerdown (moderno) quanto para mousedown (fallback)
document.addEventListener('pointerdown', handlePointerDown, true);
document.addEventListener('mousedown', handlePointerDown, true);

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

    // Trolagem: Virar o botão
    if (Math.random() > 0.8) {
        evasiveBtn.style.transform = `rotate(${Math.random() * 360}deg)`;
    }

    // Trolagem: Mudar cor do botão aleatoricamente
    if (Math.random() > 0.7) {
        const colors = [
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        ];
        evasiveBtn.style.background = colors[Math.floor(Math.random() * colors.length)];
    }

    // Adicionar floating text baseado na proximidade
    if (proximityCounter % 2 === 0) {
        const floatMsg = floatingMessages[Math.floor(Math.random() * floatingMessages.length)];
        createFloatingText(floatMsg);
    }

    // Efeito glitch a cada 5 aproximações
    if (proximityCounter % 5 === 0) {
        evasiveBtn.classList.add('glitch');
        setTimeout(() => {
            evasiveBtn.classList.remove('glitch');
        }, 500);
    }

    // Aumentar size do botão após 10 aproximações (não confundir com cliques)
    if (proximityCounter > 10) {
        evasiveBtn.style.transform = `scale(${0.7 + proximityCounter * 0.02})`;
    }

    // Spawnar GIFs nos cantos com chance que aumenta com a proximidade acumulada
    if (Math.random() < Math.min(0.15 + proximityCounter * 0.01, 0.6)) {
        spawnCornerGif();
    }
}

function showTrollMessage(message) {
    trollMessage.textContent = message;
    trollMessage.classList.add('show');
    
    setTimeout(() => {
        trollMessage.classList.remove('show');
    }, 2000);
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
    floatingText.style.color = [
        '#ff6b6b',
        '#4ecdc4',
        '#ffe66d',
        '#ff6348',
        '#95e1d3',
        '#9b59b6',
    ][Math.floor(Math.random() * 6)];

    // tamanho aleatório menor e mais discreto entre ~0.9em e 1.2em
    const size = Math.random() * 0.3 + 0.9;
    floatingText.style.fontSize = size.toFixed(2) + 'em';
    floatingText.style.fontWeight = '600';

    // duração de animação mais curta para menos distração
    const duration = (Math.random() * 0.6) + 1.0; // 1.0s - 1.6s
    floatingText.style.animation = `floatUp ${duration}s ease-out forwards`;

    document.body.appendChild(floatingText);

    // remover quando a animação terminar (+ pequeno buffer)
    setTimeout(() => floatingText.remove(), Math.round(duration * 1000) + 200);
}

function celebrateClick() {
    gameActive = false;

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
    victoryFailCount.textContent = failCount;
    victoryModal.classList.add('show');
    
    // Mostrar o mouse ao aparecer o modal
    document.body.classList.add('show-victory');

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
