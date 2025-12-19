import "/src/javascript/auth.js"

const sizeBox = document.getElementById("sizeBox")
if (sizeBox) {
  function updateSize() {
    sizeBox.textContent = `Viewport: ${window.innerWidth}px × ${window.innerHeight}px`
  }
  window.addEventListener("resize", updateSize)
  updateSize()
}

const TRENDING_CARD_COUNT = 6
const ORDER_NOW_CARD_COUNT = 3
export let products = []
let currentSearchQuery = ""
let currentSearchResults = []
import items from "/public/items.json"
export { items }

export function getCartItemCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  return cart.length
}

export function updateCartDisplay() {
  const cartCount = getCartItemCount()
  const mobileBadge = document.getElementById("cart-count-mobile")
  const desktopBadge = document.getElementById("cart-count-desktop")
  const homeBadge = document.getElementById("cart-count-home")
  if (mobileBadge) mobileBadge.textContent = String(cartCount)
  if (desktopBadge) desktopBadge.textContent = String(cartCount)
  if (homeBadge) homeBadge.textContent = String(cartCount)
}

export function addItemToCart(productId, quantity = 1) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart") || "[]")

  const sid = String(productId)

  // Find if product already exists in cart
  const existingItem = cart.find((item) => String(item.id) === sid)

  if (existingItem) {
    // Increment quantity if already in cart
    existingItem.quantity =
      Number(existingItem.quantity || 0) + Number(quantity || 1)
  } else {
    // Add new item to cart
    const product = (products || items).find((p) => String(p.id) === sid)
    if (product) {
      cart.push({
        id: sid,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: Number(quantity || 1),
      })
    }
  }

  // Save updated cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart display
  updateCartDisplay()
}

export async function loadProducts() {
  try {
    const response = await fetch("/items.json")
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        products = data
        console.log(`Loaded ${products.length} products`)
      }
    }
  } catch (error) {
    console.error("Failed to load products:", error)
    products = items
  }
}

loadProducts()

export function formatCurrencyINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export function renderCartPage() {
  const container = document.getElementById("cart-items-container")
  const emptyMessage = document.getElementById("cart-empty-message")
  if (!container) return

  let cart = JSON.parse(localStorage.getItem("cart") || "[]")

  if (!Array.isArray(cart) || cart.length === 0) {
    container.innerHTML = ""
    if (emptyMessage) emptyMessage.classList.remove("hidden")
    return
  }

  if (emptyMessage) emptyMessage.classList.add("hidden")

  let totalPrice = 0
  const html = cart
    .map((item) => {
      const itemTotal = item.price * item.quantity
      totalPrice += itemTotal
      return `
        <div class="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
          <img src="${item.image}" alt="${
        item.title
      }" class="w-20 h-20 object-contain rounded-lg bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity" data-cart-product-id="${
        item.id
      }" />
          <div class="flex-1">
            <p class="text-sm font-semibold text-[#111827]">${item.title}</p>
            <p class="text-xs text-gray-500 mt-1">₹${item.price.toFixed(2)}</p>
          </div>
          <div class="text-right">
            <div class="flex items-center gap-2 mb-2">
              <button data-cart-minus="${
                item.id
              }" class="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-full text-xs cursor-pointer hover:bg-gray-100">−</button>
              <span class="w-8 text-center text-sm font-medium">${
                item.quantity
              }</span>
              <button data-cart-plus="${
                item.id
              }" class="w-6 h-6 flex items-center justify-center border border-[#B6349A] rounded-full text-xs cursor-pointer hover:bg-[#fef0f8]">+</button>
            </div>
            <p class="text-sm font-semibold text-[#111827]">₹${itemTotal.toFixed(
              2
            )}</p>
            <button data-cart-remove="${
              item.id
            }" class="text-xs text-[#B6349A] hover:underline cursor-pointer mt-2">Remove</button>
          </div>
        </div>
      `
    })
    .join("")

  container.innerHTML = html

  // Update totals - ensure they show 0 when cart is empty
  const itemsTotal = document.getElementById("cart-items-total")
  const deliveryFee = document.getElementById("cart-delivery-fee")
  const subtotal = document.getElementById("cart-subtotal")
  if (itemsTotal) itemsTotal.textContent = cart.length === 0 ? formatCurrencyINR(0) : formatCurrencyINR(totalPrice)
  if (deliveryFee) deliveryFee.textContent = formatCurrencyINR(0)
  if (subtotal) subtotal.textContent = cart.length === 0 ? formatCurrencyINR(0) : formatCurrencyINR(totalPrice)

  // Bind quantity and remove buttons
  container.querySelectorAll("[data-cart-minus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-cart-minus")
      decreaseQuantity(id)
    })
  })

  container.querySelectorAll("[data-cart-plus]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-cart-plus")
      increaseQuantity(id)
    })
  })

  container.querySelectorAll("[data-cart-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-cart-remove")
      removeItemFromCart(id)
    })
  })

  // Bind product image clicks to navigate to product page
  container.querySelectorAll("[data-cart-product-id]").forEach((img) => {
    img.addEventListener("click", () => {
      const id = img.getAttribute("data-cart-product-id")
      window.location.href = `/product.html?id=${encodeURIComponent(id)}`
    })
  })
}

