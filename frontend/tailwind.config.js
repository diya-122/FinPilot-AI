/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        panel: "rgba(8, 15, 30, 0.72)",
        border: "rgba(148, 163, 184, 0.16)",
        accent: {
          cyan: "#4deeea",
          blue: "#4f8cff",
          violet: "#8b5cf6",
          lime: "#9ef01a"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(77, 238, 234, 0.15), 0 20px 80px rgba(7, 12, 30, 0.45)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top, rgba(79, 140, 255, 0.2), transparent 35%), linear-gradient(135deg, rgba(77, 238, 234, 0.14), transparent 45%), linear-gradient(180deg, #02040c 0%, #050816 55%, #0b1021 100%)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
}
