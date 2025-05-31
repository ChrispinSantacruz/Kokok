const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración del bot de Telegram
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'TU_TOKEN_DEL_BOT') {
    console.error('Error: Por favor, configura la variable de entorno TELEGRAM_BOT_TOKEN en el archivo .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Comando para iniciar el juego
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const chatType = msg.chat.type; // Obtener el tipo de chat
    const gameBaseUrl = process.env.GAME_URL;

    if (!gameBaseUrl) {
        console.error('Error: Variable de entorno GAME_URL no configurada.');
        bot.sendMessage(chatId, 'Error en la configuración del juego. Por favor, inténtalo más tarde.');
        return;
    }

    if (chatType === 'private') {
        // Respuesta para chat privado: usar botón web_app
        const gameUrl = `${gameBaseUrl}`;
        const startMessage = `¡Bienvenido al juego de las cucarachas! 🪳\n\n🎮 *KOKOK THE ROACH*\nUn juego donde disparas a los jefes más poderosos del mundo.\n\n*Características:*\n• Jefes únicos: Trump y Elon\n• Power-ups especiales\n• Sistema de puntuación\n\n¡Haz clic en el botón de abajo para comenzar!`;

        bot.sendMessage(chatId, startMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 Jugar Ahora', web_app: { url: gameUrl } }
                ]]
            }
        });
    } else {
        // Respuesta para grupos: usar botón url y explicar cómo usar el Menu Button
        const gameUrlWithChatId = `${gameBaseUrl}?chat_id=${chatId}`;
        const groupStartMessage = `¡Hola! ¡Bienvenido a *KOKOK THE ROACH*! 🪳🎮\n\nPara iniciar el juego, haz clic en el botón de abajo:\n\n(Recomendamos usar el botón del menú del juego junto al campo de texto para una mejor experiencia en grupos, si aparece).`;

        bot.sendMessage(chatId, groupStartMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '▶️ Jugar KOKOK THE ROACH', url: gameUrlWithChatId }
                ]]
            }
        });
    }
});

// Comando para mostrar instrucciones
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `🎮 *INSTRUCCIONES DEL JUEGO* 🎮\n\n*Controles:*\n• Mover: Flechas o controles táctiles\n• Disparar: Espacio o botón de disparo\n• Saltar: Flecha arriba\n\n*Objetivos:*\n• Derrota a los jefes: Trump y Elon\n• Recoge power-ups para ventajas\n• ¡Sobrevive el mayor tiempo posible!\n\n*Power-ups:*\n• 🛡️ Escudo: Protección temporal\n• 💰 Bolsa de azúcar: Poder especial\n\n¡Buena suerte! 🪳✨`;

    bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown'
    });
});

// Endpoint para recibir puntuaciones del juego
app.post('/api/share-score', async (req, res) => {
    const { chatId, score, message, playerName } = req.body;
    
    if (!chatId || score === undefined || !message) {
        console.error('Datos incompletos para compartir puntuación.', req.body);
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    try {
        // Enviar mensaje con formato mejorado
        const gameUrl = process.env.GAME_URL;
        const finalMessage = `${message}\n\n🎮 ¡Juega ahora y supera esta puntuación!\n👆 Usa el botón del menú o haz clic aquí: ${gameUrl}`;
        
        await bot.sendMessage(chatId, finalMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 ¡Jugar KOKOK THE ROACH!', url: `${gameUrl}?chat_id=${chatId}` }
                ]]
            }
        });
        
        console.log(`Puntuación compartida: ${playerName} - ${score} puntos en chat ${chatId}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint específico para n8n automatization
app.post('/api/n8n-webhook', async (req, res) => {
    const { chatId, playerName, score, gameTime, event, additionalData } = req.body;
    
    if (!chatId || score === undefined || !playerName || !event) {
        console.error('Datos incompletos para webhook n8n.', req.body);
        return res.status(400).json({ success: false, error: 'Datos incompletos para n8n' });
    }

    try {
        // Datos estructurados para n8n
        const webhookData = {
            timestamp: new Date().toISOString(),
            chatId: chatId,
            playerName: playerName,
            score: score,
            gameTime: gameTime || null,
            event: event, // game_over, new_record, boss_defeated, etc.
            additionalData: additionalData || {},
            game: {
                name: "KOKOK The Roach",
                version: "1.0"
            }
        };

        // Log para debugging
        console.log(`n8n Webhook - Evento: ${event}, Jugador: ${playerName}, Puntuación: ${score}`);

        // Si quieres también enviar mensaje al chat de Telegram (opcional)
        if (event === 'game_over') {
            const message = `🎮 ¡${playerName} terminó una partida!\n\n🏆 Puntuación: ${score} puntos\n⏱️ Tiempo: ${gameTime || 'N/A'}\n\n¡Intenta superarlo!`;
            
            await bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🎮 ¡Jugar Ahora!', url: `${process.env.GAME_URL}?chat_id=${chatId}` }
                    ]]
                }
            });
        }

        // Responder con los datos para n8n
        res.json({ 
            success: true, 
            data: webhookData,
            message: 'Datos procesados correctamente para n8n'
        });

    } catch (error) {
        console.error('Error en webhook n8n:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para obtener estadísticas (útil para n8n)
app.get('/api/game-stats/:chatId', (req, res) => {
    const { chatId } = req.params;
    
    // Aquí podrías implementar lógica para obtener estadísticas
    // Por ahora, devolvemos datos de ejemplo
    const stats = {
        chatId: chatId,
        totalGames: 0, // Implementar contador
        averageScore: 0, // Implementar cálculo
        bestScore: 0, // Implementar tracking
        lastPlayed: null, // Implementar timestamp
        activePlayers: [] // Implementar lista de jugadores
    };

    res.json({ success: true, stats });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 