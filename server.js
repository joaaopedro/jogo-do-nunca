require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Em produção (Render), usar /tmp para arquivos temporários
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DATA_DIR = IS_PRODUCTION ? '/tmp/data' : path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');

// Hash SHA-256 da senha de admin
const ADMIN_PASSWORD_HASH = 'd23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7';

// Configurar CORS - permitir qualquer origem em produção
const corsOptions = {
    origin: true, // Permite qualquer origem
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-pass-sha256', 'x-admin-password', 'Accept'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Confiar no proxy do Render e responder preflight CORS
app.set('trust proxy', 1);
app.options('*', cors(corsOptions));
// Preflight específico para rotas usadas pelo frontend
app.options(['/visit', '/visit/', '/score', '/score/', '/admin/reset', '/admin/reset/'], (req, res) => res.sendStatus(204));

// Middleware para logs detalhados
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('  Body:', JSON.stringify(req.body).slice(0, 200));
    }
    next();
});

// Inicializar arquivos de dados
async function initDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`✅ Diretório criado: ${DATA_DIR}`);
        
        try {
            await fs.access(LEADERBOARD_FILE);
            console.log(`✅ Leaderboard encontrado: ${LEADERBOARD_FILE}`);
        } catch {
            await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]));
            console.log(`✅ Leaderboard criado: ${LEADERBOARD_FILE}`);
        }
        
        try {
            await fs.access(VISITS_FILE);
            console.log(`✅ Visits encontrado: ${VISITS_FILE}`);
        } catch {
            await fs.writeFile(VISITS_FILE, JSON.stringify({ count: 0 }));
            console.log(`✅ Visits criado: ${VISITS_FILE}`);
        }
        
        console.log('✅ Todos os arquivos de dados inicializados');
    } catch (err) {
        console.error('❌ Erro ao inicializar arquivos:', err);
        throw err;
    }
}

// Carregar leaderboard
async function loadLeaderboard() {
    try {
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`📊 Leaderboard carregado: ${parsed.length} entradas`);
        return parsed;
    } catch (err) {
        console.warn('⚠️ Erro ao carregar leaderboard, retornando array vazio:', err.message);
        return [];
    }
}

// Salvar leaderboard
async function saveLeaderboard(entries) {
    try {
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(entries, null, 2));
        console.log(`💾 Leaderboard salvo: ${entries.length} entradas`);
    } catch (err) {
        console.error('❌ Erro ao salvar leaderboard:', err);
        throw err;
    }
}

// Carregar visitas
async function loadVisits() {
    try {
        const data = await fs.readFile(VISITS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { count: 0 };
    }
}

// Salvar visitas
async function saveVisits(visits) {
    await fs.writeFile(VISITS_FILE, JSON.stringify(visits, null, 2));
}

// ===== ENDPOINTS =====

// GET / - Página inicial do servidor
app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        message: '🎮 API do Jogo do Nunca',
        version: '1.0.0',
        environment: IS_PRODUCTION ? 'production' : 'development',
        endpoints: {
            'GET /': 'Informações da API',
            'GET /health': 'Health check',
            'POST /visit': 'Registrar visita',
            'POST /score': 'Enviar score (body: {name, timeMs})',
            'GET /stats': 'Obter estatísticas globais',
            'POST /admin/reset': 'Resetar leaderboard (requer passwordHash)'
        },
        docs: 'https://github.com/seu-usuario/jogo-do-nunca'
    });
});

