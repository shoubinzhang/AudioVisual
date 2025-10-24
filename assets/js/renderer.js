// renderer.js
const urlInput = document.getElementById('url-input');
const goButton = document.getElementById('go-button');
const parseButton = document.getElementById('parse-button');
const backButton = document.getElementById('back-button');
const forwardButton = document.getElementById('forward-button');
const homeButton = document.getElementById('home-button');
const minimizeButton = document.getElementById('minimize-button');
const maximizeButton = document.getElementById('maximize-button');
const closeButton = document.getElementById('close-button');
const youkuCustomPage = document.getElementById('youku-custom-page');
const youkuUrlInput = document.getElementById('youku-url-input');
const loadingOverlay = document.getElementById('loading-overlay');

let currentVideoUrl = '';
let isCurrentlyParsing = false;
let currentYoukuUrl = '';

const platforms = [
    { value: 'https://v.qq.com', label: '腾讯视频' },
    { value: 'https://www.iqiyi.com', label: '爱奇艺' },
    { value: 'https://www.youku.com', label: '优酷' },
    { value: 'https://www.bilibili.com', label: '哔哩哔哩' },
    { value: 'https://www.mgtv.com', label: '芒果TV' }
];

const apiList = [
    {value: "https://jx.playerjy.com/?url=", label: "Player-JY"},
    {value: "https://jiexi.789jiexi.icu:4433/?url=", label: "789解析"},
    {value: "https://jx.2s0.cn/player/?url=", label: "极速解析"},
    {value: "https://bd.jx.cn/?url=", label: "冰豆解析"},
    {value: "https://jx.973973.xyz/?url=", label: "973解析"},
    {value: "https://jx.xmflv.com/?url=", label: "虾米视频解析"},
    {value: "https://www.ckplayer.vip/jiexi/?url=", label: "CK"},
    {value: "https://jx.nnxv.cn/tv.php?url=", label: "七哥解析"},
    {value: "https://www.yemu.xyz/?url=", label: "夜幕"},
    {value: "https://www.pangujiexi.com/jiexi/?url=", label: "盘古"},
    {value: "https://www.playm3u8.cn/jiexi.php?url=", label: "playm3u8"},
    {value: "https://jx.77flv.cc/?url=", label: "七七云解析"},
    {value: "https://video.isyour.love/player/getplayer?url=", label: "芒果TV1"},
    {value: "https://im1907.top/?jx=", label: "芒果TV2"},
    {value: "https://jx.hls.one/?url=", label: "HLS解析"},
];

const platformSelect = document.getElementById('platform-select');
const apiSelect = document.getElementById('api-select');

function populateSelect(selectElement, items) {
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        selectElement.appendChild(option);
    });
}

function triggerParse() {
    if (isCurrentlyParsing && currentVideoUrl) {
        // 立即显示加载状态，提升用户体验
        loadingOverlay.classList.remove('hidden');
        
        const selectedApiUrl = apiSelect.value;
        const finalUrl = selectedApiUrl + currentVideoUrl;
        
        // 使用setTimeout确保UI更新后再执行嵌入，避免阻塞
        setTimeout(() => {
            window.voidAPI.embedVideo(finalUrl);
        }, 50);
    }
}

function parseYoukuUrl() {
    let youkuVideoUrl = youkuUrlInput.value.trim() || currentYoukuUrl;
    if (youkuVideoUrl) {
        currentYoukuUrl = youkuVideoUrl;
        currentVideoUrl = youkuVideoUrl; // 更新currentVideoUrl确保地址栏显示正确
        const selectedApiUrl = apiSelect.value;
        const finalUrl = selectedApiUrl + youkuVideoUrl;
        urlInput.value = currentYoukuUrl;
        loadingOverlay.classList.remove('hidden');
        window.voidAPI.navigate(finalUrl, false);
        youkuCustomPage.style.display = 'none';
    } else {
        alert('请输入有效的优酷视频链接。');
    }
}

function navigateTo(url, isPlatformSwitch = false, themeVars = null) {
    loadingOverlay.classList.remove('hidden');
    window.voidAPI.navigate(url, isPlatformSwitch, themeVars);
}

populateSelect(platformSelect, platforms);
populateSelect(apiSelect, apiList);

