module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        accent: "var(--color-accent)",
        border: "var(--color-border)",
        text: "var(--color-text)"
      },
      backgroundColor: {
        background: "var(--color-background)",
        surface: "var(--color-surface)"
      },
      textColor: {
        text: "var(--color-text)"
      },
      borderColor: {
        border: "var(--color-border)"
      }
    },
  },
  plugins: [],
}