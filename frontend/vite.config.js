import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: './tests/setup.js',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json'],
            include: ['src/**/*.tsx', 'src/**/*.jsx'],
            thresholds: {
                statements: 20,
                branches: 20,
                functions: 20,
                lines: 20
            }
        }
    }
});
