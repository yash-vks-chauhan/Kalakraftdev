// PostCSS configuration
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': require.resolve('tailwindcss'),
    'autoprefixer': require.resolve('autoprefixer'),
  }
} 