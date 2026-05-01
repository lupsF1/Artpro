import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#faf8f4",
        sand: { DEFAULT: "#f0ece4", dark: "#e6e0d4" },
        clay: { DEFAULT: "#8B6F47", light: "#a08558", dark: "#6d5636" },
        coral: { DEFAULT: "#E8725C", light: "#f09080", dark: "#d05a44" },
        blush: { DEFAULT: "#F2C4B3", light: "#f8d8cc", dark: "#e6a890" },
        surface: {
          DEFAULT: "#faf8f4",
          muted: "#f5f1ea",
          card: "#ffffff",
          elevated: "#ffffff",
        },
        accent: {
          DEFAULT: "#8B6F47",
          light: "#a08558",
          dim: "#6d5636",
          glow: "rgba(139, 111, 71, 0.12)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "serif",
        ],
        display: [
          "var(--font-serif)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
      },
      fontSize: {
        "display-xl": ["clamp(2.8rem, 7vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2rem, 5vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "breathe": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "scale-in": "scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },
      boxShadow: {
        soft: "0 1px 3px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.03)",
        lift: "0 2px 8px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.04)",
        warm: "0 4px 20px rgb(139 111 71 / 0.08), 0 1px 3px rgb(0 0 0 / 0.03)",
        premium: "0 2px 8px rgb(0 0 0 / 0.04), 0 12px 32px rgb(139 111 71 / 0.06)",
      },
    },
  },
  plugins: [typography],
};

export default config;