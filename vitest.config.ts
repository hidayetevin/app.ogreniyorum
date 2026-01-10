import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'tests/', 'dist/', '**/*.config.ts'],
        },
    },
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
});
