const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Variables globales
let mainWindow;
let isDev = process.argv.includes('--dev');

// Configuración de la aplicación
const APP_CONFIG = {
  width: 1200,
  height: 800,
  minWidth: 900,
  minHeight: 600,
  title: 'EcoTrak App - Sistema de Gestión de Reciclaje'
};

/**
 * Crear ventana principal
 */
function createMainWindow() {
  console.log('🚀 Creando ventana principal...');
  
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.width,
    height: APP_CONFIG.height,
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    title: APP_CONFIG.title,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      enableRemoteModule: false,
      webSecurity: true, // DEBE ser true para evitar warnings
      preload: path.join(__dirname, '../services/preload.js')
    },
    icon: path.join(__dirname, '../../assets/icons/icon2.ico'),
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    frame: true,
    backgroundColor: '#f0fdf4' // Color de fondo verde suave
  });

  const preloadPath = path.join(__dirname, '../services/preload.js');
  console.log('🔍 Ruta preload completa:', preloadPath);

  const fs = require('fs');
  console.log('📁 Archivo preload existe:', fs.existsSync(preloadPath));

  if (!fs.existsSync(preloadPath)) {
    console.error('❌ ARCHIVO PRELOAD NO ENCONTRADO en:', preloadPath);
  } 

  // Cargar la interfaz
  const htmlPath = path.join(__dirname, '../renderer/index.html');
  console.log('📄 Cargando HTML desde:', htmlPath);
  
  mainWindow.loadFile(htmlPath);

  // Mostrar cuando esté listo
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Ventana principal lista');
    mainWindow.show();
    
    // Abrir DevTools en modo desarrollo
    if (isDev) {
      mainWindow.webContents.openDevTools();
      console.log('🔧 DevTools abierto (modo desarrollo)');
    }
  });

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    console.log('❌ Ventana principal cerrada');
    mainWindow = null;
  });

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Error cargando:', errorCode, errorDescription);
  });

  console.log('✅ Ventana principal creada exitosamente');
}

/**
 * Configurar menú de la aplicación
 */
function setupMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Abrir DevTools',
            accelerator: 'F12',
            click: () => {
                mainWindow.webContents.openDevTools();
              }
        },
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom Actual',
          role: 'resetzoom'
        },
        {
          label: 'Acercar',
          role: 'zoomin'
        },
        {
          label: 'Alejar',
          role: 'zoomout'
        },
        { type: 'separator' },
        {
          label: 'Pantalla Completa',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        { type: 'separator' },
        {
          label: 'Acerca de EcoTrak',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de EcoTrak Desktop',
              message: 'EcoTrak App v1.0.0',
              detail: 'Sistema de gestión de reciclaje para escritorio.\n\nDesarrollado Por Jafet sanchez ruiz.\n\n© 2025',
              icon: path.join(__dirname, '../../assets/icons/icon3.ico')
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  console.log('🎯 Menú configurado exitosamente');
}

/**
 * Inicializar aplicación
 */
app.whenReady().then(() => {
  console.log('🚀 Aplicación Electron iniciando...');
  console.log('📁 Directorio de trabajo:', __dirname);
  console.log('🏠 Directorio home:', os.homedir());
  console.log('💻 Plataforma:', process.platform);
  console.log('🔧 Modo desarrollo:', isDev);
  
  createMainWindow();
  setupMenu();

  // En macOS, recrear ventana cuando se hace clic en el dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
  
  console.log('✅ Aplicación iniciada exitosamente');
});

/**
 * Cerrar aplicación cuando todas las ventanas están cerradas
 */
app.on('window-all-closed', () => {
  console.log('🔒 Todas las ventanas cerradas');
  
  // En macOS, mantener la aplicación corriendo
  if (process.platform !== 'darwin') {
    console.log('👋 Cerrando aplicación');
    app.quit();
  }
});

/**
 * Manejar segundo intento de abrir la aplicación
 */
app.on('second-instance', () => {
  console.log('⚡ Segunda instancia detectada');
  
  // Enfocar la ventana existente
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

/**
 * Prevenir múltiples instancias
 */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('❌ Ya existe una instancia corriendo');
  app.quit();
} else {
  console.log('🔐 Lock obtenido - instancia única');
}

/**
 * Configuración de seguridad
 */
app.on('web-contents-created', (event, contents) => {
  // Prevenir navegación a sitios externos
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      console.log('🚫 Navegación externa bloqueada:', navigationUrl);
      event.preventDefault();
    }
  });
});

console.log('📋 Proceso principal configurado exitosamente');