export function increaseQuantity(productId) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const sid = String(productId)
  const item = cart.find((p) => String(p.id) === sid)
  if (item) {
    item.quantity = Number(item.quantity || 0) + 1
    localStorage.setItem("cart", JSON.stringify(cart))
    updateCartDisplay()
    renderCartPage()
  }
}

export function decreaseQuantity(productId) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const sid = String(productId)
  const item = cart.find((p) => String(p.id) === sid)

  if (!item) return

  if (item.quantity > 1) {
    item.quantity = Number(item.quantity) - 1
  } else {
    // If quantity becomes 0 → Remove item completely
    cart = cart.filter((p) => String(p.id) !== sid)
  }
  localStorage.setItem("cart", JSON.stringify(cart))
  updateCartDisplay()
  renderCartPage()
}

export function removeItemFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const sid = String(productId)
  cart = cart.filter((p) => String(p.id) !== sid)
  localStorage.setItem("cart", JSON.stringify(cart))
  updateCartDisplay()
  renderCartPage()
}

const searchInputs = document.querySelectorAll(".search-input")
const suggestionArea = document.getElementById("suggestion-area")
const pathname = (window.location.pathname || "").toLowerCase()
const isSearchPage =
  pathname.endsWith("/search.html") ||
  pathname.endsWith("search.html") ||
  pathname.endsWith("/search") ||
  pathname === "/search"

export function getActiveSearchInput() {
  return (
    Array.from(searchInputs).find((input) => input.offsetParent !== null) ||
    searchInputs[0] ||
    null
  )
}

export function positionSuggestionArea() {
  if (!suggestionArea) return
  const activeInput = getActiveSearchInput()
  if (!activeInput) return

  const rect = activeInput.getBoundingClientRect()
  const padding = 8
  const maxWidth = Math.min(rect.width, window.innerWidth - padding * 2)
  const maxLeft = window.innerWidth - maxWidth - padding
  const desiredLeft = rect.left
  const left = Math.max(padding, Math.min(desiredLeft, maxLeft))

  suggestionArea.style.width = `${maxWidth}px`
  suggestionArea.style.left = `${left}px`
  suggestionArea.style.top = `${rect.bottom + padding}px`
}

export function isSuggestionVisible() {
  return suggestionArea && !suggestionArea.classList.contains("hidden")
}

