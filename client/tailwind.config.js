module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(240, 10%, 8%)",
        surface: "hsl(240, 8%, 12%)",
        text: "hsl(0, 0%, 100%)",
        accent: "hsl(48, 100%, 67%)",
        border: "hsl(240, 10%, 20%)",
      },
    },
  },
  plugins: [],
};