/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/**/*.edge',
        './resources/**/*.{js,ts,vue,jsx,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                'bg-deep': '#050511',
                'bg-sidebar': '#0b0c24',
                'bg-surface': '#151636',
                'cyan-ice': '#6fe7f3',
                'blue-electric': '#3a86ff',
                'pink-neon': '#f72585',
                'purple-deep': '#560bad',
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}