export function showSuggestions(keyword) {
  // Suggestions are disabled on the search results page or when suggestionArea is missing
  if (isSearchPage || !suggestionArea) return

  if (!keyword) {
    suggestionArea.classList.add("hidden")
    return
  }

  if (!products.length) {
    suggestionArea.innerHTML = `<div class="p-3 text-sm">Loading products...</div>`
    positionSuggestionArea()
    suggestionArea.classList.remove("hidden")
    return
  }

  const matches = products.filter((product) => {
    const title = (product.title || "").toLowerCase()
    const tags = Array.isArray(product.tags)
      ? product.tags.join(" ").toLowerCase()
      : ""
    const category = (product.category || "").toLowerCase()
    return (
      title.includes(keyword) ||
      tags.includes(keyword) ||
      category.includes(keyword)
    )
  })

  if (matches.length === 0) {
    suggestionArea.innerHTML = `<div class="p-4 text-center text-sm text-gray-600">No products found</div>`
    positionSuggestionArea()
    suggestionArea.classList.remove("hidden")
    return
  }

  let html = ""
  matches.slice(0, 10).forEach((item) => {
    const img = item.image || "./src/assets/image/orange.svg"
    const title = (item.title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    html += `
      <div class="bg-gray-100 flex items-center gap-5 ml-2 mb-4 mt-4 mr-2 rounded-lg hover:rounded-2xl p-2 suggestion-item cursor-pointer" data-title="${title}">
        <img src="${img}" alt="${title}" class="w-[14%] h-[14%] ml-2 object-contain" />
        <p>${title}</p>
      </div>
    `
  })

  suggestionArea.innerHTML = html
  positionSuggestionArea()
  suggestionArea.classList.remove("hidden")

  if (suggestionArea) {
    suggestionArea.querySelectorAll(".suggestion-item").forEach((div) => {
      div.addEventListener("click", () => {
        const title = div.getAttribute("data-title")
        const visibleInput = getActiveSearchInput()
        if (visibleInput) {
          visibleInput.value = title
        }
        suggestionArea.classList.add("hidden")
        if (title && title.trim()) {
          window.location.href = `/search.html?q=${encodeURIComponent(
            title.trim()
          )}`
        }
      })
    })
  }
}

searchInputs.forEach((input) => {
  // Only attach suggestion-related listeners on non-search pages
  if (!isSearchPage && suggestionArea) {
    input.addEventListener("input", (e) => {
      showSuggestions(e.target.value.trim().toLowerCase())
    })

    input.addEventListener("focus", (e) => {
      if (e.target.value.trim()) {
        showSuggestions(e.target.value.trim().toLowerCase())
      }
    })
  }

  // Keep Enter handling on all pages (redirects or reloads search)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = e.target.value.trim()
      if (value) {
        e.preventDefault()
        window.location.href = `/search.html?q=${encodeURIComponent(value)}`
      } else if (suggestionArea) {
        suggestionArea.classList.add("hidden")
      }
    }
  })
})

document.addEventListener("click", (e) => {
  const isSearchInput = Array.from(searchInputs).some((input) =>
    input.contains(e.target)
  )
  if (suggestionArea) {
    if (!suggestionArea.contains(e.target) && !isSearchInput) {
      suggestionArea.classList.add("hidden")
    }
  }
})

const handleReposition = () => {
  if (isSuggestionVisible()) {
    positionSuggestionArea()
  }
}
window.addEventListener("resize", handleReposition)
window.addEventListener("scroll", handleReposition, true)

const productTemplate = document.querySelector("#home-item-template")

export function createProductCard(item) {
  if (!productTemplate) return null

  const card = productTemplate.content.firstElementChild.cloneNode(true)
  const cardElement = card.querySelector("[data-home-item]") || card
  cardElement.classList.add("cursor-pointer")

  cardElement.dataset.itemId = item.id || ""

  const nameEl = card.querySelector("[data-name]")
  if (nameEl) nameEl.textContent = item.title || ""

  const imgEl = card.querySelector("[data-image]")
  if (imgEl) {
    imgEl.src = item.image || ""
    imgEl.style.maxHeight = "180px"
    imgEl.style.width = "auto"
    imgEl.style.objectFit = "contain"
    imgEl.style.margin = "0 auto"
  }

  const categoryEl = card.querySelector("[data-category]")
  if (categoryEl) categoryEl.textContent = item.category || ""

  const priceEl = card.querySelector("[data-price]")
  if (priceEl && item.price !== undefined) {
    const price = Number(item.price) || 0
    let html = `₹${price.toFixed(2)}`

    if (item.discount) {
      const discountStr = String(item.discount).replace("%", "")
      const discountPct = parseFloat(discountStr)
      if (!Number.isNaN(discountPct) && discountPct > 0 && discountPct < 100) {
        const original = price / (1 - discountPct / 100)
        html = `<span>₹${price.toFixed(
          2
        )}</span> <s class="text-gray-400 text-[11px]">₹${original.toFixed(
          2
        )}</s>`
      }
    }

    priceEl.innerHTML = html
  }

  const stockEl = card.querySelector("[data-stock]")
  if (stockEl && item.stock !== undefined) {
    stockEl.textContent = item.stock > 0 ? `${item.stock} Left` : "Out of stock"
  }

  const addBtn = card.querySelector("[data-add-to-cart]")
  if (addBtn) {
    addBtn.classList.add("cursor-pointer", "hover:bg-[#fef0f8]", "transition-colors", "duration-150")
    addBtn.addEventListener("click", (e) => {
      e.preventDefault()
      if (item.stock === 0) return

      addItemToCart(item.id, 1)
      updateCartDisplay()
    })
  }

  // Navigate to product details when clicking the card (but not the + button)
  cardElement.addEventListener("click", (e) => {
    if (e.target.closest("[data-add-to-cart]")) return
    const id = item.id || ""
    if (id) {
      window.location.href = `/product.html?id=${encodeURIComponent(id)}`
    }
  })

  return card
}

