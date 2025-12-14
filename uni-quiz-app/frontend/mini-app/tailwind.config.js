/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                tg: {
                    bg: 'var(--tg-theme-bg-color, #ffffff)',
                    text: 'var(--tg-theme-text-color, #000000)',
                    hint: 'var(--tg-theme-hint-color, #999999)',
                    link: 'var(--tg-theme-link-color, #2481cc)',
                    button: 'var(--tg-theme-button-color, #5288c1)',
                    'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
                    'secondary-bg': 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
                }
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
