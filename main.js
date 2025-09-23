// main.js (corrigido e simplificado para debug)
const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuiting = false;

// --- resolve ícone do tray ---
function resolveIconPath() {
  const candidates = process.platform === 'win32'
    ? ['icon.ico', 'icon.png', path.join('iconset','icon_32x32.png')]
    : ['icon.png', path.join('iconset','icon_32x32.png'), 'icon.ico'];

  for (const c of candidates) {
    const full = path.join(__dirname, c);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

// --- cria janela ---
function createWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 420,
    height: 600,
    frame: false,
    resizable: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const indexPath = path.join(__dirname, 'index.html');
  console.log("🔗 Carregando HTML:", indexPath);

  mainWindow.loadFile(indexPath).catch(err =>
    console.error("❌ Erro ao carregar index.html:", err)
  );

  mainWindow.once('ready-to-show', () => {
    console.log("🔷 Janela pronta para mostrar.");
    mainWindow.show();
    mainWindow.webContents.openDevTools(); // abre DevTools para confirmar CSS
  });

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      console.log("🟨 Fechar interceptado → ocultando janela.");
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    console.log("⚠️ Janela destruída.");
    mainWindow = null;
  });
}

// --- criar tray ---
function createTray() {
  const iconPath = resolveIconPath();
  try {
    const icon = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
    tray = new Tray(icon);
    console.log("✅ Tray criado com ícone:", iconPath || 'nenhum');
  } catch (err) {
    console.warn("⚠️ Tray sem ícone:", err.message);
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar/Ocultar', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Sair', click: () => { isQuiting = true; app.quit(); } }
  ]);
  tray.setToolTip('TaskMaster - Suas tarefas rápidas');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleWindow());
}

// --- toggle window ---
function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// --- atalhos globais ---
function registerShortcuts() {
  const shortcuts = ['CommandOrControl+Alt+T', 'CommandOrControl+Shift+Y'];
  shortcuts.forEach(key => {
    const ok = globalShortcut.register(key, () => {
      console.log(`⌨️ Atalho ${key} acionado.`);
      toggleWindow();
    });
    console.log(ok ? `✅ Registrado: ${key}` : `⚠️ Não registrado: ${key}`);
  });
}

// --- single instance ---
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// --- handlers ---
process.on('uncaughtException', err => console.error("❌ Uncaught:", err));
process.on('unhandledRejection', reason => console.error("❌ Rejection:", reason));

// --- app lifecycle ---
app.whenReady().then(() => {
  console.log("🚀 App iniciado.");
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

app.on('before-quit', () => {
  isQuiting = true;
});
const { ipcMain } = require('electron');

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});
