// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        black: {
          900: "#000000",
          800: "#111111",
          700: "#2B2828",
          600: "#383638",
          500: "#8B8488",
        },
        white: "#FFFFFF",
        primary: {
          900: "#6C103A",
          800: "#7A1246",
          700: "#A42B83",
          600: "#C136A8",
          500: "#B6349A",
          400: "#F0ABDD",
          300: "#F6C7E8",
          200: "#FCEAF5",
          100: "#FDF5FA",
          50: "#FFF9FD",
        },
        orange: {
          900: "#5A1F09",
          800: "#7B2D13",
          700: "#C24B1F",
          600: "#F05A20",
          500: "#FF5B18",
          400: "#FF8E6E",
          300: "#FFC4AF",
          200: "#FFE6DA",
          100: "#FFF2EE",
          50: "#FFFAF9",
        },
      },

      // 🎨 Typography System
      fontFamily: {
        sans: ["Inter", "sans-serif"], // replace 'Inter' with your design font
      },
      fontSize: {
        // === DISPLAY ===
        "display-xl": ["72px", { lineHeight: "80px", fontWeight: "700" }],
        "display-lg": ["60px", { lineHeight: "68px", fontWeight: "700" }],
        "display-md": ["48px", { lineHeight: "56px", fontWeight: "700" }],

        // === HEADINGS ===
        h1: ["40px", { lineHeight: "48px", fontWeight: "600" }],
        h2: ["32px", { lineHeight: "40px", fontWeight: "600" }],
        h3: ["24px", { lineHeight: "32px", fontWeight: "500" }],
        h4: ["20px", { lineHeight: "28px", fontWeight: "500" }],

        // === BODY TEXT ===
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-base": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],

        // === LABELS / BUTTONS ===
        label: ["14px", { lineHeight: "16px", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
}
