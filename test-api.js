// Script para testar a API localmente ou no Render

const API_URL = process.argv[2] || 'http://localhost:10000';

console.log(`\n🧪 Testando API: ${API_URL}\n`);

async function testEndpoint(method, path, body = null) {
    const url = `${API_URL}${path}`;
    console.log(`\n📡 ${method} ${path}`);
    
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const res = await fetch(url, options);
        const data = await res.json();
        
        console.log(`✅ Status: ${res.status}`);
        console.log(`📦 Response:`, JSON.stringify(data, null, 2));
        
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        console.log(`❌ Erro: ${err.message}`);
        return { ok: false, error: err.message };
    }
}

async function runTests() {
    console.log('='.repeat(60));
    
    // 1. Health Check
    await testEndpoint('GET', '/health');
    
    // 2. Registrar visita
    await testEndpoint('POST', '/visit');
    
    // 3. Enviar score
    await testEndpoint('POST', '/score', {
        name: 'Jogador Teste',
        timeMs: 12345
    });
    
    // 4. Ver estatísticas
    await testEndpoint('GET', '/stats');
    
    // 5. Testar reset (com senha errada)
    await testEndpoint('POST', '/admin/reset', {
        passwordHash: 'senha-errada-para-testar'
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Testes concluídos!\n');
}

runTests().catch(err => {
    console.error('💥 Erro fatal:', err);
    process.exit(1);
});
