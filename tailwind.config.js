/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: ["content/**/*.md", "layouts/**/*.html", "data/**/*.yaml"],
  theme: {
    fontSize: { 
      'xxs': '0.65rem',
      'xs': '0.75rem',
      'sm': '0.875rem',
      'av': '0.925rem',
      'base': '1.00rem',
      'md': '1.125rem',
      'lg': '1.25rem',
      'xl': '1.5rem',
      '1xl': '1.75rem',
      '2xl': '2rem',
      '3xl': '2.5rem',
      '4xl': '3rem', 
      '5xl': '3.5rem', 
      '6xl': '4rem' 
    },
    fontFamily: { rubik: 'Rubik' },    
    extend: {
      colors: {
        teal: colors.teal,
        cyan: colors.cyan,
        'gray': {
          450: '#747a80'
        },
        'neon': {
          300: '#57FF97'
        },
        'magenta': {
          50: '#f8f7fa',
          100: '#f6f5f9',
          150: '#ebe9f2',
          200: '#7D67A3',
          300: '#774ac0',
          400: '#634ac0',
          500: '#5d4d80',
          600: '#44318D',
          700: '#36234f',
          800: '#2a1B3D',
          900: '#120b1a',
        },        
      },  
      typography: (theme) => ({
        DEFAULT: {
          css: {
            'h1': { fontSize: "2.4rem", paddingTop: "1.5rem", lineHeight: "3.2rem"},
            'h2': { fontSize: "1.9rem"},
            'h3': { fontSize: "1.6rem", paddingTop: "1.0rem"},
            'h4': { fontSize: "1.4rem"},
            'h5': { fontSize: "1.2rem"},
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.magenta.700'),
              fontFamily: theme('fontFamily.rubik')
            },
            'dd': {
              color: theme('colors.gray.600')
            },
            'p': { 
              fontSize: "1.02rem",
                color: theme('colors.gray.600')
            },
            'a': {
              textDecoration: "none",
              color: theme('colors.magenta.400'),
              fontWeight: "normal",
              fontFamily: theme('fontFamily.rubik')
            },
            'a:hover': {
              textDecoration: "underline",
            },         
            'blockquote': {
              'margin-left': "15px",
              'margin-right': "15px",
              'background-color': "#f9fafc",
              'border-color': theme('colors.magenta.300'),
            },
            'blockquote p': {
              "padding": "15px 5px",
              "font-weight": "300",
              "font-size": "1.15rem",
              "color": theme('colors.magenta.500'),
              "font-style": "normal",
            },
            pre: {
              "background-color": "#412E69"
            },
            '--tw-prose-bullets': theme('colors.gray[600]'),
          }
        },       
        quoteless: {
          css: {
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
          },
        },
      }),            
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}