// main.js

const { app, screen, BrowserWindow, BrowserView, ipcMain, session, shell, dialog } = require('electron');

const path = require('path');
const fs = require('fs');
const os = require('os');

// --- Debounce Utility ---
function debounce(func, wait) {
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

// --- Environment & Security Configuration ---

// 1. Environment Detection
const isDev = !app.isPackaged;

// 2. Hardware Acceleration (Re-enabled for performance)
// app.disableHardwareAcceleration(); // Commented out to fix resize flickering issue.

// 3. Command Line Switches
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('no-proxy-server');

// Development-only switches
if (isDev) {
  console.log('Running in development mode. Applying insecure workarounds.');
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

// 4. Certificate Error Handler
if (isDev) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    console.log(`[DEV ONLY] Certificate error for ${url}: ${error}`);
    event.preventDefault();
    callback(true);
  });
}

// --- Application Setup ---
app.setPath('userData', path.join(__dirname, 'userData'));

// --- Widevine CDM Injection ---
function getWidevinePath() {
    const platform = os.platform();
    const arch = os.arch();
    let widevinePath = '';
    const paths = {
        'win32': `${os.homedir()}/AppData/Local/Google/Chrome/User Data/WidevineCdm`,
        'darwin': `${os.homedir()}/Library/Application Support/Google/Chrome/WidevineCdm`,
        'linux': `${os.homedir()}/.config/google-chrome/WidevineCdm`
    };
    if (paths[platform]) {
        if (!fs.existsSync(paths[platform])) return null;
        const versions = fs.readdirSync(paths[platform]).filter(f => fs.statSync(`${paths[platform]}/${f}`).isDirectory());
        if (versions.length > 0) {
            const latestVersion = versions.sort().pop();
            let cdmPath = '';
            if (platform === 'win32') cdmPath = `${paths[platform]}/${latestVersion}/_platform_specific/win_${arch === 'x64' ? 'x64' : 'x86'}/widevinecdm.dll`;
            else if (platform === 'darwin') cdmPath = `${paths[platform]}/${latestVersion}/_platform_specific/mac_${arch}/libwidevinecdm.dylib`;
            else if (platform === 'linux') cdmPath = `${paths[platform]}/${latestVersion}/_platform_specific/linux_${arch}/libwidevinecdm.so`;
            if (fs.existsSync(cdmPath)) return { path: cdmPath, version: latestVersion };
        }
    }
    return null;
}
const widevineInfo = getWidevinePath();
if (widevineInfo) {
    app.commandLine.appendSwitch('widevine-cdm-path', widevineInfo.path);
    app.commandLine.appendSwitch('widevine-cdm-version', widevineInfo.version);
} else {
    console.error('Widevine CDM not found.');
}

let mainWindow;
let view;
let currentThemeCss = `:root { --primary-bg: #1e1e2f; --accent-color: #3a3d5b; --highlight-color: #ff6768; }`;
const scrollbarCss = fs.readFileSync(path.join(__dirname, 'assets', 'css', 'view-style.css'), 'utf8');

// --- Pre-rendering Logic ---
const preloadedViews = new Map(); // Stores fully rendered BrowserViews
const dramaSites = [
    'https://www.netflixgc.com/',
    'https://www.7.movie/',
    'https://kunzejiaoyu.net/',
    'https://gaze.run/'
];

async function preloadSites() {
    console.log('Starting pre-rendering of drama sites...');
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const url of dramaSites) {
        try {
            console.log(`Pre-rendering ${url}`);
            const ghostView = new BrowserView({
                webPreferences: {
                    contextIsolation: true,
                    nodeIntegration: false,
                    preload: path.join(__dirname, 'assets', 'js', 'preload-web.js'),
                    plugins: true
                }
            });

            const loadPromise = new Promise((resolve, reject) => {
                const handleFinish = () => {
                    cleanup();
                    resolve();
                };
                const handleFail = (event, errorCode, errorDescription) => {
                    cleanup();
                    if (errorCode !== -3) { // -3 is ABORTED
                       reject(new Error(`ERR_FAILED (${errorCode}) loading '${url}': ${errorDescription}`));
                    } else {
                       resolve();
                    }
                };
                const cleanup = () => {
                    ghostView.webContents.removeListener('did-finish-load', handleFinish);
                    ghostView.webContents.removeListener('did-fail-load', handleFail);
                };

                ghostView.webContents.on('did-finish-load', handleFinish);
                ghostView.webContents.on('did-fail-load', handleFail);
                ghostView.webContents.loadURL(url);
            });

            await loadPromise;
            preloadedViews.set(url, ghostView); // Store the fully rendered view
            console.log(`Finished pre-rendering ${url}`);
        } catch (error) {
            console.error(`Failed to pre-render ${url}:`, error);
        }
        await delay(500);
    }
    console.log('Pre-rendering complete.');
}

