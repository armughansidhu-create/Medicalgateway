import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF4FB',
          100: '#D6E4F7',
          200: '#ADC9EF',
          400: '#5B96DC',
          600: '#1B6CC8',
          700: '#1557A0',
          800: '#104280',
          900: '#0B2D5A',
        },
        success: { light: '#E8F5EE', DEFAULT: '#1D7A4A', dark: '#145235' },
        warning: { light: '#FDF3DC', DEFAULT: '#C07A00', dark: '#7A4A00' },
        danger:  { light: '#FCEBEB', DEFAULT: '#C0392B', dark: '#7A1F17' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}

export default config
