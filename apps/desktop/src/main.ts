import { app, BrowserWindow, ipcMain } from 'electron';
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
  setupWindow = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  setupWindow.loadFile(path.join(__dirname, '../public/setup.html'));
}

async function createMainWindow() {
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
          setTimeout(pingNext, 500);
        }
      })
      .catch(() => setTimeout(pingNext, 500));
  };
  pingNext();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendProcesses() {
  const envConfig = store.get('env') as Record<string, string>;
  const mergedEnv = { ...process.env, ...envConfig };
  
  // 1. Spawning Fastify Backend Server
  const serverPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'server-app/apps/server/src/index.js') // depends on how bundled
    : path.resolve(__dirname, '../../server/dist/apps/server/src/index.js');

  console.log('Starting Fastify Server at:', serverPath);
  fastifyProcess = child_process.fork(serverPath, [], { env: mergedEnv });

  fastifyProcess.on('error', (err) => {
    console.error('Fastify Process Error:', err);
  });

  // 2. Spawning Next.js Frontend Server
  const nextPort = Number(envConfig.FRONTEND_PORT) || 3000;
  const nextEnv = { ...mergedEnv, PORT: nextPort.toString() };
  
  const nextAppPath = app.isPackaged
    ? path.join(process.resourcesPath, 'next-app/server.js')
    : path.resolve(__dirname, '../../web/.next/standalone/apps/web/server.js');

  console.log('Starting Next.js Server at:', nextAppPath);
  nextProcess = child_process.fork(nextAppPath, [], { env: nextEnv });

  nextProcess.on('error', (err) => {
    console.error('Next.js Process Error:', err);
  });
}

app.whenReady().then(() => {
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
  startBackendProcesses();
  createMainWindow();
});

ipcMain.handle('get-env', () => {
  return store.get('env') || {};
});
