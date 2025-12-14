/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Dark theme colors
                'df-bg': {
                    'primary': '#0f0f23',
                    'secondary': '#1a1a2e',
                    'tertiary': '#16213e',
                    'hover': '#252544',
                },
                'df-accent': {
                    'primary': '#7c3aed',
                    'secondary': '#a855f7',
                    'glow': 'rgba(124, 58, 237, 0.3)',
                },
                'df-text': {
                    'primary': '#f8fafc',
                    'secondary': '#94a3b8',
                    'muted': '#64748b',
                },
                'df-border': {
                    'primary': '#2d2d4a',
                    'hover': '#3d3d5c',
                },
                'df-status': {
                    'success': '#22c55e',
                    'warning': '#f59e0b',
                    'error': '#ef4444',
                    'info': '#3b82f6',
                },
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            boxShadow: {
                'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
                'glow-lg': '0 0 40px rgba(124, 58, 237, 0.4)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)' },
                },
            },
        },
    },
    plugins: [],
};