// Health handler reutilizável
async function healthHandler(req, res) {
    try {
        const leaderboard = await loadLeaderboard();
        const visits = await loadVisits();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            data: {
                leaderboardEntries: leaderboard.length,
                totalVisits: visits.count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}

// GET /health - Health check (+ aliases e HEAD)
app.get(['/health', '/health/', '/healthz', '/healthcheck'], healthHandler);
app.head('/health', (_req, res) => res.sendStatus(200));

// POST /visit - Registrar visita
app.post(['/visit', '/visit/'], async (req, res) => {
    try {
        const visits = await loadVisits();
        visits.count++;
        await saveVisits(visits);
        console.log(`👋 Nova visita registrada! Total: ${visits.count}`);
        res.json({ 
            success: true,
            visits: visits.count 
        });
    } catch (err) {
        console.error('❌ Erro ao registrar visita:', err);
        res.status(500).json({ 
            error: 'Erro ao registrar visita',
            message: err.message 
        });
    }
});

// GET /visit - Consultar visitas (sem incrementar)
app.get(['/visit', '/visit/'], async (req, res) => {
    try {
        const visits = await loadVisits();
        res.json({ success: true, visits: visits.count });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar visitas', message: err.message });
    }
});

// POST /score - Enviar score
app.post(['/score', '/score/'], async (req, res) => {
    try {
        const { name, timeMs } = req.body;
        
        console.log(`🎯 Novo score recebido: ${name} - ${timeMs}ms`);
        
        if (!name || typeof timeMs !== 'number') {
            console.log('❌ Dados inválidos:', { name, timeMs });
            return res.status(400).json({ 
                error: 'Dados inválidos',
                message: 'Nome (string) e timeMs (number) são obrigatórios' 
            });
        }
        
        const entries = await loadLeaderboard();
        entries.push({ 
            name: String(name).slice(0, 50), // Limitar tamanho
            timeMs: Number(timeMs), 
            at: new Date().toISOString() 
        });
        
        entries.sort((a, b) => a.timeMs - b.timeMs);
        const top10 = entries.slice(0, 10);
        
        await saveLeaderboard(top10);
        
        console.log(`✅ Score salvo! Ranking atual tem ${top10.length} entradas`);
        
        res.json({ 
            success: true, 
            leaderboard: top10,
            position: top10.findIndex(e => e.name === name && e.timeMs === timeMs) + 1
        });
    } catch (err) {
        console.error('❌ Erro ao salvar score:', err);
        res.status(500).json({ 
            error: 'Erro ao salvar score',
            message: err.message 
        });
    }
});

// GET /stats - Obter estatísticas (aceita barra final)
app.get(['/stats', '/stats/'], async (req, res) => {
    try {
        const leaderboard = await loadLeaderboard();
        const visits = await loadVisits();
        
        console.log(`📊 Stats solicitadas: ${leaderboard.length} entries, ${visits.count} visits`);
        
        res.json({
            success: true,
            leaderboard,
            visits: visits.count,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ Erro ao obter stats:', err);
        res.status(500).json({ 
            error: 'Erro ao obter estatísticas',
            message: err.message 
        });
    }
});

// POST /admin/reset - Resetar leaderboard
app.post(['/admin/reset', '/admin/reset/'], async (req, res) => {
    try {
        console.log('🔐 [RESET] Tentativa de reset recebida');
        console.log('🔐 [RESET] Headers:', JSON.stringify(req.headers, null, 2));
        console.log('🔐 [RESET] Body:', JSON.stringify(req.body, null, 2));
        
        // Buscar senha em múltiplos locais
        const passwordHash = req.body?.passwordHash 
            || req.body?.password 
            || req.body?.adminPassword 
            || req.headers['x-admin-pass-sha256']
            || req.headers['x-admin-password'];
        
        if (!passwordHash) {
            console.log('❌ [RESET] Senha não fornecida');
            return res.status(400).json({ 
                error: 'Senha não fornecida',
                hint: 'Envie passwordHash no body ou x-admin-pass-sha256 no header',
                received: {
                    body: Object.keys(req.body),
                    headers: Object.keys(req.headers).filter(h => h.includes('admin') || h.includes('pass'))
                }
            });
        }
        
        console.log(`🔐 [RESET] Hash recebido: ${passwordHash.slice(0, 15)}...`);
        console.log(`🔐 [RESET] Hash esperado: ${ADMIN_PASSWORD_HASH.slice(0, 15)}...`);
        console.log(`🔐 [RESET] Hashes são iguais: ${passwordHash === ADMIN_PASSWORD_HASH}`);
        
        if (passwordHash !== ADMIN_PASSWORD_HASH) {
            console.log('❌ [RESET] Senha incorreta!');
            return res.status(403).json({ 
                error: 'Senha incorreta',
                hint: 'Verifique se o hash SHA-256 está correto'
            });
        }
        
        // Resetar leaderboard
        await saveLeaderboard([]);
        console.log('✅ [RESET] Leaderboard resetado com sucesso!');
        
        res.json({ 
            success: true, 
            message: 'Leaderboard resetado com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ [RESET] Erro:', err);
        res.status(500).json({ 
            error: 'Erro ao resetar leaderboard',
            message: err.message 
        });
    }
});

// Listar rotas registradas para debug rápido
app.get('/__routes', (_req, res) => {
    try {
        const routes = [];
        app._router.stack.forEach((m) => {
            if (m.route && m.route.path) {
                const methods = Object.keys(m.route.methods).map(k => k.toUpperCase());
                routes.push({ path: m.route.path, methods });
            } else if (m.name === 'router' && m.handle.stack) {
                m.handle.stack.forEach((h) => {
                    if (h.route && h.route.path) {
                        const methods = Object.keys(h.route.methods).map(k => k.toUpperCase());
                        routes.push({ path: h.route.path, methods });
                    }
                });
            }
        });
        res.json({ routes });
    } catch (e) {
        res.status(500).json({ error: 'Falha ao inspecionar rotas', message: e.message });
    }
});

// Rota 404
app.use((req, res) => {
    console.log(`⚠️ 404: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /visit',
            'POST /score',
            'GET /stats',
            'POST /admin/reset'
        ]
    });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('💥 Erro não tratado:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: IS_PRODUCTION ? 'Algo deu errado' : err.message
    });
});

// Iniciar servidor
initDataFiles().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
        console.log('='.repeat(60));
        console.log(`📍 URL: http://0.0.0.0:${PORT}`);
        console.log(`🌍 Ambiente: ${IS_PRODUCTION ? 'PRODUÇÃO (Render)' : 'DESENVOLVIMENTO'}`);
        console.log(`📁 Dados em: ${DATA_DIR}`);
        console.log('\n📚 Endpoints disponíveis:');
        console.log('   GET  /              - Informações da API');
        console.log('   GET  /health        - Health check');
        console.log('   POST /visit         - Registrar visita');
        console.log('   POST /score         - Enviar score');
        console.log('   GET  /stats         - Obter estatísticas');
        console.log('   POST /admin/reset   - Resetar leaderboard');
        console.log('='.repeat(60) + '\n');
    });
}).catch(err => {
    console.error('💥 ERRO FATAL ao inicializar servidor:', err);
    process.exit(1);
});