export function createStarIcons(rating, size = 16) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(`
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#f97316" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `)
    } else if (i === fullStars && hasHalf) {
      stars.push(`
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2v15.77L5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f97316"/>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77v-15.77z" fill="none" stroke="#f97316" stroke-width="1"/>
        </svg>
      `)
    } else {
      stars.push(`
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `)
    }
  }

  return stars.join("")
}

export function buildHighlights(product) {
  return [
    { icon: "🔥", label: "Best Seller" },
    { icon: "✓", label: "Quality Assured" },
    { icon: "🚚", label: "Fast Delivery" },
    { icon: "💰", label: "Value for Money" },
  ]
}

export function buildReviewSamples(product) {
  return [
    {
      author: "Sarah Johnson",
      date: "2 days ago",
      rating: 4.5,
      text: "Great quality product! Arrived quickly and in perfect condition. Highly recommended.",
    },
    {
      author: "Mike Chen",
      date: "1 week ago",
      rating: 5,
      text: "Exceeded my expectations. The freshness and taste were outstanding. Will order again!",
    },
    {
      author: "Emma Davis",
      date: "2 weeks ago",
      rating: 4,
      text: "Good product overall. Packaging was excellent and delivery was on time.",
    },
  ]
}

export function buildProductCopy(product) {
  return {
    about:
      product.description ||
      "This is a premium quality product sourced from the finest suppliers. It undergoes rigorous quality checks to ensure freshness and taste.",
    storage:
      "Store in a cool, dry place. For optimal freshness, keep refrigerated after opening. Use within the mentioned validity period.",
    ingredients:
      product.tags && product.tags.length
        ? product.tags.join(", ")
        : "Natural ingredients with no preservatives or artificial colors added.",
  }
}

function getItemsPerScreen() {
  if (window.innerWidth >= 1024) return 5
  if (window.innerWidth >= 768) return 4
  return 3
}

function setItemWidths(container) {
  const itemsPerScreen = getItemsPerScreen()
  const children = Array.from(container.children)

  if (children.length === 0) return

  const widthPercent = 100 / itemsPerScreen
  children.forEach((child) => {
    child.style.flex = `0 0 ${widthPercent}%`
    child.style.maxWidth = `${widthPercent}%`
    child.style.boxSizing = "border-box"
  })
}

function setupCarousel(container, leftBtn, rightBtn) {
  if (!container) return

  container.style.display = "flex"
  container.style.overflowX = "auto"
  container.style.scrollBehavior = "smooth"
  container.style.scrollbarWidth = "none"
  container.classList.add("carousel-container")

  if (!document.getElementById("carousel-style")) {
    const style = document.createElement("style")
    style.id = "carousel-style"
    style.textContent =
      ".carousel-container::-webkit-scrollbar { display: none; }"
    document.head.appendChild(style)
  }

  setItemWidths(container)

  function getScrollAmount() {
    const firstItem = container.querySelector(":scope > *")
    if (!firstItem) {
      return Math.round(container.clientWidth / getItemsPerScreen())
    }
    return Math.round(firstItem.getBoundingClientRect().width)
  }

  function updateArrowStates() {
    if (!leftBtn || !rightBtn) return

    const isAtStart = container.scrollLeft <= 0
    const isAtEnd =
      container.scrollLeft >= container.scrollWidth - container.clientWidth - 2

    leftBtn.disabled = isAtStart
    leftBtn.classList.toggle("opacity-50", isAtStart)
    leftBtn.classList.toggle("cursor-not-allowed", isAtStart)

    rightBtn.disabled = isAtEnd
    rightBtn.classList.toggle("opacity-50", isAtEnd)
    rightBtn.classList.toggle("cursor-not-allowed", isAtEnd)
  }

  if (rightBtn) {
    rightBtn.addEventListener("click", (e) => {
      e.preventDefault()
      container.scrollLeft += getScrollAmount()
      setTimeout(updateArrowStates, 10)
    })
  }

  if (leftBtn) {
    leftBtn.addEventListener("click", (e) => {
      e.preventDefault()
      container.scrollLeft -= getScrollAmount()
      setTimeout(updateArrowStates, 10)
    })
  }

  container.addEventListener("scroll", updateArrowStates)
  setTimeout(updateArrowStates, 10)

  let resizeTimer
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      setItemWidths(container)
      updateArrowStates()
    }, 150)
  })
}

