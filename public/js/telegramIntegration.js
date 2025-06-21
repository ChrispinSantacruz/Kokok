export class TelegramIntegration {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.isTelegramWebApp = !!this.telegram;
        // Obtener el chat_id de la URL si está presente
        const urlParams = new URLSearchParams(window.location.search);
        this.chatId = urlParams.get('chat_id');
        this.gameStartTime = null; // Para calcular tiempo de juego
        
        // DEBUG: Mostrar información del chat_id
        console.log('🔍 DEBUG TelegramIntegration:');
        console.log('- URL completa:', window.location.href);
        console.log('- URL params:', window.location.search);
        console.log('- Chat ID capturado:', this.chatId);
        console.log('- Es Telegram WebApp:', this.isTelegramWebApp);
    }

    init() {
        if (!this.isTelegramWebApp) {
            // Si no estamos en Telegram WebApp, quizás mostrar un mensaje alternativo
            console.log("No se detectó Telegram WebApp. Algunas funcionalidades pueden no estar disponibles.");
            return;
        }
        
        // Inicializar el WebApp de Telegram
        this.telegram.expand();
        
        // COMENTADO: enableClosingConfirmation no soportado en versión 6.0
        // this.telegram.enableClosingConfirmation();
        
        // Configurar el tema según Telegram
        document.body.classList.add(this.telegram.colorScheme);

        // COMENTADO: showPopup no soportado en versión 6.0
        // Mostrar mensaje de bienvenida al cargar la WebApp si no hay un chatId
        /*
        if (!this.chatId) {
             this.showStartMessage();
        }
        */

        // Manejar comandos de Telegram (si se envían dentro de la WebApp)
        this.telegram.onEvent('command', (command) => {
            switch(command) {
                case 'game':
                    // Si ya estamos en la WebApp, al enviar /game de nuevo mostramos el mensaje de inicio
                    // this.showStartMessage(); // COMENTADO por compatibilidad
                    break;
                case 'help':
                    // this.showHelp(); // COMENTADO por compatibilidad
                    break;
            }
        });

        // Opcional: Manejar clics en botones del popup
        this.telegram.onEvent('popupClosed', (buttonId) => {
            if (buttonId === 'help') {
                // this.showHelp(); // COMENTADO por compatibilidad
            }
        });
    }

    showStartMessage() {
        const startMessage = `Welcome to the cockroach game! 🪳\n\n🎮 *KOKOK THE ROACH*\nA game where you shoot the most powerful bosses in the world.\n\n*Features:*\n• Unique bosses: Trump and Elon\n• Special power-ups\n• Scoring system\n\nClick the button below to start!`;

        this.telegram.showPopup({
            title: '🎮 KOKOK THE ROACH',
            message: startMessage,
            buttons: [
                {
                    id: 'play',
                    type: 'web_app',
                    text: '🎮 PLAY NOW',
                    web_app: { url: window.location.href }
                },
                {id: 'help', type: 'text', text: '📖 INSTRUCTIONS'}
            ]
        });
    }

    showHelp() {
        const helpMessage = `🎮 *GAME INSTRUCTIONS* 🎮\n\n*Controls:*\n• Move: Arrow keys or touch controls\n• Shoot: Space or shoot button\n• Jump: Up arrow\n\n*Objectives:*\n• Defeat the bosses: Trump and Elon\n• Collect power-ups for advantages\n• Survive as long as possible!\n\n*Power-ups:*\n• 🛡️ Shield: Temporary protection\n• 💰 Sugar bag: Special power\n\nGood luck! 🪳✨`;

        this.telegram.showPopup({
            title: '📖 Instructions',
            message: helpMessage,
            buttons: [{id: 'close', type: 'close'}]
        });
    }

    async shareScore(score) {
        console.log('🎮 DEBUG shareScore llamada:');
        console.log('- Score:', score);
        console.log('- ChatId disponible:', this.chatId);
        console.log('- Es Telegram WebApp:', this.isTelegramWebApp);
        
        if (!this.isTelegramWebApp || !this.chatId) {
            console.warn("Cannot share score: We are not in Telegram WebApp or chatId not found.");
            // Si no estamos en Telegram WebApp, no hacer nada
            return;
        }
        
        const playerName = this.getUserName();
        const gameTime = this.getGameTime();
        
        console.log('📋 Datos del juego:');
        console.log('- Player Name:', playerName);
        console.log('- Game Time:', gameTime);
        
        const message = `🎮 Game over! 🎮\n\n🏆 ${playerName} has achieved ${score} points in KOKOK THE ROACH! 🪳\n\n💪 Do you think you can beat it? Try it now!\n\n#KokokTheRoach #CryptoGame`;
        
        try {
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
                    platform: this.getPlatform()
                }
            };

            console.log('🚀 Enviando al webhook:', webhookData);
            await this.sendToN8nWebhook(webhookData);

            // Comentamos el envío al backend por ahora
            /*
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
                console.error('Error al compartir la puntuación con el backend:', errorData.error);
            } else {
                console.log('Puntuación enviada automáticamente al chat de Telegram.');
            }
            */
        } catch (error) {
            console.error('Error in fetch call to share score:', error);
        }
    }

    async sendToN8nWebhook(data) {
        try {
            // URL específica del webhook de n8n del usuario (CORREGIDA CON WEBHOOK-TEST)
            const n8nWebhookUrl = 'https://chriscodex2.app.n8n.cloud/webhook-test/1017d610-1159-4eed-b4e7-8644b0f3ace9';
            
            console.log('🚀 Enviando datos a n8n (método GET):', data);
            
            // MÉTODO SIN CORS: Usar imagen con parámetros GET
            const params = new URLSearchParams();
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'object') {
                    params.append(key, JSON.stringify(data[key]));
                } else {
                    params.append(key, data[key]);
                }
            });
            
            const finalUrl = `${n8nWebhookUrl}?${params.toString()}`;
            console.log('🔗 URL final:', finalUrl);
            
            // Crear imagen invisible que haga la petición
            const img = new Image();
            img.style.display = 'none';
            
            return new Promise((resolve, reject) => {
                let resolved = false;
                
                const cleanup = () => {
                    if (img.parentNode) {
                        document.body.removeChild(img);
                    }
                };
                
                const resolveOnce = (result) => {
                    if (!resolved) {
                        resolved = true;
                        cleanup();
                        resolve(result);
                    }
                };
                
                img.onload = () => {
                    console.log('✅ Imagen cargó - Datos enviados exitosamente');
                    resolveOnce({ success: true, method: 'onload' });
                };
                
                img.onerror = () => {
                    console.log('⚠️ Imagen falló (esperado) - Datos probablemente enviados');
                    resolveOnce({ success: true, method: 'onerror' });
                };
                
                // Timeout más agresivo - asumir éxito después de 3 segundos
                setTimeout(() => {
                    console.log('⏰ Timeout - Asumiendo envío exitoso');
                    resolveOnce({ success: true, method: 'timeout' });
                }, 3000);
                
                img.src = finalUrl;
                document.body.appendChild(img);
                
                console.log('📤 Petición enviada, esperando respuesta...');
            });
            
        } catch (error) {
            console.error('💥 Error en llamada a n8n webhook:', error);
            throw error;
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
            console.warn("Cannot share score: We are not in Telegram WebApp.");
            return;
        }
        
        const playerName = this.getUserName();
        const message = `🎮 Check out my score! 🎮\n\n🏆 ${playerName} has achieved ${score} points in KOKOK THE ROACH! 🪳\n\n💪 Can you beat me? Try it!\n\n#KokokTheRoach #CryptoGame`;
        
        // Mostrar popup con opciones para compartir manualmente
                 this.telegram.showPopup({
            title: '🎮 Share Score!',
            message: `You got ${score} points!\n\nDo you want to share your score?`,
                    buttons: [
                {id: 'share_telegram', type: 'text', text: '📱 Share on Telegram'},
                {id: 'close', type: 'close', text: '❌ Close'}
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
                console.error('Error sharing score with backend:', errorData.error);
                this.telegram.showPopup({
                    title: 'Error',
                    message: 'Could not send message to chat.',
                    buttons: [{id: 'close', type: 'close'}]
                });
            } else {
                console.log('Score sent automatically to Telegram chat.');
                 this.telegram.showPopup({
                    title: '✅ Sent!',
                    message: 'Your score has been shared in the chat.',
                    buttons: [{id: 'close', type: 'close'}]
                });
            }
        } catch (error) {
            console.error('Error sending message to chat:', error);
             this.telegram.showPopup({
                title: 'Connection Error',
                message: 'Could not connect to server.',
                buttons: [{id: 'close', type: 'close'}]
            });
        }
    }

    getUserId() {
        if (!this.isTelegramWebApp) return null;
        return this.telegram.initDataUnsafe?.user?.id;
    }

    getUserName() {
        if (!this.isTelegramWebApp) return 'Player';
        // Obtener el nombre del usuario de Telegram
        const user = this.telegram.initDataUnsafe?.user;
        if (user) {
            // Usar el nombre completo si está disponible, sino el username
            return user.first_name + (user.last_name ? ' ' + user.last_name : '') || user.username || 'Player';
        }
        return 'Player';
    }
} 