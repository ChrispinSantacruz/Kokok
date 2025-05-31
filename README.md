# KOKOK The Roach - Crypto Shooter Game 🪳🎮

Un juego de disparos donde controlas una cucaracha que debe derrotar a jefes famosos mientras recoges power-ups.

## 🚀 Características

- **Jefes únicos**: Trump (bombas) y Elon (cohetes)
- **Power-ups especiales**: Escudos, velocidad y vidas extra
- **Integración con Telegram**: Comparte automáticamente las puntuaciones
- **Automatización n8n**: Compatible con flujos de automatización
- **Responsive**: Funciona en móviles y desktop

## 📦 Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Token del bot de Telegram (obtén uno con @BotFather)
TELEGRAM_BOT_TOKEN=tu_token_del_bot_aqui

# URL donde está desplegado el juego
GAME_URL=https://tu-dominio.vercel.app

# Puerto del servidor (para desarrollo local)
PORT=3000
```

### 2. Bot de Telegram

1. Contacta a [@BotFather](https://t.me/BotFather) en Telegram
2. Crea un nuevo bot con `/newbot`
3. Copia el token y ponlo en `TELEGRAM_BOT_TOKEN`
4. Configura el Web App del bot:
   ```
   /setdomain
   Selecciona tu bot
   Ingresa tu dominio: tu-dominio.vercel.app
   ```

### 3. Instalación y Despliegue

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm start

# O usar node directamente
node server.js
```

## 🤖 Integración con n8n

### Endpoints Disponibles

#### 1. Webhook de Puntuaciones
```
POST /api/share-score
```

**Body:**
```json
{
  "chatId": "123456789",
  "score": 150,
  "message": "¡Jugador ha conseguido 150 puntos!",
  "playerName": "NombreJugador"
}
```

#### 2. Webhook para n8n
```
POST /api/n8n-webhook
```

**Body:**
```json
{
  "chatId": "123456789",
  "playerName": "NombreJugador",
  "score": 150,
  "gameTime": "2:30",
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "game_over"
}
```

### Configuración en n8n

1. **Webhook Node**: Escucha en `/api/n8n-webhook`
2. **Procesamiento**: Maneja los datos de la partida
3. **Acciones**: Envía notificaciones, guarda estadísticas, etc.

## 🎮 Cómo Funciona

1. **Inicio**: El jugador inicia el juego desde Telegram
2. **Juego**: Controla la cucaracha para derrotar jefes
3. **Game Over**: Automáticamente se envía la puntuación al chat
4. **n8n**: Recibe los datos para procesamiento adicional

## 📱 Controles

- **PC**: Flechas para mover, Espacio para disparar
- **Móvil**: Controles táctiles en pantalla

## 🔧 Desarrollo

```bash
# Estructura del proyecto
├── public/
│   ├── js/           # Lógica del juego
│   ├── assets/       # Imágenes y recursos
│   └── index.html    # Página principal
├── server.js         # Servidor backend
└── package.json      # Dependencias
```

## 🌐 Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Despliega automáticamente

## 📊 API Reference

### Game Events

El juego envía eventos automáticamente cuando:
- El jugador pierde (`game_over`)
- Se alcanza una nueva puntuación máxima (`new_record`)
- Se derrota un jefe (`boss_defeated`)

Estos eventos pueden ser capturados por n8n para crear automatizaciones personalizadas.
