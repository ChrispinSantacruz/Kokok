# 🚀 Configuración Completa para n8n

## ✅ Lo que ya está configurado:

### 1. **Webhook URL configurada**
```
https://chriscodex1.app.n8n.cloud/webhook-test/1017d610-1159-4eed-b4e7-8644b0f3ace9
```

### 2. **Datos que envía automáticamente cuando el jugador pierde:**

```json
{
  "chatId": "123456789",
  "playerName": "NombreJugador",
  "score": 150,
  "gameTime": "2:30",
  "event": "game_over",
  "timestamp": "2024-01-15T10:30:00Z",
  "gameSession": "unique_session_id",
  "additionalData": {
    "isNewRecord": true,
    "previousHighScore": 120,
    "totalBossesDefeated": 5,
    "powerUpsUsed": ["shield", "speed"],
    "gameVersion": "1.0",
    "platform": "telegram_webapp"
  },
  "userInfo": {
    "userId": "987654321",
    "chatType": "private",
    "isFirstTime": false
  },
  "game": {
    "name": "KOKOK The Roach",
    "version": "1.0",
    "type": "crypto_shooter"
  }
}
```

## 🧪 Para probar tu webhook:

### Ejecutar test desde terminal:
```bash
node test-webhook.js
```

Este script enviará datos de prueba a tu webhook para verificar que todo funciona.

## 🔧 En tu n8n puedes hacer:

### 1. **Filtros por puntuación:**
```javascript
// Puntuación alta (más de 100 puntos)
$json.score > 100

// Nuevo récord
$json.additionalData.isNewRecord === true

// Primer juego del usuario
$json.userInfo.isFirstTime === true
```

### 2. **Mensajes personalizados:**
```javascript
// Para puntuación alta
`🎉 ¡${$json.playerName} logró ${$json.score} puntos! Tiempo: ${$json.gameTime}`

// Para nuevo récord
`🏆 ¡NUEVO RÉCORD! ${$json.playerName} estableció ${$json.score} puntos`

// Para primer jugador
`👋 ¡Bienvenido ${$json.playerName}! Primera partida: ${$json.score} puntos`
```

### 3. **Acciones que puedes automatizar:**
- ✅ Enviar notificaciones a otros chats de Telegram
- ✅ Guardar estadísticas en Google Sheets
- ✅ Enviar emails con las puntuaciones
- ✅ Crear rankings en bases de datos
- ✅ Generar reportes automáticos
- ✅ Integrar con Discord/Slack
- ✅ Activar otros bots o servicios

## 📊 Datos importantes para automatización:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `chatId` | ID del chat de Telegram | "123456789" |
| `playerName` | Nombre del jugador | "Juan Pérez" |
| `score` | Puntuación obtenida | 150 |
| `gameTime` | Tiempo de juego | "2:30" |
| `isNewRecord` | Si es nuevo récord | true/false |
| `isFirstTime` | Si es primer juego | true/false |
| `platform` | Plataforma usada | "telegram_webapp" |
| `chatType` | Tipo de chat | "private"/"group" |

## 🎯 Próximos pasos:

1. **Prueba el webhook:** Ejecuta `node test-webhook.js`
2. **Configura tu flujo en n8n** usando los datos que recibes
3. **Juega una partida** para ver los datos reales
4. **Personaliza las automatizaciones** según tus necesidades

## 🔍 Debug:

Si quieres ver qué datos se están enviando, abre la consola del navegador (F12) cuando juegues y verás logs como:
```
Datos enviados a n8n webhook correctamente: { ... }
```

¡Tu automatización está lista! 🎮🤖 