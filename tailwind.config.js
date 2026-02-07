/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Telegram Web App variables fallback
                tg: {
                    bg: 'var(--tg-theme-bg-color, #09090b)',
                    secondary: 'var(--tg-theme-secondary-bg-color, #18181b)',
                    text: 'var(--tg-theme-text-color, #ffffff)',
                    hint: 'var(--tg-theme-hint-color, #a1a1aa)',
                    link: 'var(--tg-theme-link-color, #3b82f6)',
                    button: 'var(--tg-theme-button-color, #3b82f6)',
                    buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
                },
                // Custom premium output
                surface: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#09090b', // Deep black for OLED
                },
                accent: {
                    blue: '#007aff',
                    purple: '#5856d6',
                    cyan: '#32ade6',
                    green: '#34c759',
                    orange: '#ff9500',
                    red: '#ff3b30',
                }
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'Segoe UI', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'pulse-glow': 'pulseGlow 2s infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pop: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
                    '50%': { opacity: '.8', boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backdropBlur: {
                xs: '2px',
                xl: '20px',
                '2xl': '40px',
            },
            backgroundImage: {
                'premium-gradient': 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
                'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                'blue-mesh': 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            }
        },
    },
    plugins: [],
}
