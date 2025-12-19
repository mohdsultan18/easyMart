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
        checkout: "./checkout.html",
        profile: "./account.html",
        cart: "./cart.html",
        list: "./list.html",
        myaddresses: "./myaddresses.html",
        myorders: "./myorders.html",
        orders: "./orders.html",
        product: "./product.html",
        search: "./search.html",
        help: "./help.html",
      },
    },
  },
})
