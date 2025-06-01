export class PlayerManager {
    constructor() {
        this.playerName = '';
        this.isLoggedIn = false;
        this.isChangingName = false;
        this.init();
    }

    init() {
        // Verificar si ya hay un nombre guardado
        const savedName = localStorage.getItem('kokokPlayerName');
        if (savedName && !this.isChangingName) {
            this.playerName = savedName;
            this.isLoggedIn = true;
            this.showMainMenu();
        } else {
            this.showLoginScreen();
        }

        this.setupLoginListeners();
    }

    setupLoginListeners() {
        const playerNameInput = document.getElementById('playerName');
        const loginBtn = document.getElementById('loginBtn');
        const changeNameBtn = document.getElementById('changeNameBtn');

        // Validar entrada de nombre en tiempo real
        if (playerNameInput) {
            playerNameInput.addEventListener('input', (e) => {
                const name = e.target.value.trim();
                if (loginBtn) {
                    loginBtn.disabled = name.length < 2;
                }
            });

            // Permitir login con Enter
            playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !loginBtn.disabled) {
                    this.handleLogin();
                }
            });
        }

        // Botón de login
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.handleLogin();
            });
        }

        // Botón para cambiar nombre
        if (changeNameBtn) {
            changeNameBtn.addEventListener('click', () => {
                this.showChangeNameDialog();
            });
        }
    }

    handleLogin() {
        const playerNameInput = document.getElementById('playerName');
        const name = playerNameInput.value.trim();

        if (name.length < 2) {
            this.showError('Name must be at least 2 characters long');
            return;
        }

        // Filtrar caracteres especiales problemáticos
        const cleanName = this.sanitizeName(name);
        if (cleanName !== name) {
            playerNameInput.value = cleanName;
        }

        this.playerName = cleanName;
        this.isLoggedIn = true;
        this.isChangingName = false;
        
        // Guardar en localStorage
        localStorage.setItem('kokokPlayerName', cleanName);
        
        // Mostrar mensaje de confirmación si era un cambio de nombre
        if (this.isChangingName) {
            this.showSuccessMessage(`Name successfully changed to "${cleanName}"!`);
        }
        
        this.showMainMenu();
    }

    sanitizeName(name) {
        // Remover caracteres especiales que podrían causar problemas
        return name.replace(/[<>\"'&]/g, '').substring(0, 20);
    }

    showError(message) {
        // Mostrar error temporal
        const loginForm = document.querySelector('.login-form');
        const existingError = document.querySelector('.error-message');
        
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: #ff4444;
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid #ff4444;
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
            font-size: clamp(0.9rem, 2.5vw, 1rem);
            text-align: center;
            animation: fadeIn 0.3s ease-in;
        `;
        errorDiv.textContent = message;

        loginForm.appendChild(errorDiv);

        // Remover error después de 4 segundos
        setTimeout(() => {
            errorDiv.remove();
        }, 4000);
    }

    showSuccessMessage(message) {
        // Mostrar mensaje de éxito temporal
        const loginForm = document.querySelector('.login-form');
        const existingMessage = document.querySelector('.success-message');
        
        if (existingMessage) {
            existingMessage.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            color: #00aa00;
            background: rgba(0, 170, 0, 0.1);
            border: 1px solid #00aa00;
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
            font-size: clamp(0.9rem, 2.5vw, 1rem);
            text-align: center;
            animation: fadeIn 0.3s ease-in;
        `;
        successDiv.textContent = message;

        loginForm.appendChild(successDiv);

        // Remover mensaje después de 3 segundos
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showLoginScreen() {
        this.hideAllScreens();
        document.getElementById('loginScreen').classList.remove('hidden');
        
        // Configurar el input según el contexto
        const playerNameInput = document.getElementById('playerName');
        const loginBtn = document.getElementById('loginBtn');
        const inputLabel = document.querySelector('.input-label');
        
        if (playerNameInput) {
            if (this.isChangingName) {
                // Si es cambio de nombre, pre-llenar con el nombre actual
                playerNameInput.value = this.playerName;
                playerNameInput.select(); // Seleccionar todo el texto
                loginBtn.disabled = false;
                inputLabel.textContent = `Change current name: "${this.playerName}"`;
                loginBtn.innerHTML = '✏️ Confirm Change';
            } else {
                // Si es login nuevo
                playerNameInput.value = '';
                loginBtn.disabled = true;
                inputLabel.textContent = 'What\'s your cockroach name?';
                loginBtn.innerHTML = '🎮 Enter Game';
            }
            playerNameInput.focus();
        }
    }

    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.remove('hidden');
        
        // Mostrar mensaje de bienvenida
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage && this.playerName) {
            welcomeMessage.innerHTML = `
                <div style="
                    background: rgba(255, 215, 0, 0.1);
                    border: 2px solid #FFD700;
                    border-radius: 12px;
                    padding: 18px;
                    margin: 20px 0;
                    color: #FFD700;
                    font-weight: bold;
                    font-size: clamp(1rem, 2.5vw, 1.2rem);
                    text-align: center;
                    animation: slideIn 0.5s ease-out;
                ">
                    Welcome, ${this.playerName}! 🪳
                </div>
            `;
        }
    }

    showChangeNameDialog() {
        // En lugar de usar prompt, volver a la pantalla de login
        this.isChangingName = true;
        this.showLoginScreen();
    }

    hideAllScreens() {
        const screens = ['loginScreen', 'mainMenu', 'instructionsScreen', 'gameOverScreen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('hidden');
            }
        });
    }

    getPlayerName() {
        return this.playerName || 'Anonymous Player';
    }

    isPlayerLoggedIn() {
        return this.isLoggedIn && this.playerName.length > 0;
    }

    logout() {
        this.playerName = '';
        this.isLoggedIn = false;
        this.isChangingName = false;
        localStorage.removeItem('kokokPlayerName');
        this.showLoginScreen();
    }
} 