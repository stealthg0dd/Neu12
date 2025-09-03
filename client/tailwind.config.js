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
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "text-heading": "var(--color-text-heading)"
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