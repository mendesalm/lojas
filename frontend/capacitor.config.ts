import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.esigma.lojas',
  appName: 'Lojas',
  webDir: 'dist',
  server: {
    url: 'https://lojas.e-sigma.app',
    cleartext: true
  }
};

export default config;
