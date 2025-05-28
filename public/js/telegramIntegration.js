export class TelegramIntegration {
    constructor() {
        this.telegram = window.Telegram?.WebApp;
        this.isTelegramWebApp = !!this.telegram;
        // Obtener el chat_id de la URL si está presente
        const urlParams = new URLSearchParams(window.location.search);
        this.chatId = urlParams.get('chat_id');
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
            // Mostrar popup local si no se puede compartir al chat
             this.telegram.showPopup({
                title: '¡Juego terminado!',
                message: `¡Has conseguido ${score} puntos!\n\nComparte tu puntuación manualmente.`, // Mensaje alternativo
                buttons: [
                    {id: 'close', type: 'close'}
                ]
            });
            return;
        }
        
        const playerName = this.getUserName();
        const message = `¡${playerName} ha conseguido ${score} puntos en el juego de las cucarachas! 🪳🎮\n\n¿Crees poder superarlo? 💪`;
        
        try {
            // Apuntar al endpoint del backend. Usamos una ruta relativa /api/share-score.
            // Esto funcionará en Vercel si el backend está en el mismo proyecto y Vercel lo enruta correctamente.
            const response = await fetch('/api/share-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: this.chatId, // Incluir chatId
                    score: score,
                    message: message,
                    playerName: playerName
                })
            });

            if (!response.ok) {
                // Si falla el envío al backend, mostrar un mensaje de error local o popup
                const errorData = await response.json();
                console.error('Error al compartir la puntuación con el backend:', errorData.error);
                 this.telegram.showPopup({
                    title: 'Error al compartir',
                    message: 'No se pudo compartir la puntuación automáticamente.', // Mensaje de error
                    buttons: [
                        {id: 'close', type: 'close'}
                    ]
                });
            } else {
                console.log('Puntuación enviada al backend correctamente.');
                 // Mostrar popup de éxito solo si el envío al backend fue exitoso
                 this.telegram.showPopup({
                    title: '¡Puntuación compartida!',
                    message: message,
                    buttons: [
                        {id: 'share', type: 'share'},
                        {id: 'close', type: 'close'}
                    ]
                });
            }
        } catch (error) {
            console.error('Error en la llamada fetch para compartir puntuación:', error);
             // Mostrar popup de error si hay un problema de red o similar
             this.telegram.showPopup({
                title: 'Error de conexión',
                message: 'No se pudo conectar con el servidor para compartir la puntuación.', // Mensaje de error de red
                buttons: [
                    {id: 'close', type: 'close'}
                ]
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