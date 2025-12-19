import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        login: "./login.html",
        signup: "./signup.html",
        // To add more pages in the future, just add them here:
        // checkout: "./checkout.html",
        // profile: "./profile.html",
        // error: "./error.html",
      },
    },
  },
})