platformSelect.addEventListener('change', (event) => {
    const selectedPlatform = event.target.value;
    isCurrentlyParsing = false;
    currentYoukuUrl = '';
    if (selectedPlatform === 'https://www.youku.com') {
        youkuCustomPage.style.display = 'flex';
        urlInput.value = '';
        window.voidAPI.setViewVisibility(false);
    } else {
        youkuCustomPage.style.display = 'none';
        navigateTo(selectedPlatform, true);
    }
});

goButton.addEventListener('click', () => {
    let url = urlInput.value.trim();
    if (url) {
        isCurrentlyParsing = false;
        if (!url.startsWith('http')) url = 'https' + '://' + url;
        currentVideoUrl = url;
        navigateTo(url);
    }
});

urlInput.addEventListener('keydown', (e) => e.key === 'Enter' && goButton.click());

parseButton.addEventListener('click', () => {
    // 立即显示加载状态，提升响应速度
    loadingOverlay.classList.remove('hidden');
    
    if (platformSelect.value === 'https://www.youku.com') {
        parseYoukuUrl();
    } else {
        isCurrentlyParsing = true;
        // 使用requestAnimationFrame确保UI更新后再执行解析
        requestAnimationFrame(() => {
            triggerParse();
        });
    }
});

apiSelect.addEventListener('change', () => {
    if (platformSelect.value !== 'https://www.youku.com') {
        triggerParse();
    }
});

backButton.addEventListener('click', () => window.voidAPI.goBack());
forwardButton.addEventListener('click', () => window.voidAPI.goForward());

homeButton.addEventListener('click', () => {
    isCurrentlyParsing = false;
    const isDramaMode = container.classList.contains('drama-mode');
    if (isDramaMode) {
        try {
            const currentUrl = new URL(urlInput.value);
            const rootUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
            navigateTo(rootUrl);
        } catch (error) {
            console.error("Invalid URL in address bar:", urlInput.value);
        }
    } else {
        const homeUrl = platformSelect.value;
        if (homeUrl === 'https://www.youku.com') {
            youkuCustomPage.style.display = 'flex';
            window.voidAPI.setViewVisibility(false);
            urlInput.value = '';
        } else {
            navigateTo(homeUrl, true);
        }
    }
});

minimizeButton.addEventListener('click', () => window.voidAPI.minimizeWindow());
maximizeButton.addEventListener('click', () => window.voidAPI.maximizeWindow());
closeButton.addEventListener('click', () => window.voidAPI.closeWindow());

window.voidAPI.onUrlUpdate((url) => {
    const isApiUrl = apiList.some(api => url.startsWith(api.value));
    if (isApiUrl) {
        // 如果是优酷解析的API URL，显示优酷视频链接
        if (currentYoukuUrl && url.includes(encodeURIComponent(currentYoukuUrl))) {
            urlInput.value = currentYoukuUrl;
        } else {
            urlInput.value = currentVideoUrl;
        }
    } else {
        const previousVideoUrl = currentVideoUrl;
        urlInput.value = url;
        currentVideoUrl = url;
        
        // 如果是爱奇艺视频页面且URL发生了变化，自动触发解析
        if (url.includes('iqiyi.com/v_') && url.includes('.html') && 
            previousVideoUrl && previousVideoUrl !== url && 
            platformSelect.value === 'https://www.iqiyi.com') {
            console.log('iQiyi episode changed, auto-parsing:', url);
            isCurrentlyParsing = true;
            triggerParse();
        }
        
        // 如果是腾讯视频页面且URL发生了变化，自动触发解析
        if (url.includes('v.qq.com/x/cover/') && 
            previousVideoUrl && previousVideoUrl !== url && 
            platformSelect.value === 'https://v.qq.com') {
            console.log('Tencent Video episode changed, auto-parsing:', url);
            isCurrentlyParsing = true;
            triggerParse();
        }
        
        // 如果是芒果TV页面且URL发生了变化，自动触发解析
        if (url.includes('mgtv.com/b/') && 
            previousVideoUrl && previousVideoUrl !== url && 
            platformSelect.value === 'https://www.mgtv.com') {
            console.log('Mango TV episode changed, auto-parsing:', url);
            isCurrentlyParsing = true;
            triggerParse();
        }
        
        // 如果是哔哩哔哩番剧页面且URL发生了变化，自动触发解析
        if ((url.includes('bilibili.com/bangumi/play/') || 
             url.includes('bilibili.com/video/') && (url.includes('?p=') || url.includes('&p='))) && 
            previousVideoUrl && previousVideoUrl !== url && 
            platformSelect.value === 'https://www.bilibili.com') {
            console.log('Bilibili episode changed, auto-parsing:', url);
            isCurrentlyParsing = true;
            triggerParse();
        }
    }
});

