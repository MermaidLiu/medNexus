/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        med: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#b9dffd",
          500: "#2b7cd3",
          600: "#1a63b3",
          700: "#164f8f",
          900: "#0f2d4f",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
