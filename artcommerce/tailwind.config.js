/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Added with the radius ladder — see the token block in globals.css.
        hairline: 'hsl(var(--hairline))',
        wash: 'hsl(var(--wash))',
        faint: 'hsl(var(--faint))',
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        // The star gold, and the unearned part of a star behind it.
        rating: {
          DEFAULT: 'hsl(var(--rating))',
          track: 'hsl(var(--rating-track))',
        },
      },
      boxShadow: {
        sheet: 'var(--shadow-sheet)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        /*
         * Overlays animate with keyframes rather than transitions on purpose.
         * Radix's Presence waits for `animationend` before unmounting, so a
         * transition gets no closing frame at all — and no opening one either,
         * because the node is inserted already in its open state.
         */
        'sheet-in-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'sheet-out-bottom': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        'sheet-in-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'sheet-out-top': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-100%)' },
        },
        'sheet-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'sheet-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'sheet-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'sheet-out-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        /* Modal dialogs land rather than slide. */
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pop-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.96)' },
        },
        /* Step panels and freshly revealed rows. */
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        'accordion-up': 'accordion-up 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        // Out is quicker than in: leaving should feel like a dismissal.
        'sheet-in-bottom': 'sheet-in-bottom 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-bottom': 'sheet-out-bottom 200ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'sheet-in-top': 'sheet-in-top 360ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-top': 'sheet-out-top 240ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'sheet-in-right': 'sheet-in-right 340ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-right': 'sheet-out-right 240ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'sheet-in-left': 'sheet-in-left 340ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-left': 'sheet-out-left 240ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 170ms ease-in forwards',
        'pop-in': 'pop-in 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'pop-out': 'pop-out 150ms ease-in forwards',
        'rise-in': 'rise-in 260ms cubic-bezier(0.32, 0.72, 0, 1)',
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
  corePlugins: {
    preflight: true,
  },
}
