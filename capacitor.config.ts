import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.audiovisual.player',
  appName: 'AudioVisual',
  webDir: '.',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Browser: {
      prefersDeepLink: false
    }
  },
  android: {
    flavor: 'native',
    buildOptions: {
      releaseType: 'APK'
    }
  }
};

export default config;