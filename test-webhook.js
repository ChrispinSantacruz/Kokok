// Script de prueba para enviar datos al webhook de n8n
// Ejecuta: node test-webhook.js

const webhookUrl = 'https://chriscodex1.app.n8n.cloud/webhook-test/1017d610-1159-4eed-b4e7-8644b0f3ace9';

const testData = {
    // Información básica del juego
    chatId: "123456789",
    playerName: "TestPlayer",
    score: 150,
    gameTime: "2:30",
    event: "game_over",
    
    // Timestamp e identificadores
    timestamp: new Date().toISOString(),
    gameSession: "test_session_123",
    
    // Información adicional del juego
    additionalData: {
        isNewRecord: true,
        previousHighScore: 120,
        totalBossesDefeated: 5,
        powerUpsUsed: ["shield", "speed"],
        gameVersion: "1.0",
        platform: "telegram_webapp"
    },
    
    // Información del chat/usuario
    userInfo: {
        userId: "987654321",
        chatType: "private",
        isFirstTime: false
    },
    
    // Metadatos del juego
    game: {
        name: "KOKOK The Roach",
        version: "1.0",
        type: "crypto_shooter"
    }
};

async function testWebhook() {
    try {
        console.log('🚀 Enviando datos de prueba al webhook de n8n...');
        console.log('📡 URL:', webhookUrl);
        console.log('📦 Datos:', JSON.stringify(testData, null, 2));
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        if (response.ok) {
            const responseText = await response.text();
            console.log('✅ Éxito! Datos enviados correctamente');
            console.log('📥 Respuesta de n8n:', responseText);
        } else {
            console.error('❌ Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('📥 Respuesta de error:', errorText);
        }
    } catch (error) {
        console.error('💥 Error en la petición:', error.message);
    }
}

// Ejecutar test múltiple con diferentes escenarios
async function runTests() {
    console.log('🧪 === PRUEBAS DEL WEBHOOK N8N ===\n');
    
    // Test 1: Juego normal
    console.log('1️⃣ Test: Juego normal');
    await testWebhook();
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
    
    // Test 2: Nuevo récord
    console.log('\n2️⃣ Test: Nuevo récord');
    const recordData = { ...testData, score: 500, additionalData: { ...testData.additionalData, isNewRecord: true, previousHighScore: 300 } };
    await testSpecific(recordData);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Primer jugador
    console.log('\n3️⃣ Test: Primer jugador');
    const firstPlayerData = { ...testData, playerName: "NuevoJugador", userInfo: { ...testData.userInfo, isFirstTime: true } };
    await testSpecific(firstPlayerData);
}

async function testSpecific(data) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('✅ Éxito!');
        } else {
            console.error('❌ Error:', response.status);
        }
    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

// Si se ejecuta directamente
if (require.main === module) {
    runTests();
}

module.exports = { testWebhook, testData }; 