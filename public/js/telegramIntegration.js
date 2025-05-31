export class TelegramIntegration {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.isTelegramWebApp = !!this.telegram;
        // Obtener el chat_id de la URL si está presente
        const urlParams = new URLSearchParams(window.location.search);
        this.chatId = urlParams.get('chat_id');
        this.gameStartTime = null; // Para calcular tiempo de juego
    }

    init() {
        if (!this.isTelegramWebApp) {
            // Si no estamos en Telegram WebApp, quizás mostrar un mensaje alternativo
            console.log("No se detectó Telegram WebApp. Algunas funcionalidades pueden no estar disponibles.");
            return;
        }
        
        // Inicializar el WebApp de Telegram
        this.telegram.expand();
        this.telegram.enableClosingConfirmation();
        
        // Configurar el tema según Telegram
        document.body.classList.add(this.telegram.colorScheme);

        // Mostrar mensaje de bienvenida al cargar la WebApp si no hay un chatId (ej. chat privado o acceso directo)
        // Si hay chatId, asumimos que viene de un grupo y el mensaje de inicio ya fue manejado por el bot.
        if (!this.chatId) {
             this.showStartMessage();
        }

        // Manejar comandos de Telegram (si se envían dentro de la WebApp)
        this.telegram.onEvent('command', (command) => {
            switch(command) {
                case 'start':
                    // Si ya estamos en la WebApp, al enviar /start de nuevo mostramos el mensaje de inicio
                    this.showStartMessage();
                    break;
                case 'help':
                    this.showHelp();
                    break;
            }
        });

        // Opcional: Manejar clics en botones del popup
        this.telegram.onEvent('popupClosed', (buttonId) => {
            if (buttonId === 'help') {
                this.showHelp();
            }
        });
    }

    showStartMessage() {
        const startMessage = `¡Bienvenido al juego de las cucarachas! 🪳\n\n🎮 *KOKOK THE ROACH*\nUn juego donde disparas a los jefes más poderosos del mundo.\n\n*Características:*\n• Jefes únicos: Trump y Elon\n• Power-ups especiales\n• Sistema de puntuación\n\n¡Haz clic en el botón de abajo para comenzar!`;

        this.telegram.showPopup({
            title: '🎮 KOKOK THE ROACH',
            message: startMessage,
            buttons: [
                {
                    id: 'play',
                    type: 'web_app',
                    text: '🎮 JUGAR AHORA',
                    web_app: { url: window.location.href }
                },
                {id: 'help', type: 'text', text: '📖 INSTRUCCIONES'}
            ]
        });
    }

    showHelp() {
        const helpMessage = `🎮 *INSTRUCCIONES DEL JUEGO* 🎮\n\n*Controles:*\n• Mover: Flechas o controles táctiles\n• Disparar: Espacio o botón de disparo\n• Saltar: Flecha arriba\n\n*Objetivos:*\n• Derrota a los jefes: Trump y Elon\n• Recoge power-ups para ventajas\n• ¡Sobrevive el mayor tiempo posible!\n\n*Power-ups:*\n• 🛡️ Escudo: Protección temporal\n• 💰 Bolsa de azúcar: Poder especial\n\n¡Buena suerte! 🪳✨`;

        this.telegram.showPopup({
            title: '📖 Instrucciones',
            message: helpMessage,
            buttons: [{id: 'close', type: 'close'}]
        });
    }

    async shareScore(score) {
        if (!this.isTelegramWebApp || !this.chatId) {
            console.warn("No se puede compartir la puntuación: No estamos en Telegram WebApp o no se encontró el chatId.");
            // Si no estamos en Telegram WebApp, no hacer nada
            return;
        }
        
        const playerName = this.getUserName();
        const gameTime = this.getGameTime();
        const message = `🎮 ¡Juego terminado! 🎮\n\n🏆 ${playerName} ha conseguido ${score} puntos en KOKOK THE ROACH! 🪳\n\n💪 ¿Crees que puedes superarlo? ¡Intentalo ahora!\n\n#KokokTheRoach #CryptoGame`;
        
        try {
            // Enviar automáticamente la puntuación al chat
            const response = await fetch('/api/share-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: this.chatId,
                    score: score,
                    message: message,
                    playerName: playerName
                })
            });

            // También enviar datos al webhook de n8n para automatización
            const webhookData = {
                // Información básica del juego
                chatId: this.chatId,
                playerName: playerName,
                score: score,
                gameTime: gameTime,
                event: 'game_over',
                
                // Timestamp e identificadores
                timestamp: new Date().toISOString(),
                gameSession: this.generateSessionId(),
                
                // Información adicional del juego
                additionalData: {
                    isNewRecord: this.isNewRecord(score),
                    previousHighScore: this.getPreviousHighScore(),
                    totalBossesDefeated: this.getTotalBossesDefeated(),
                    powerUpsUsed: this.getPowerUpsUsed(),
                    gameVersion: '1.0',
                    platform: this.getPlatform()
                },
                
                // Información del chat/usuario
                userInfo: {
                    userId: this.getUserId(),
                    chatType: this.getChatType(),
                    isFirstTime: this.isFirstTimePlayer()
                },
                
                // Metadatos del juego
                game: {
                    name: "KOKOK The Roach",
                    version: "1.0",
                    type: "crypto_shooter"
                }
            };

            await this.sendToN8nWebhook(webhookData);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al compartir la puntuación con el backend:', errorData.error);
            } else {
                console.log('Puntuación enviada automáticamente al chat de Telegram.');
            }
        } catch (error) {
            console.error('Error en la llamada fetch para compartir puntuación:', error);
        }
    }

    async sendToN8nWebhook(data) {
        try {
            // URL específica del webhook de n8n del usuario
            const n8nWebhookUrl = 'https://chriscodex1.app.n8n.cloud/webhook-test/1017d610-1159-4eed-b4e7-8644b0f3ace9';
            
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('Datos enviados a n8n webhook correctamente:', data);
                const responseData = await response.text();
                console.log('Respuesta de n8n:', responseData);
            } else {
                console.error('Error al enviar datos a n8n webhook:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error en llamada a n8n webhook:', error);
        }
    }

    startGameTimer() {
        this.gameStartTime = Date.now();
    }

    getGameTime() {
        if (!this.gameStartTime) return null;
        const gameTimeMs = Date.now() - this.gameStartTime;
        const minutes = Math.floor(gameTimeMs / 60000);
        const seconds = Math.floor((gameTimeMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    isNewRecord(score) {
        const currentRecord = localStorage.getItem("kokokHighScore") || 0;
        return score > Number.parseInt(currentRecord);
    }

    getTotalBossesDefeated() {
        // Esta información se puede obtener del gameState si se pasa como parámetro
        return 0; // Implementar si es necesario
    }

    getPowerUpsUsed() {
        // Esta información se puede obtener del gameState si se pasa como parámetro
        return []; // Implementar si es necesario
    }

    generateSessionId() {
        // Generar un ID único para la sesión de juego
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getPreviousHighScore() {
        return Number.parseInt(localStorage.getItem("kokokHighScore")) || 0;
    }

    getPlatform() {
        if (this.isTelegramWebApp) {
            return 'telegram_webapp';
        } else if (/Mobi|Android/i.test(navigator.userAgent)) {
            return 'mobile';
        } else {
            return 'desktop';
        }
    }

    getChatType() {
        if (!this.isTelegramWebApp) return 'unknown';
        // Intentar determinar si es chat privado o grupo
        return this.chatId && this.chatId.startsWith('-') ? 'group' : 'private';
    }

    isFirstTimePlayer() {
        // Verificar si es la primera vez que juega
        const hasPlayed = localStorage.getItem("kokokHasPlayed");
        if (!hasPlayed) {
            localStorage.setItem("kokokHasPlayed", "true");
            return true;
        }
        return false;
    }

    async shareScoreManually(score) {
        if (!this.isTelegramWebApp) {
            console.warn("No se puede compartir la puntuación: No estamos en Telegram WebApp.");
            return;
        }
        
        const playerName = this.getUserName();
        const message = `🎮 ¡Mira mi puntuación! 🎮\n\n🏆 ${playerName} ha conseguido ${score} puntos en KOKOK THE ROACH! 🪳\n\n💪 ¿Puedes superarme? ¡Inténtalo!\n\n#KokokTheRoach #CryptoGame`;
        
        // Mostrar popup con opciones para compartir manualmente
        this.telegram.showPopup({
            title: '🎮 ¡Compartir Puntuación!',
            message: `¡Has conseguido ${score} puntos!\n\n¿Quieres compartir tu puntuación?`,
            buttons: [
                {id: 'share_telegram', type: 'text', text: '📱 Compartir en Telegram'},
                {id: 'close', type: 'close', text: '❌ Cerrar'}
            ]
        }, (buttonId) => {
            if (buttonId === 'share_telegram' && this.chatId) {
                // Si tenemos chatId, enviar al chat
                this.sendToChat(message, score, playerName);
            } else if (buttonId === 'share_telegram') {
                // Si no tenemos chatId, abrir compartir nativo de Telegram
                this.telegram.switchInlineQuery(message, ['users', 'groups']);
            }
        });
    }

    async sendToChat(message, score, playerName) {
        if (!this.chatId) {
            console.warn("No se puede enviar al chat: chatId no disponible.");
            return;
        }
        
        try {
            const response = await fetch('/api/share-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: this.chatId,
                    score: score,
                    message: message,
                    playerName: playerName
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al enviar mensaje al chat:', errorData.error);
                this.telegram.showPopup({
                    title: 'Error',
                    message: 'No se pudo enviar el mensaje al chat.',
                    buttons: [{id: 'close', type: 'close'}]
                });
            } else {
                console.log('Mensaje enviado al chat correctamente.');
                this.telegram.showPopup({
                    title: '✅ ¡Enviado!',
                    message: 'Tu puntuación ha sido compartida en el chat.',
                    buttons: [{id: 'close', type: 'close'}]
                });
            }
        } catch (error) {
            console.error('Error al enviar mensaje al chat:', error);
            this.telegram.showPopup({
                title: 'Error de conexión',
                message: 'No se pudo conectar con el servidor.',
                buttons: [{id: 'close', type: 'close'}]
            });
        }
    }

    getUserId() {
        if (!this.isTelegramWebApp) return null;
        return this.telegram.initDataUnsafe?.user?.id;
    }

    getUserName() {
        if (!this.isTelegramWebApp) return 'Jugador';
        // Obtener el nombre del usuario de Telegram
        const user = this.telegram.initDataUnsafe?.user;
        if (user) {
            // Usar el nombre completo si está disponible, sino el username
            return user.first_name + (user.last_name ? ' ' + user.last_name : '') || user.username || 'Jugador';
        }
        return 'Jugador';
    }
} 