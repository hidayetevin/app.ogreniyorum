import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@config': path.resolve(__dirname, './src/config'),
            '@core': path.resolve(__dirname, './src/core'),
            '@scenes': path.resolve(__dirname, './src/scenes'),
            '@ui': path.resolve(__dirname, './src/ui'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@types': path.resolve(__dirname, './src/types'),
            '@constants': path.resolve(__dirname, './src/constants'),
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    build: {
        target: 'es2020',
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['phaser'],
    },
});