window.voidAPI.onNavStateUpdate(({ canGoBack, canGoForward }) => {
  backButton.disabled = !canGoBack;
  forwardButton.disabled = !canGoForward;
});

window.voidAPI.onLoadFinished(() => {
    loadingOverlay.classList.add('hidden');
});

function initialize() {
    if (platforms.length > 0) {
        navigateTo(platforms[0].value, true);
    }
}
initialize();

const dramaModeButton = document.getElementById('drama-mode-button');
const netflixFactoryButton = document.getElementById('netflix-factory-button');
const dramaTheme = document.getElementById('drama-theme');
const container = document.querySelector('.container');
const controlsWrapper = document.querySelector('.controls-wrapper');
const dramaControls = document.querySelector('.drama-controls');
const usageTips = document.querySelector('.usage-tips');
const dramaUsageTips = document.querySelector('.drama-usage-tips');

dramaControls.style.display = 'none';
dramaUsageTips.style.display = 'none';

function updateDOMForTheme(isSwitchingToDrama) {
    if (isSwitchingToDrama) {
        dramaModeButton.innerHTML = `
            <div class="button-icon" style="display: flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1;">
                🏠
            </div>
            <div class="button-text">国内解析</div>
        `;
        dramaTheme.disabled = false;
        container.classList.add('drama-mode');
        controlsWrapper.style.display = 'none';
        usageTips.style.display = 'none';
        dramaControls.style.display = 'block';
        dramaUsageTips.style.display = 'block';
        youkuCustomPage.style.display = 'none';
    } else {
        dramaModeButton.innerHTML = `
            <div class="button-icon" style="display: flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1;">
                🌍
            </div>
            <div class="button-text">美韩日剧</div>
        `;
        dramaTheme.disabled = true;
        container.classList.remove('drama-mode');
        controlsWrapper.style.display = 'block';
        usageTips.style.display = 'block';
        dramaControls.style.display = 'none';
        dramaUsageTips.style.display = 'none';
    }
}

function navigateForTheme(isSwitchingToDrama) {
    const theme = isSwitchingToDrama ? {
        '--primary-bg': '#000000',
        '--accent-color': '#333333',
        '--highlight-color': '#C0FAA0'
    } : {
        '--primary-bg': '#1e1e2f',
        '--accent-color': '#3a3d5b',
        '--highlight-color': '#ff6768'
    };
    const url = isSwitchingToDrama ? 'https://www.netflixgc.com/' : platformSelect.value;
    
        window.voidAPI.setViewVisibility(false);
    if (url === 'https://www.youku.com' && !isSwitchingToDrama) {
        youkuCustomPage.style.display = 'flex';
    } else {
        navigateTo(url, !isSwitchingToDrama, theme);
    }
}

