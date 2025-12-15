# Android 图标要求

为了确保您的应用在各种 Android 设备上都有良好的外观，您需要提供多种尺寸的图标。

## 图标尺寸要求

在 `android/app/src/main/res/` 目录下应该有以下文件夹：

```
res/
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48)
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144)
├── mipmap-xxxhdpi/
│   └── ic_launcher.png (192x192)
└── mipmap-anydpi-v26/
    └── ic_launcher.xml
```

## 图标设计建议

1. **简洁明了**：图标在小尺寸下应该依然清晰可辨
2. **高对比度**：确保图标在各种背景下都可见
3. **品牌一致性**：图标应该与您的品牌形象一致
4. **避免复杂细节**：复杂的细节在小尺寸下会丢失

## Adaptive Icons（适配图标）

从 Android 8.0 开始，建议使用适配图标（Adaptive Icons）：

ic_launcher.xml 文件示例：
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

## 小米电视特别注意事项

1. **尺寸**：建议至少提供 192x192 分辨率的图标
2. **格式**：使用 PNG 格式以确保最佳质量
3. **风格**：简洁现代的设计在电视屏幕上效果更好