const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

// Criar janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 600,
    frame: false,          // sem borda
    resizable: false,      // tamanho fixo
    transparent: true,     // permite cantos arredondados
    hasShadow: true,       // sombra da janela
    alwaysOnTop: false,    // se quiser sempre visível, mude para true
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Criar ícone na bandeja (system tray)
function createTray() {
  const iconPath = path.join(__dirname, 'icon.png'); // adicione um ícone PNG pequeno (16x16 ou 32x32)
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar/Ocultar',
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('TaskMaster - Suas tarefas rápidas');
  tray.setContextMenu(contextMenu);

  // Clique simples no tray também abre/fecha
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

// Registrar atalhos globais
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Alt+T', () => {
    if (!mainWindow) {
      createWindow();
    } else {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

// Inicialização
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
