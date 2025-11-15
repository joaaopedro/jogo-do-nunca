require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');

// Hash SHA-256 da senha de admin (mesma do frontend)
const ADMIN_PASSWORD_HASH = 'd23dcd7dbb2f39d93e9014b53d9632ae718cd17ecabbf8a43748e35860005cc7';

// Configurar CORS para permitir requisições do frontend
app.use(cors({
    origin: true, // Permite qualquer origem em desenvolvimento
    credentials: true,
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
        message: 'Servidor do Jogo do Nunca',
        endpoints: {
            'POST /visit': 'Registrar visita',
            'POST /score': 'Enviar score',
            'GET /stats': 'Obter estatísticas',
            'POST /admin/reset': 'Resetar leaderboard (requer senha)'
        }
    });
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

// POST /admin/reset - Resetar leaderboard (múltiplos endpoints)
const resetHandler = async (req, res) => {
    try {
        // Verificar senha em múltiplos locais (body, headers, query)
        const passwordHash = req.body?.passwordHash 
            || req.body?.password 
            || req.body?.adminPassword 
            || req.headers['x-admin-pass-sha256']
            || req.headers['x-admin-password']
            || req.query.passwordHash
            || req.query.password;
        
        console.log('[RESET] Tentativa de reset recebida');
        console.log('[RESET] Hash recebido:', passwordHash?.slice(0, 10) + '...');
        
        if (!passwordHash) {
            console.log('[RESET] ❌ Senha não fornecida');
            return res.status(400).json({ error: 'Senha não fornecida' });
        }
        
        if (passwordHash !== ADMIN_PASSWORD_HASH) {
            console.log('[RESET] ❌ Senha incorreta');
            return res.status(403).json({ error: 'Senha incorreta' });
        }
        
        // Resetar leaderboard
        await saveLeaderboard([]);
        console.log('[RESET] ✅ Leaderboard resetado com sucesso');
        
        res.json({ 
            success: true, 
            message: 'Leaderboard resetado com sucesso' 
        });
    } catch (err) {
        console.error('[RESET] ❌ Erro:', err);
        res.status(500).json({ error: 'Erro ao resetar leaderboard' });
    }
};

// Registrar handler em múltiplos endpoints
app.post('/admin/reset', resetHandler);
app.delete('/admin/reset', resetHandler);
app.post('/admin/reset-leaderboard', resetHandler);
app.delete('/admin/reset-leaderboard', resetHandler);
app.post('/reset', resetHandler);
app.delete('/reset', resetHandler);

// Iniciar servidor
initDataFiles().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📊 Endpoints disponíveis:`);
        console.log(`   GET  /              - Informações do servidor`);
        console.log(`   POST /visit         - Registrar visita`);
        console.log(`   POST /score         - Enviar score`);
        console.log(`   GET  /stats         - Obter estatísticas`);
        console.log(`   POST /admin/reset   - Resetar leaderboard (requer senha)\n`);
    });
});
