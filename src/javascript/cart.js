import {
  loadProducts,
  formatCurrencyINR,
  renderCartPage,
  updateCartDisplay,
  createProductCard,
  products,
  items,
  addItemToCart,
} from "./script.js"

async function initCartPage() {
  await loadProducts().catch(() => {})

  // Update cart display to show correct count
  updateCartDisplay()

  renderCartPage()

  // Render product recommendations based on cart contents
  renderCartRecommendations()

  // Watch for cart DOM changes and update recommendations
  const container = document.getElementById("cart-items-container")
  if (container) {
    const obs = new MutationObserver(() => {
      renderCartRecommendations()
    })
    obs.observe(container, { childList: true, subtree: true })
  }

  const checkoutBtn = document.getElementById("cart-checkout-btn")
  if (checkoutBtn) {
    checkoutBtn.classList.add(
      "hover:bg-[#9b2c86]",
      "hover:shadow-[0_14px_30px_rgba(182,52,154,0.35)]",
      "cursor-pointer"
    )
    checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = "/checkout.html"
    })
  }
}

document.addEventListener("DOMContentLoaded", initCartPage)

function renderCartRecommendations() {
  const container = document.getElementById("cart-recommendations")
  if (!container) return

  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const dataset = products && products.length ? products : items || []

  let picks = []
  if (!cart || cart.length === 0) {
    picks = dataset.slice(0, 5)
  } else {
    // Find categories from items in cart
    const cartIds = new Set(cart.map((c) => String(c.id)))
    const categories = new Set()
    cart.forEach((c) => {
      const p = dataset.find((d) => String(d.id) === String(c.id))
      if (p && p.category) categories.add(p.category)
    })

    // Recommend items in same categories excluding cart items
    const sameCat = dataset.filter(
      (d) => categories.has(d.category) && !cartIds.has(String(d.id))
    )
    picks = sameCat.length
      ? sameCat.slice(0, 5)
      : dataset.filter((d) => !cartIds.has(String(d.id))).slice(0, 5)
  }

  container.innerHTML = ""
  picks.forEach((item) => {
    const card = createProductCard(item)
    if (card) {
      container.appendChild(card)
    } else {
      // Fallback card matching index.html style if template not available
      const el = document.createElement("div")
      el.className =
        "cards p-1 md:p-1 rounded-xl flex flex-col min-w-0 bg-white shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      const price = Number(item.price || 0).toFixed(2)
      el.innerHTML = `
        <div class="cards-header">
          <div class="rounded-2xl flex flex-col items-center justify-between bg-[#fef5fd]" style="aspect-ratio: 1 / 1">
            <img src="${item.image || ""}" alt="${item.title}" class="w-full h-full object-contain p-2 cursor-pointer" data-product-image="${item.id}" />
            <div class="w-full flex items-center justify-end px-2 mb-4">
              <button class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-[#B6349A] 2xl:mb-4 2xl:mr-4 bg-white add-reco-btn" data-product-id="${item.id}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12H20M12 4V20" stroke="#B6349A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="cards-bottom p-3">
          <p class="hidden xl:block text-black text-xs text-gray-500">${item.category || "Groceries"}</p>
          <h5 class="mb-2 xl:text-sm font-semibold text-[#111827] text-sm">${item.title}</h5>
          <span class="text-sm text-[#b6349a] font-semibold">₹${price}</span>
        </div>
      `
      const btn = el.querySelector(".add-reco-btn")
      const img = el.querySelector("[data-product-image]")
      
      if (btn) {
        btn.style.cursor = "pointer"
        btn.addEventListener("click", (e) => {
          e.preventDefault()
          addItemToCart(item.id, 1)
          updateCartDisplay()
          renderCartPage()
          renderCartRecommendations()
        })
      }
      
      if (img) {
        img.addEventListener("click", (e) => {
          e.preventDefault()
          window.location.href = `/product.html?id=${encodeURIComponent(item.id)}`
        })
      }
      
      container.appendChild(el)
    }
  })
}