function equalizeHeights(container) {
  if (!container) return

  const cardBodies = container.querySelectorAll(".card-body")
  if (cardBodies.length === 0) return

  cardBodies.forEach((body) => {
    body.style.height = "auto"
  })

  let maxHeight = 0
  cardBodies.forEach((body) => {
    const height = body.getBoundingClientRect().height
    if (height > maxHeight) maxHeight = height
  })

  cardBodies.forEach((body) => {
    body.style.height = `${maxHeight}px`
  })
}

function equalizeAfterImages(container) {
  equalizeHeights(container)

  const images = container.querySelectorAll("img")
  let loadedCount = 0
  const totalImages = images.length

  if (totalImages === 0) return

  images.forEach((img) => {
    if (img.complete) {
      loadedCount++
      if (loadedCount === totalImages) {
        equalizeHeights(container)
      }
    } else {
      img.addEventListener(
        "load",
        () => {
          loadedCount++
          if (loadedCount === totalImages) {
            equalizeHeights(container)
          }
        },
        { once: true }
      )
    }
  })
}

function setupProductSections() {
  const sections = [
    { container: "#card-row-1", header: "#card-header", category: "Fruits" },
    {
      container: "#card-row-2",
      header: "#card-header-2",
      category: "Personal Care",
    },
    {
      container: "#card-row-3",
      header: "#card-header-3",
      category: "Groceries",
    },
  ]

  sections.forEach((section) => {
    const container = document.querySelector(section.container)
    const header = document.querySelector(section.header)

    if (!container) return

    container.innerHTML = ""

    const categoryItems = items.filter(
      (item) => item.category === section.category
    )

    if (categoryItems.length === 0) {
      container.innerHTML = `<p class="text-gray-500">No products found</p>`
      return
    }

    categoryItems.forEach((item) => {
      const card = createProductCard(item)
      if (card) container.appendChild(card)
    })

    const leftBtn = header?.querySelector(".left-arrow")
    const rightBtn = header?.querySelector(".right-arrow")

    setupCarousel(container, leftBtn, rightBtn)
    equalizeAfterImages(container)

    let resizeTimer
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        equalizeAfterImages(container)
      }, 150)
    })
  })
}

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function setupTrendingFavorites() {
  const container = document.querySelector("#trending-card-row")
  if (!container) return

  container.innerHTML = ""

  const count = Math.max(1, Math.min(TRENDING_CARD_COUNT, items.length))
  const randomItems = getRandomItems(items, count)

  randomItems.forEach((item) => {
    const card = createProductCard(item)
    if (card) container.appendChild(card)
  })

  const arrowsContainer = document.querySelector(
    "#trending-store-favorites .arrows"
  )
  const arrowButtons = arrowsContainer?.querySelectorAll("a") || []
  const leftBtn = arrowButtons[0] || null
  const rightBtn = arrowButtons[1] || null

  setupCarousel(container, leftBtn, rightBtn)
  equalizeAfterImages(container)
}

function setupOrderNow() {
  const container = document.querySelector("#order-now-your-left")
  if (!container) return

  container.innerHTML = ""

  const cardCount = Math.max(1, Math.min(ORDER_NOW_CARD_COUNT, items.length))
  const randomItems = getRandomItems(items, cardCount)
  randomItems.forEach((item) => {
    const card = createProductCard(item)
    if (card) container.appendChild(card)
  })

  const children = Array.from(container.children)
  const widthPercent = 100 / cardCount
  children.forEach((child) => {
    child.style.flex = `0 0 ${widthPercent}%`
    child.style.maxWidth = `${widthPercent}%`
    child.style.boxSizing = "border-box"
  })

  equalizeAfterImages(container)

  let resizeTimer
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const children = Array.from(container.children)
      const widthPercent = 100 / Math.max(children.length, 1)
      children.forEach((child) => {
        child.style.flex = `0 0 ${widthPercent}%`
        child.style.maxWidth = `${widthPercent}%`
      })
      equalizeAfterImages(container)
    }, 150)
  })
}

