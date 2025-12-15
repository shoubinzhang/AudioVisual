#!/usr/bin/env node

/**
 * Android 构建准备脚本
 * 此脚本将自动执行必要的步骤来准备 Android 构建
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始准备 Android 构建...');

try {
  // 检查是否已安装必要的依赖
  console.log('🔍 检查依赖...');
  
  // 安装 Capacitor 依赖（如果尚未安装）
  console.log('📦 安装 Capacitor 依赖...');
  execSync('npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/browser', { stdio: 'inherit' });
  
  // 添加 Android 平台
  console.log('🤖 添加 Android 平台...');
  execSync('npx cap add android', { stdio: 'inherit' });
  
  // 复制资源
  console.log('📋 复制资源...');
  execSync('npx cap copy', { stdio: 'inherit' });
  
  // 同步项目
  console.log('🔄 同步项目...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  console.log('✅ Android 构建准备完成！');
  console.log('📝 下一步:');
  console.log('   1. 运行 "npx cap open android" 在 Android Studio 中打开项目');
  console.log('   2. 或运行 "npx cap build android" 直接构建 APK');
  
} catch (error) {
  console.error('❌ 构建准备过程中出现错误:');
  console.error(error.message);
  process.exit(1);
}