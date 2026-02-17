import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dock: {
          bg: "#030014",
          card: "rgba(255,255,255,0.03)",
          border: "rgba(255,255,255,0.06)",
          text: "#f0f0f0",
          muted: "#7b7ba0",
          green: "#22d97f",
          red: "#ff6b6b",
          blue: "#7c5cfc",
          hover: "rgba(255,255,255,0.08)",
          accent: "#7c5cfc",
          "accent-hover": "#9b7dff",
          surface: "rgba(255,255,255,0.04)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