// Initialized everything
setupProductSections()
setupTrendingFavorites()
setupOrderNow()

// Populate tag-based UI sections from items.json
function capitalizeTag(tag) {
  return String(tag)
    .split(/[-_\s]+/)
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ""))
    .join(" ")
}

function getTagCounts(itemsArr) {
  const counts = {}
  itemsArr.forEach((it) => {
    if (!Array.isArray(it.tags)) return
    it.tags.forEach((t) => {
      const tag = String(t).trim().toLowerCase()
      if (!tag) return
      counts[tag] = (counts[tag] || 0) + 1
    })
  })
  return counts
}

function getTopTags(limit = 12) {
  const counts = getTagCounts(items)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map((e) => e[0])
}

function createTagElement(tag, highlight = false) {
  const div = document.createElement("div")
  div.className =
    "item-1 flex flex-col items-center bg-white rounded-2xl p-2 border border-gray-200 cursor-pointer transition-all duration-200 hover:border-[#B6349A] hover:shadow-md hover:scale-105"
  if (highlight) div.classList.add("border-[#B6349A]")
  const p = document.createElement("p")
  p.className = "text-sm"
  p.textContent = capitalizeTag(tag)
  div.appendChild(p)
  return div
}

function populateTagSections() {
  try {
    const trendingRow = document.getElementById("trending-tags-row")
    const orderRow = document.getElementById("order-now-tags-row")
    const tags = getTopTags(16)

    if (trendingRow) {
      trendingRow.innerHTML = ""
      tags.slice(0, 12).forEach((tag, idx) => {
        const el = createTagElement(tag, idx === 3)
        trendingRow.appendChild(el)
      })
    }

    if (orderRow) {
      orderRow.innerHTML = ""
      tags.slice(0, 10).forEach((tag, idx) => {
        const el = createTagElement(tag, idx === 3)
        orderRow.appendChild(el)
      })
    }
  } catch (err) {
    console.error("Failed to populate tag sections:", err)
  }
}

populateTagSections()

// Search results page rendering with filters
function applyFiltersAndRender() {
  const container = document.getElementById("search-results")
  const noResults = document.getElementById("no-results")
  if (!container) return

  const source = currentSearchResults.length ? currentSearchResults : []

  // Price filters
  const priceInputs = document.querySelectorAll('input[data-filter="price"]')
  let minPrice = null
  let maxPrice = null

  priceInputs.forEach((input) => {
    if (!input.checked) return
    const range = input.dataset.priceRange
    if (range === "all") {
      minPrice = null
      maxPrice = null
    } else {
      const min = input.dataset.priceMin
      const max = input.dataset.priceMax
      minPrice = min != null ? Number(min) : null
      maxPrice = max != null ? Number(max) : null
    }
  })

  // Deals filters
  const dealInputs = document.querySelectorAll('input[data-filter="deal"]')
  let requireDiscount = false
  let onlyNewArrivals = false
  dealInputs.forEach((input) => {
    if (!input.checked) return
    const type = input.dataset.dealType
    if (type === "discount") requireDiscount = true
    if (type === "new") onlyNewArrivals = true
  })

  const filtered = source.filter((item) => {
    const price = Number(item.price) || 0

    if (minPrice != null && price < minPrice) return false
    if (maxPrice != null && price > maxPrice) return false

    if (requireDiscount && !item.discount) return false

    if (onlyNewArrivals) {
      const idNum = Number(item.id)
      if (!Number.isFinite(idNum) || idNum < 1080) return false
    }

    return true
  })

  container.innerHTML = ""

  // Show or hide filter pane depending on whether there are results
  try {
    const filterPane = document.getElementById("search-filters")
    if (filterPane) {
      if (filtered.length) {
        filterPane.classList.remove("hidden")
      } else {
        filterPane.classList.add("hidden")
      }
    }
  } catch (e) {
    // ignore
  }

  if (!filtered.length) {
    if (noResults) {
      noResults.textContent = "No products found. Please adjust your filters."
      noResults.classList.remove("hidden")
    }
    return
  }

  if (noResults) noResults.classList.add("hidden")

  filtered.forEach((item) => {
    const card = createProductCard(item)
    if (card) container.appendChild(card)
  })

  equalizeAfterImages(container)
}

