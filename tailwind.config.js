/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  mode: "jit",
  theme: {
    extend: {
      colors: {
        primary: "#05070d",
        secondary: "#b7ae9d",
        tertiary: "#17130e",
        "black-100": "#100d09",
        "black-200": "#0a0907",
        "white-100": "#f7f1e6",
        gold: "#d6a84b",
        "gold-light": "#ffd784",
      },
      boxShadow: {
        card: "0px 35px 120px -15px #251b0e",
      },
      screens: {
        xs: "450px",
      },
      backgroundImage: {
        "hero-pattern": "url('/src/assets/herobg.webp')",
      },
    },
  },
  plugins: [],
};
