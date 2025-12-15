# 在线 Android 构建指南

如果您无法在本地安装 Android Studio，这里有几种在线构建 Android APK 的方法。

## 方法一：使用 GitHub Actions（推荐）

这是最简单的方法，因为我们已经在项目中配置了 GitHub Actions 工作流。

### 步骤：

1. 将您的项目推送到 GitHub 仓库
2. 在 GitHub 仓库中，转到 "Actions" 标签页
3. 工作流会自动开始构建 APK
4. 构建完成后，可以在 "Artifacts" 部分下载生成的 APK 文件

## 方法二：使用 Gitpod

Gitpod 提供了一个完整的在线开发环境。

### 步骤：

1. 访问 https://gitpod.io/
2. 使用您的 GitHub 账户登录
3. 创建一个新的工作区，连接到您的项目仓库
4. 在终端中运行以下命令：
   ```bash
   npm install
   npm run prepare-android
   npm run build-android
   ```
5. 构建完成后，APK 文件将位于 `android/app/build/outputs/apk/debug/` 目录中

## 方法三：使用 GitHub Codespaces

GitHub Codespaces 是微软提供的在线开发环境。

### 步骤：

1. 在您的 GitHub 仓库中，点击 "Code" 按钮
2. 选择 "Open with Codespaces"
3. 创建一个新的 Codespace
4. 在终端中运行以下命令：
   ```bash
   npm install
   npm run prepare-android
   npm run build-android
   ```
5. 构建完成后，APK 文件将位于 `android/app/build/outputs/apk/debug/` 目录中

## 方法四：使用 Codename One

Codename One 提供了一个在线平台来构建跨平台应用。

### 步骤：

1. 访问 https://www.codenameone.com/
2. 创建一个免费账户
3. 创建一个新项目
4. 上传您的 HTML、CSS 和 JavaScript 文件
5. 使用平台提供的工具进行构建

## 注意事项

1. **构建时间**：首次构建可能需要较长时间，因为需要下载 Android SDK 和其他依赖项
2. **存储空间**：某些在线服务可能对存储空间有限制
3. **网络连接**：稳定的网络连接对在线构建非常重要
4. **私有仓库**：某些服务可能对私有仓库收费

## 故障排除

### 构建失败

如果构建失败，请检查以下几点：

1. 确保所有依赖项都已正确安装
2. 检查 GitHub Actions 日志以获取详细错误信息
3. 确保项目结构符合 Capacitor 的要求

### APK 无法安装

如果生成的 APK 无法在小米电视上安装：

1. 确保在电视设置中启用了"未知来源"安装
2. 检查 APK 是否完整下载
3. 尝试使用不同的 USB 存储设备

通过以上方法，您应该能够在不安装 Android Studio 的情况下成功构建 Android APK。