@echo off
TITLE AudioVisual Android 构建工具

echo ==================================================
echo   AudioVisual Android APK 构建工具
echo ==================================================
echo.

REM 检查 Node.js 是否已安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到 Node.js。请先安装 Node.js。
    pause
    exit /b 1
)

echo 检测到 Node.js 版本: 
node --version
echo.

REM 检查 npm 是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 无法运行 npm 命令。
    pause
    exit /b 1
)

echo 检测到 npm 版本: 
npm --version
echo.

echo --------------------------------------------------
echo 正在安装必要的依赖...
echo --------------------------------------------------
npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败。
    pause
    exit /b 1
)

echo.
echo --------------------------------------------------
echo 正在准备 Android 构建环境...
echo --------------------------------------------------
npm run prepare-android
if %errorlevel% neq 0 (
    echo 错误: Android 构建环境准备失败。
    pause
    exit /b 1
)

echo.
echo --------------------------------------------------
echo 正在构建 Android APK...
echo --------------------------------------------------
npm run build-android
if %errorlevel% neq 0 (
    echo 错误: Android APK 构建失败。
    pause
    exit /b 1
)

echo.
echo ==================================================
echo   构建完成!
echo ==================================================
echo.
echo APK 文件位置: android\app\build\outputs\apk\debug\
echo.
echo 要在 Android Studio 中打开项目，请运行:
echo npm run open-android
echo.
pause