function attachViewEvents(targetView) {
  if (!targetView || !targetView.webContents || targetView.webContents.isDestroyed()) {
    return;
  }

  targetView.webContents.on('dom-ready', () => {
    if (targetView && targetView.webContents && !targetView.webContents.isDestroyed()) {
      const combinedCss = currentThemeCss + '\n' + scrollbarCss;
      targetView.webContents.insertCSS(combinedCss);
      updateViewBounds(true);
      updateZoomFactor(targetView); // Set initial zoom
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('load-finished');
      }
    }
  });

  targetView.webContents.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
    if (isMainFrame && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('url-updated', url);
    }
  });

  targetView.webContents.on('did-navigate', (event, url) => {
    console.log('Page navigated to:', url);
    if (url.includes('iqiyi.com/v_') && url.includes('.html')) {
      console.log('iQiyi redirected to correct video page:', url);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('url-updated', url);
      }
    }
  });

  targetView.webContents.on('did-navigate-in-page', (event, url) => {
    console.log('Page navigated in-page to:', url);
  });

  targetView.webContents.setWindowOpenHandler(({ url }) => {
    if (targetView && targetView.webContents && !targetView.webContents.isDestroyed()) {
      console.log(`[WindowOpenHandler] Intercepted new window for URL: ${url}. Loading in current view and forcing re-parse.`);
      targetView.webContents.loadURL(url);
      updateViewBounds(true); 
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('fast-parse-url', url);
      }
    }
    return { action: 'deny' };
  });

  const updateNavigationState = () => {
    if (mainWindow && !mainWindow.isDestroyed() && targetView && targetView.webContents && !targetView.webContents.isDestroyed()) {
      const navState = {
        canGoBack: targetView.webContents.canGoBack(),
        canGoForward: targetView.webContents.canGoForward()
      };
      mainWindow.webContents.send('nav-state-updated', navState);
    }
  };
  targetView.webContents.on('did-navigate', updateNavigationState);
  targetView.webContents.on('did-navigate-in-page', updateNavigationState);
}

function updateViewBounds(isVisible = true) {
  if (!mainWindow || !view) return;
  const isFullScreen = mainWindow.isFullScreen();
  if (isFullScreen) {
    const bounds = mainWindow.getBounds();
    view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
  } else {
    const contentBounds = mainWindow.getContentBounds();
    const sidebarWidth = 240;
    const topBarHeight = 56;
    
    if (isVisible) {
      view.setBounds({
        x: sidebarWidth,
        y: topBarHeight,
        width: contentBounds.width - sidebarWidth,
        height: contentBounds.height - topBarHeight
      });
    } else {
      view.setBounds({ x: sidebarWidth, y: topBarHeight, width: 0, height: 0 });
    }
  }
}

function updateZoomFactor(targetView) {
  if (!targetView || !targetView.webContents || targetView.webContents.isDestroyed()) {
    return;
  }
  const viewBounds = targetView.getBounds();
  const viewWidth = viewBounds.width;
  if (viewWidth > 0) {
    const idealWidth = 1400; // Assumed ideal width for video websites
    const zoomFactor = viewWidth / idealWidth;
    targetView.webContents.setZoomFactor(zoomFactor);
    console.log(`[Zoom] View width is ${viewWidth}, setting zoom to ${zoomFactor.toFixed(2)}`);
  }
}

function createNewBrowserView() {
  const newView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'assets', 'js', 'preload-web.js'),
      plugins: true
    }
  });
  attachViewEvents(newView);
  return newView;
}

