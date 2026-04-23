import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as child_process from 'child_process';
import Store from 'electron-store';

const store = new Store();

// Define exactly what variables are required
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'PORT'
];

let mainWindow: BrowserWindow | null = null;
let setupWindow: BrowserWindow | null = null;
let fastifyProcess: child_process.ChildProcess | null = null;
let nextProcess: child_process.ChildProcess | null = null;

function checkEnvVarsSettled() {
  const currentEnv = store.get('env') as Record<string, string> || {};
  return REQUIRED_VARS.every(v => !!currentEnv[v]);
}

function createSetupWindow() {
  if (setupWindow) {
    setupWindow.focus();
    return;
  }
  setupWindow = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  setupWindow.loadFile(path.join(__dirname, '../public/setup.html'));
  setupWindow.on('closed', () => {
    setupWindow = null;
  });
}

function createAppMenu() {
  const template = [
    {
      label: 'TriggerForge',
      submenu: [
        {
          label: 'Setup Environment',
          click: () => {
            createSetupWindow();
          }
        },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Wait for the Next.js server to come up
  const nextPort = Number((store.get('env') as any)?.FRONTEND_PORT) || 3000;

  // We ping the next server until it's ready, then load
  const pingNext = () => {
    fetch(`http://localhost:${nextPort}`)
      .then(res => {
        if (res.ok) {
          mainWindow?.loadURL(`http://localhost:${nextPort}`);
          mainWindow?.show();
        } else {
          if (mainWindow) setTimeout(pingNext, 500);
        }
      })
      .catch(() => {
        if (mainWindow) setTimeout(pingNext, 500);
      });
  };
  pingNext();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendProcesses() {
  const envConfig = store.get('env') as Record<string, string>;
  const mergedEnv = { ...process.env, ...envConfig };

  if (fastifyProcess) {
    fastifyProcess.kill();
    fastifyProcess = null;
  }
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }

  if (!app.isPackaged) {
    // In Dev Mode: Use npm run dev inside their respective folders
    const serverDir = path.resolve(__dirname, '../../server');
    const webDir = path.resolve(__dirname, '../../web');

    // 1. Fastify Backend
    console.log('Starting Fastify Dev Server at:', serverDir);
    fastifyProcess = child_process.spawn('npm', ['run', 'dev'], { env: mergedEnv, cwd: serverDir, shell: true });
    fastifyProcess.on('error', (err) => console.error('Fastify Dev Error:', err));

    // 2. NextJS Frontend
    const nextPort = Number(envConfig.FRONTEND_PORT) || 3000;
    const nextEnv = { ...mergedEnv, PORT: nextPort.toString() };
    console.log('Starting Next.js Dev Server at:', webDir);
    nextProcess = child_process.spawn('npm', ['run', 'dev'], { env: nextEnv, cwd: webDir, shell: true });
    nextProcess.on('error', (err) => console.error('Next.js Dev Error:', err));

  } else {
    // In Packaged Prod Mode
    // 1. Fastify Backend
    const serverPath = path.join(process.resourcesPath, 'server-app/apps/server/src/index.js');
    const fastifyCwd = path.join(process.resourcesPath, 'server-app/apps/server');

    console.log('Starting Fastify Server at:', serverPath, 'in', fastifyCwd);
    fastifyProcess = child_process.fork(serverPath, [], { env: mergedEnv, cwd: fastifyCwd });
    fastifyProcess.on('error', (err) => console.error('Fastify Process Error:', err));

    // 2. Next.js Frontend Server
    const nextPort = Number(envConfig.FRONTEND_PORT) || 3000;
    const nextEnv = { ...mergedEnv, PORT: nextPort.toString() };
    const nextAppPath = path.join(process.resourcesPath, 'next-app/server.js');
    const nextCwd = path.join(process.resourcesPath, 'next-app');

    console.log('Starting Next.js Server at:', nextAppPath, 'in', nextCwd);
    nextProcess = child_process.fork(nextAppPath, [], { env: nextEnv, cwd: nextCwd });
    nextProcess.on('error', (err) => console.error('Next.js Process Error:', err));
  }
}

app.whenReady().then(() => {
  createAppMenu();

  if (!checkEnvVarsSettled()) {
    createSetupWindow();
  } else {
    startBackendProcesses();
    createMainWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (!checkEnvVarsSettled()) createSetupWindow();
      else createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (fastifyProcess) fastifyProcess.kill();
  if (nextProcess) nextProcess.kill();
});

ipcMain.on('save-env', (event, newEnv) => {
  store.set('env', newEnv);
  if (setupWindow) {
    setupWindow.close();
  }
  // Reflect changes immediately: restart processes and re-create main window
  if (mainWindow) {
    mainWindow.close();
  }
  startBackendProcesses();
  createMainWindow();
});

ipcMain.handle('get-env', () => {
  return store.get('env') || {};
});
