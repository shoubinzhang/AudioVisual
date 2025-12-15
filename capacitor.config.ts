import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.audiovisual.player',
  appName: 'AudioVisual',
  webDir: 'www',
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