function createWindow () {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const initialWidth = Math.min(1440, Math.round(workAreaSize.width * 0.8));
  const initialHeight = Math.min(1000, Math.round(workAreaSize.height * 0.85));

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth: 940,
    minHeight: 620,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e2f',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'assets', 'js', 'preload-ui.js')
    },
    title: "AudioVisual",
    icon: path.join(__dirname, 'assets', 'images', 'icon.png')
  });

  mainWindow.loadFile('index.html');
  if (isDev) {
     mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  mainWindow.setMenu(null);

  view = createNewBrowserView();
  mainWindow.setBrowserView(view);
  updateViewBounds(false);

  ipcMain.on('minimize-window', () => mainWindow.minimize());
  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('close-window', () => mainWindow.close());
  
  ipcMain.on('set-view-visibility', (event, visible) => {
    if (visible) {
      updateViewBounds(true);
    } else {
      if (view) {
        console.log('[SetVisibility] Hiding view by destroying it to stop audio.');
        mainWindow.removeBrowserView(view);
        if (view.webContents && !view.webContents.isDestroyed()) {
          view.webContents.destroy();
        }
        view = null;
      }
    }
  });

   ipcMain.on('navigate', async (event, { url, isPlatformSwitch, themeVars }) => {
    if (themeVars) {
        currentThemeCss = `:root { ${Object.entries(themeVars).map(([key, value]) => `${key}: ${value}`).join('; ')} }`;
    }
    console.log(`[Navigate] Received request for ${url}.`);
    if (view) {
        mainWindow.removeBrowserView(view);
        if (view.webContents && !view.webContents.isDestroyed()) {
            view.webContents.destroy();
        }
        console.log('[Navigate] Old BrowserView destroyed.');
    }
    if (preloadedViews.has(url)) {
        console.log(`[Navigate] Using pre-rendered view for ${url}.`);
        view = preloadedViews.get(url);
        preloadedViews.delete(url);
    } else {
        console.log(`[Navigate] Creating a fresh BrowserView for ${url}.`);
        view = createNewBrowserView();
    }
    mainWindow.setBrowserView(view);
    updateViewBounds(false);
    if (isPlatformSwitch) {
        await view.webContents.session.clearStorageData({ storages: ['cookies'] });
    }
    view.webContents.loadURL(url);
    console.log(`[Navigate] Loading URL: ${url}`);
});

  ipcMain.on('go-back', () => {
    if (view && view.webContents.canGoBack()) view.webContents.goBack();
  });
  ipcMain.on('go-forward', () => {
    if (view && view.webContents.canGoForward()) view.webContents.goForward();
  });

  ipcMain.on('proactive-parse-request', (event, url) => {
    console.log('[main.js] Received proactive parse request for:', url);
    updateViewBounds(true);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('fast-parse-url', url);
    }
  });

  ipcMain.on('embed-video', (event, url) => {
    if (view) {
      const script = `
        (() => {
          if (window.voidPlayerGuardian) {
            clearInterval(window.voidPlayerGuardian);
            console.log('[Guardian] Cleared previous guardian interval.');
          }
          const iframeId = 'void-player-iframe';
          const iframeSrc = "${url}";
          const playerContainerSelectors = ['.iqp-player', '#flashbox', '.txp_player_video_wrap', '#bilibili-player', '.mango-layer', '#mgtv-player', '.mgtv-player', '.player-wrap', '#player-container', '#player', '.player-container', '.player-view'];
          const nuisanceSelectors = [
            '#playerPopup', '#vipCoversBox', 'div.iqp-player-vipmask', 
            'div.iqp-player-paymask', 'div.iqp-player-loginmask', 
            'div[class^=qy-header-login-pop]', '.covers_cloudCover__ILy8R',
            '#videoContent > div.loading_loading__vzq4j', '.iqp-player-guide',
            'div.m-iqyGuide-layer', '.loading_loading__vzq4j',
            '[class*="XPlayer_defaultCover__"]', '.iqp-controller'
          ];
          const nativeVideoSelectors = ['video', '.txp_video_container', '._ControlBar_1fux8_5', '.ControlBar', '[class*="ControlBar"]'];
          window.voidPlayerGuardian = setInterval(() => {
            document.querySelectorAll(nuisanceSelectors.join(',')).forEach(el => {
              if (el.style.display !== 'none') el.style.display = 'none';
            });
            document.querySelectorAll(nativeVideoSelectors.join(',')).forEach(el => {
              if (el.style.display !== 'none') el.style.display = 'none';
              if (el.tagName === 'VIDEO' && !el.paused) el.pause();
            });
            let playerContainer = null;
            for (const selector of playerContainerSelectors) {
              playerContainer = document.querySelector(selector);
              if (playerContainer) break;
            }
            if (playerContainer) {
              if (window.getComputedStyle(playerContainer).position === 'static') {
                playerContainer.style.position = 'relative';
              }
              let iframe = document.getElementById(iframeId);
              if (!iframe || iframe.src !== iframeSrc) {
                if (iframe) iframe.remove();
                iframe = document.createElement('iframe');
                iframe.id = iframeId;
                iframe.src = iframeSrc;
                Object.assign(iframe.style, { 
                  position: 'absolute', top: '0', left: '0', 
                  width: '100%', height: '100%', 
                  border: 'none', zIndex: '9999' 
                });
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                playerContainer.appendChild(iframe);
                console.log('[Guardian] Player iframe was missing or invalid. Re-created.');
              }
            } else {
               console.warn('[Guardian] Player container not found on this cycle.');
            }
          }, 250);
        })();
      `;
      view.webContents.executeJavaScript(script).catch(err => console.error('Failed to execute guardian script:', err));
    }
  });

  const debouncedUpdateZoom = debounce(updateZoomFactor, 150);

  const handleResize = () => {
    const isVisible = view && view.getBounds().width > 0;
    updateViewBounds(isVisible); // Update bounds immediately
    if (isVisible) {
      debouncedUpdateZoom(view); // Debounce zoom factor updates
    }
  };

  mainWindow.on('resize', handleResize);
  mainWindow.on('enter-full-screen', handleResize);
  mainWindow.on('leave-full-screen', () => setTimeout(handleResize, 50));
  
  mainWindow.on('minimize', () => {
    if (view) {
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  });
  
  mainWindow.on('restore', () => {
    if (view) {
      updateViewBounds(true);
      setTimeout(() => {
        if (view && view.webContents) {
          view.webContents.focus();
        }
      }, 100);
    }
  });
  
  mainWindow.on('show', () => {
    if (view) {
      updateViewBounds(true);
      setTimeout(() => {
        if (view && view.webContents) {
          view.webContents.focus();
        }
      }, 100);
    }
  });
}

