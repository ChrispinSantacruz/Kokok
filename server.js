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

    if (chatType === 'private') {
        // Respuesta para chat privado
        const gameUrl = `${process.env.GAME_URL}`;
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
        // Respuesta para grupos
        const groupStartMessage = `¡Hola! Para jugar *KOKOK THE ROACH* en este grupo, por favor haz clic en el botón del menú del juego junto al campo de texto. 👇\n\nBusca el botón con el nombre del juego o su ícono.`;

        bot.sendMessage(chatId, groupStartMessage, {
            parse_mode: 'Markdown'
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

// Endpoint para recibir puntuaciones del juego (si quieres que el bot publique en el chat)
app.post('/api/share-score', async (req, res) => {
    const { chatId, score, message } = req.body;
    
    if (!chatId || score === undefined || !message) {
        console.error('Datos incompletos para compartir puntuación.', req.body);
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    try {
        await bot.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 