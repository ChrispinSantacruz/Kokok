/**
 * Sistema de Responsividad Dinámico para KOKOK The Roach
 * Detecta el tamaño de pantalla y aplica ajustes en tiempo real
 */

class ResponsiveHandler {
    constructor() {
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            laptop: 1024,
            desktop: 1440,
            ultrawide: 2560
        };
        
        this.currentBreakpoint = null;
        this.gameCanvas = null;
        this.gameContainer = null;
        
        this.init();
    }
    
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameContainer = document.getElementById('gameContainer');
        
        // Detectar tamaño inicial
        this.detectScreenSize();
        
        // Escuchar cambios de tamaño
        window.addEventListener('resize', this.debounce(() => {
            this.detectScreenSize();
            this.adjustGameLayout();
        }, 250));
        
        // Escuchar cambios de orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectScreenSize();
                this.adjustGameLayout();
            }, 100);
        });
        
        // Aplicar ajustes iniciales
        this.adjustGameLayout();
        
        console.log('🎮 Sistema de responsividad inicializado');
    }
    
    detectScreenSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        
        let newBreakpoint;
        
        if (width <= this.breakpoints.mobile) {
            newBreakpoint = 'mobile';
        } else if (width <= this.breakpoints.tablet) {
            newBreakpoint = 'tablet';
        } else if (width <= this.breakpoints.laptop) {
            newBreakpoint = 'laptop';
        } else if (width <= this.breakpoints.desktop) {
            newBreakpoint = 'desktop';
        } else {
            newBreakpoint = 'ultrawide';
        }
        
        // Solo aplicar cambios si el breakpoint cambió
        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            document.body.className = document.body.className.replace(/breakpoint-\w+/g, '');
            document.body.classList.add(`breakpoint-${newBreakpoint}`);
            
            console.log(`📱 Breakpoint cambiado a: ${newBreakpoint} (${width}x${height}, DPR: ${pixelRatio})`);
        }
        
        // Detectar pantallas de alta densidad
        if (pixelRatio >= 2) {
            document.body.classList.add('high-dpi');
        } else {
            document.body.classList.remove('high-dpi');
        }
        
        // Detectar orientación
        const isLandscape = width > height;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
    }
    
    adjustGameLayout() {
        if (!this.gameCanvas || !this.gameContainer) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const aspectRatio = 4/3;
        
        let canvasWidth, canvasHeight;
        
        switch (this.currentBreakpoint) {
            case 'mobile':
                canvasWidth = Math.min(viewportWidth * 0.95, 400);
                canvasHeight = canvasWidth / aspectRatio;
                break;
                
            case 'tablet':
                canvasWidth = Math.min(viewportWidth * 0.85, 600);
                canvasHeight = canvasWidth / aspectRatio;
                break;
                
            case 'laptop':
                // Tamaño fijo más consistente para laptops
                canvasWidth = 800;
                canvasHeight = 600;
                break;
                
            case 'desktop':
                // Tamaño fijo más consistente para desktop
                canvasWidth = 900;
                canvasHeight = 675;
                break;
                
            case 'ultrawide':
                // Tamaño fijo más consistente para ultrawide
                canvasWidth = 1000;
                canvasHeight = 750;
                break;
                
            default:
                canvasWidth = 800;
                canvasHeight = 600;
        }
        
        // Asegurar que no exceda la altura/ancho de la ventana (solo para móviles/tablets)
        if (this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet') {
            const maxHeight = viewportHeight * 0.85;
            const maxWidth = viewportWidth * 0.95;
            
            if (canvasHeight > maxHeight) {
                canvasHeight = maxHeight;
                canvasWidth = canvasHeight * aspectRatio;
            }
            
            if (canvasWidth > maxWidth) {
                canvasWidth = maxWidth;
                canvasHeight = canvasWidth / aspectRatio;
            }
        } else {
            // Para desktop, mantener tamaños máximos como respaldo
            const maxHeight = viewportHeight * 0.90;
            const maxWidth = viewportWidth * 0.90;
            
            if (canvasHeight > maxHeight) {
                canvasHeight = maxHeight;
                canvasWidth = canvasHeight * aspectRatio;
            }
            
            if (canvasWidth > maxWidth) {
                canvasWidth = maxWidth;
                canvasHeight = canvasWidth / aspectRatio;
            }
        }
        
        // Aplicar tamaños mínimos solo para móviles/tablets
        if (this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet') {
            canvasWidth = Math.max(canvasWidth, 320);
            canvasHeight = Math.max(canvasHeight, 240);
        }
        
        // Actualizar el canvas si existe el juego Phaser
        if (window.game && window.game.scale) {
            window.game.scale.resize(canvasWidth, canvasHeight);
        }
        
        console.log(`🎯 Canvas ajustado a: ${Math.round(canvasWidth)}x${Math.round(canvasHeight)}`);
    }
    
    // Función auxiliar para debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Método público para obtener información del dispositivo
    getDeviceInfo() {
        return {
            breakpoint: this.currentBreakpoint,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            pixelRatio: window.devicePixelRatio || 1,
            isHighDPI: window.devicePixelRatio >= 2,
            isTouchDevice: 'ontouchstart' in window,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };
    }
}

// Inicializar el sistema de responsividad
const responsiveHandler = new ResponsiveHandler();

// Hacer disponible globalmente para debugging
window.responsiveHandler = responsiveHandler;

// Agregar estilos CSS dinámicos basados en el breakpoint
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    /* Estilos dinámicos para diferentes breakpoints */
    .breakpoint-mobile #gameCanvas {
        border-width: 2px !important;
    }
    
    .breakpoint-tablet #gameCanvas {
        border-width: 3px !important;
    }
    
    .breakpoint-laptop #gameCanvas {
        border-width: 4px !important;
    }
    
    .breakpoint-desktop #gameCanvas {
        border-width: 5px !important;
    }
    
    .breakpoint-ultrawide #gameCanvas {
        border-width: 6px !important;
    }
    
    .high-dpi #gameCanvas {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
    
    .landscape.breakpoint-mobile #mobileControls {
        flex-direction: row;
        justify-content: space-between;
        padding: 5px 10px;
    }
`;

document.head.appendChild(dynamicStyles); 