app.whenReady().then(async () => {
  await session.defaultSession.clearStorageData();
  await session.defaultSession.clearCache();

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
  
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ requestHeaders: details.requestHeaders });
  });

  const filter = { urls: ['*://*/*'] };
  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    if (details.responseHeaders) {
      details.responseHeaders['Cache-Control'] = ['public, max-age=86400, immutable'];
      delete details.responseHeaders['pragma'];
      delete details.responseHeaders['expires'];
    }
    callback({ responseHeaders: details.responseHeaders });
  });

  const cacheInfoPath = path.join(app.getPath('userData'), 'cache_info.json');
  const twentyFourHours = 24 * 60 * 60 * 1000;
  let cacheIsValid = false;

  if (fs.existsSync(cacheInfoPath)) {
    try {
      const cacheInfo = JSON.parse(fs.readFileSync(cacheInfoPath, 'utf8'));
      if (cacheInfo.lastPreloadTimestamp && (Date.now() - cacheInfo.lastPreloadTimestamp < twentyFourHours)) {
        cacheIsValid = true;
        console.log('Pre-rendering cache is still valid.');
      }
    } catch (error) {
      console.error('Error reading cache info file:', error);
    }
  }

  createWindow();
  
  if (!cacheIsValid) {
    console.log('Pre-rendering cache is stale or missing. Clearing cache and re-rendering.');
    await session.defaultSession.clearCache();
    await preloadSites();
    try {
      fs.writeFileSync(cacheInfoPath, JSON.stringify({ lastPreloadTimestamp: Date.now() }));
      console.log('Updated pre-rendering cache timestamp.');
    } catch (error) {
      console.error('Error writing cache info file:', error);
    }
  } else {
    console.log('Cache is valid within 24 hours. Skipping pre-rendering to avoid unnecessary navigation.');
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.on('open-external-link', (event, url) => {
  shell.openExternal(url);
});
ipcMain.on('check-for-updates', () => {
  checkUpdate();
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

// --- Auto Updater ---
const { autoUpdater } = require('electron-updater');

function checkUpdate() {
  // if (isDev) {
  //   autoUpdater.forceDevUpdateConfig = true;
  // }
  
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err);
  });

  autoUpdater.checkForUpdates();
}
