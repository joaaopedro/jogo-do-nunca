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

// Hash SHA-256 da senha de admin (mesma do frontend)
const ADMIN_PASSWORD_HASH = 'd23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7';

// Configurar CORS para permitir requisições do frontend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-pass-sha256', 'x-admin-password']
}));

app.use(express.json());

// Middleware para logs
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Inicializar arquivos de dados
async function initDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        try {
            await fs.access(LEADERBOARD_FILE);
        } catch {
            await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]));
        }
        
        try {
            await fs.access(VISITS_FILE);
        } catch {
            await fs.writeFile(VISITS_FILE, JSON.stringify({ count: 0 }));
        }
        
        console.log('✅ Arquivos de dados inicializados');
    } catch (err) {
        console.error('❌ Erro ao inicializar arquivos:', err);
    }
}

// Carregar leaderboard
async function loadLeaderboard() {
    try {
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Salvar leaderboard
async function saveLeaderboard(entries) {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(entries, null, 2));
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
        message: 'API do Jogo do Nunca',
        version: '1.0.0',
        endpoints: {
            'POST /visit': 'Registrar visita',
            'POST /score': 'Enviar score (body: {name, timeMs})',
            'GET /stats': 'Obter estatísticas globais',
            'POST /admin/reset': 'Resetar leaderboard (requer senha SHA-256)',
            'GET /health': 'Health check'
        },
        documentation: 'https://github.com/seu-usuario/jogo-do-nunca'
    });
});

// GET /health - Health check simples
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /visit - Registrar visita
app.post('/visit', async (req, res) => {
    try {
        const visits = await loadVisits();
        visits.count++;
        await saveVisits(visits);
        res.json({ visits: visits.count });
    } catch (err) {
        console.error('Erro ao registrar visita:', err);
        res.status(500).json({ error: 'Erro ao registrar visita' });
    }
});

// POST /score - Enviar score
app.post('/score', async (req, res) => {
    try {
        const { name, timeMs } = req.body;
        
        if (!name || typeof timeMs !== 'number') {
            return res.status(400).json({ error: 'Nome e tempo são obrigatórios' });
        }
        
        const entries = await loadLeaderboard();
        entries.push({ 
            name: name.slice(0, 50), // Limitar tamanho do nome
            timeMs, 
            at: new Date().toISOString() 
        });
        
        entries.sort((a, b) => a.timeMs - b.timeMs);
        const top10 = entries.slice(0, 10);
        
        await saveLeaderboard(top10);
        
        res.json({ 
            success: true, 
            leaderboard: top10 
        });
    } catch (err) {
        console.error('Erro ao salvar score:', err);
        res.status(500).json({ error: 'Erro ao salvar score' });
    }
});

// GET /stats - Obter estatísticas
app.get('/stats', async (req, res) => {
    try {
        const leaderboard = await loadLeaderboard();
        const visits = await loadVisits();
        
        res.json({
            leaderboard,
            visits: visits.count
        });
    } catch (err) {
        console.error('Erro ao obter stats:', err);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// POST /admin/reset - Resetar leaderboard (ENDPOINT ÚNICO)
app.post('/admin/reset', async (req, res) => {
    try {
        console.log('[RESET] Requisição recebida');
        console.log('[RESET] Headers:', req.headers);
        console.log('[RESET] Body:', req.body);
        
        // Verificar senha em múltiplos locais
        const passwordHash = req.body?.passwordHash 
            || req.body?.password 
            || req.headers['x-admin-pass-sha256']
            || req.headers['x-admin-password'];
        
        if (!passwordHash) {
            console.log('[RESET] ❌ Senha não fornecida');
            return res.status(400).json({ 
                error: 'Senha não fornecida',
                hint: 'Envie passwordHash no body ou header x-admin-pass-sha256'
            });
        }
        
        console.log('[RESET] Hash recebido:', passwordHash.slice(0, 10) + '...');
        console.log('[RESET] Hash esperado:', ADMIN_PASSWORD_HASH.slice(0, 10) + '...');
        
        if (passwordHash !== ADMIN_PASSWORD_HASH) {
            console.log('[RESET] ❌ Senha incorreta');
            return res.status(403).json({ error: 'Senha incorreta' });
        }
        
        // Resetar leaderboard
        await saveLeaderboard([]);
        console.log('[RESET] ✅ Leaderboard resetado com sucesso');
        
        res.json({ 
            success: true, 
            message: 'Leaderboard resetado com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[RESET] ❌ Erro:', err);
        res.status(500).json({ 
            error: 'Erro ao resetar leaderboard',
            message: err.message 
        });
    }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: IS_PRODUCTION ? 'Algo deu errado' : err.message
    });
});

// Rota 404
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method
    });
});

// Iniciar servidor
initDataFiles().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
        console.log(`📊 Ambiente: ${IS_PRODUCTION ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
        console.log(`📁 Diretório de dados: ${DATA_DIR}`);
        console.log(`\n📚 Endpoints disponíveis:`);
        console.log(`   GET  /              - Informações da API`);
        console.log(`   GET  /health        - Health check`);
        console.log(`   POST /visit         - Registrar visita`);
        console.log(`   POST /score         - Enviar score`);
        console.log(`   GET  /stats         - Obter estatísticas`);
        console.log(`   POST /admin/reset   - Resetar leaderboard\n`);
    });
}).catch(err => {
    console.error('❌ Erro fatal ao inicializar servidor:', err);
    process.exit(1);
});