dramaModeButton.addEventListener('click', (event) => {
    const isCurrentlyDrama = container.classList.contains('drama-mode');
    const isSwitchingToDrama = !isCurrentlyDrama;
    navigateForTheme(isSwitchingToDrama);

    if (!document.startViewTransition) {
        updateDOMForTheme(isSwitchingToDrama);
        return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(() => updateDOMForTheme(isSwitchingToDrama));
    transition.ready.then(() => {
        document.documentElement.animate(
            { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
            { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
        );
    });
});

netflixFactoryButton.addEventListener('click', () => navigateTo('https://www.netflixgc.com/'));
document.getElementById('7-movie-button').addEventListener('click', () => navigateTo('https://www.7.movie/'));
document.getElementById('kanpian-button').addEventListener('click', () => navigateTo('https://kunzejiaoyu.net/'));
document.getElementById('gazf-button').addEventListener('click', () => navigateTo('https://gaze.run/'));


document.addEventListener('DOMContentLoaded', () => {
    const externalLink = document.querySelector('.footer a');
    if (externalLink) {
        externalLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.voidAPI.openExternalLink(event.currentTarget.href);
        });
    }

    const checkUpdateButton = document.getElementById('check-update-button');
    const updateNotificationArea = document.getElementById('update-notification-area');
    let currentNotificationTimeout = null;
    
    function showUpdateNotification(message, type = 'info', persistent = false) {
        if (currentNotificationTimeout) {
            clearTimeout(currentNotificationTimeout);
            currentNotificationTimeout = null;
        }
        
        updateNotificationArea.innerHTML = `<div style="padding: 8px; border-radius: 4px; font-size: 12px; text-align: center; background: ${type === 'error' ? '#ff6768' : type === 'success' ? 'var(--highlight-color)' : 'var(--accent-color)'}; color: ${type === 'success' ? 'var(--primary-bg)' : 'white'}; word-wrap: break-word; line-height: 1.3;">${message}</div>`;
        
        if (!persistent && type !== 'success' && type !== 'available') {
            currentNotificationTimeout = setTimeout(() => {
                updateNotificationArea.innerHTML = '';
                currentNotificationTimeout = null;
            }, 8000);
        }
    }
    
    checkUpdateButton.addEventListener('click', () => {
        showUpdateNotification("正在检查更新...", 'info', false);
        window.voidAPI.checkForUpdates();
    });

    window.voidAPI.onUpdateAvailable((info) => {
        showUpdateNotification(`发现新版本 ${info.version}。点击此处开始下载。`, 'available', true);
        const notificationDiv = updateNotificationArea.querySelector('div');
        notificationDiv.style.cursor = 'pointer';
        notificationDiv.onclick = function() {
            showUpdateNotification("正在下载更新...", 'info', true);
            window.voidAPI.downloadUpdate();
            const newDiv = updateNotificationArea.querySelector('div');
            if (newDiv) {
                newDiv.onclick = null;
                newDiv.style.cursor = 'default';
            }
        };
    });

    window.voidAPI.onUpdateNotAvailable(() => {
        showUpdateNotification("已是最新版本", 'info', false);
    });

    window.voidAPI.onUpdateDownloadProgress((progressObj) => {
        const percent = Math.floor(progressObj.percent);
        checkUpdateButton.textContent = `下载中... ${percent}%`;
        showUpdateNotification(`下载进度: ${percent}% (${Math.floor(progressObj.transferred / 1024 / 1024)}MB / ${Math.floor(progressObj.total / 1024 / 1024)}MB)`, 'info', true);
    });

    window.voidAPI.onUpdateDownloaded(() => {
        checkUpdateButton.textContent = '检查更新';
        showUpdateNotification("更新已下载。点击此处重启以应用。", 'success', true);
        const notificationDiv = updateNotificationArea.querySelector('div');
        notificationDiv.style.cursor = 'pointer';
        notificationDiv.onclick = function() {
            window.voidAPI.quitAndInstall();
        };
    });

    window.voidAPI.onUpdateError((err) => {
        showUpdateNotification(`更新出错: ${err.message}`, 'error', false);
    });

    // --- Sidebar Auto-Scaling Logic ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarScaler = document.querySelector('.sidebar-scaler');

    if (sidebar && sidebarScaler) {
        const updateSidebarScale = () => {
            const idealHeight = sidebarScaler.scrollHeight;
            const availableHeight = sidebar.clientHeight;
            
            const verticalPadding = parseFloat(getComputedStyle(sidebarScaler).paddingTop) + parseFloat(getComputedStyle(sidebarScaler).paddingBottom);
            const effectiveAvailableHeight = availableHeight - verticalPadding;

            // Add a small tolerance to prevent scaling for minor pixel differences
            if (idealHeight > effectiveAvailableHeight + 2) { 
                const scale = effectiveAvailableHeight / idealHeight;
                sidebarScaler.style.transform = `scale(${scale})`;
            } else {
                sidebarScaler.style.transform = 'scale(1)';
            }
        };

        const resizeObserver = new ResizeObserver(updateSidebarScale);
        resizeObserver.observe(sidebar);
        
        const mutationObserver = new MutationObserver(updateSidebarScale);
        mutationObserver.observe(sidebarScaler, { childList: true, subtree: true, attributes: true });

        setTimeout(updateSidebarScale, 100);
    }
});