// Attach listeners to filter inputs so UI updates immediately
document.addEventListener("DOMContentLoaded", () => {
  // Redirect Help button on orders page
  const helpBtn = document.getElementById("help-btn")
  if (helpBtn) {
    helpBtn.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = "/help.html"
    })
  }

  // Wire up filter inputs on the search page
  const filterInputs = document.querySelectorAll('input[data-filter]')
  filterInputs.forEach((inp) => {
    inp.addEventListener("change", () => {
      applyFiltersAndRender()
    })
  })

  const clearBtn = document.getElementById("clear-filters")
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault()
      // reset price radios to 'all'
      document.querySelectorAll('input[data-filter="price"]').forEach((r) => {
        if (r.dataset.priceRange === "all") r.checked = true
      })
      // uncheck deal checkboxes
      document.querySelectorAll('input[data-filter="deal"]').forEach((c) => (c.checked = false))
      applyFiltersAndRender()
    })
  }
})

function renderSearchResults(query) {
  if (!query) return
  const q = String(query).trim().toLowerCase()
  currentSearchQuery = q

  const titleEl = document.getElementById("search-category-title")
  if (titleEl) titleEl.textContent = capitalizeTag(q)

  const source = products.length ? products : items
  currentSearchResults = source.filter((item) => {
    const title = (item.title || "").toLowerCase()
    const tags = Array.isArray(item.tags)
      ? item.tags.join(" ").toLowerCase()
      : ""
    const category = (item.category || "").toLowerCase()
    return title.includes(q) || tags.includes(q) || category.includes(q)
  })

  applyFiltersAndRender()
}

// If on the search page, read `q` param and render results
try {
  const pathname = window.location.pathname || ""
  if (pathname.endsWith("/search.html") || pathname.endsWith("search.html")) {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q") || params.get("search") || ""
    const firstInput = document.querySelector(".search-input")
    if (firstInput && q) firstInput.value = q
    if (q) {
      // Use imported items immediately, and also try products when they load
      renderSearchResults(q)
      // If async loadProducts later populates `products`, re-render once
      loadProducts().then(() => {
        if (products.length) renderSearchResults(q)
      })
    }
  }
} catch (err) {
  // ignore on pages without window or DOM
}

// Side Panel Toggle Functionality
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburger-menu-btn")
  const hamburgerIcon = document.getElementById("hamburger-icon")
  const closeIcon = document.getElementById("close-icon")
  const sidePanel = document.getElementById("side-panel")
  const closePanelBtn = document.getElementById("close-panel-btn")
  const panelOverlay = document.getElementById("panel-overlay")

  if (!hamburgerBtn || !sidePanel) return

  function openPanel() {
    sidePanel.classList.remove("-translate-x-full")
    panelOverlay?.classList.remove("hidden")
    hamburgerIcon?.classList.add("hidden")
    closeIcon?.classList.remove("hidden")
    document.body.style.overflow = "hidden" // Prevent body scroll when panel is open
  }

  function closePanel() {
    sidePanel.classList.add("-translate-x-full")
    panelOverlay?.classList.add("hidden")
    hamburgerIcon?.classList.remove("hidden")
    closeIcon?.classList.add("hidden")
    document.body.style.overflow = "" // Restore body scroll
  }

  // Open panel when hamburger is clicked
  hamburgerBtn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (sidePanel.classList.contains("-translate-x-full")) {
      openPanel()
    } else {
      closePanel()
    }
  })

  // Close panel when X button in panel is clicked
  closePanelBtn?.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    closePanel()
  })

  // Close panel when overlay is clicked
  panelOverlay?.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    closePanel()
  })

  // Close panel when clicking outside (on the panel itself, not the overlay)
  sidePanel.addEventListener("click", (e) => {
    e.stopPropagation()
  })

  // Close panel on Escape key
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      !sidePanel.classList.contains("-translate-x-full")
    ) {
      closePanel()
    }
  })
})

document.addEventListener("DOMContentLoaded", () => {
  updateCartDisplay()
})
