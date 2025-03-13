/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100ch',
            color: 'var(--tw-prose-body)',
            '[class~="lead"]': {
              color: 'var(--tw-prose-lead)'
            },
            'a': {
              color: 'var(--tw-prose-links)',
              textDecoration: 'underline',
              fontWeight: '500'
            },
            'strong': {
              color: 'var(--tw-prose-bold)',
              fontWeight: '600'
            },
            'code': {
              color: 'var(--tw-prose-code)',
              fontWeight: '600'
            },
            'pre': {
              color: 'var(--tw-prose-pre-code)',
              backgroundColor: 'var(--tw-prose-pre-bg)',
              overflowX: 'auto',
              fontWeight: '400'
            },
            'blockquote': {
              fontWeight: '500',
              fontStyle: 'italic',
              color: 'var(--tw-prose-quotes)',
              borderLeftWidth: '0.25rem',
              borderLeftColor: 'var(--tw-prose-quote-borders)',
              quotes: '"\\201C""\\201D""\\2018""\\2019"'
            }
          }
        }
      }
    }
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography')
  ]
}
