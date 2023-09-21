/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./styles/*.css",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          ...colors.sky,
        },
        emerald: {
          ...colors.emerald,
        },
        red: {
          ...colors.red,
        },
        slate: {
          ...colors.slate,
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
