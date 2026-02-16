import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dock: {
          bg: "#0a0a0f",
          card: "#1a1a2e",
          border: "#2a2a3e",
          text: "#e0e0e0",
          muted: "#8888aa",
          green: "#22c55e",
          red: "#ef4444",
          blue: "#3b82f6",
          hover: "#252540",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
