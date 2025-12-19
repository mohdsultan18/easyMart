import {
  products,
  items,
  loadProducts,
  addItemToCart,
  formatCurrencyINR,
  createStarIcons,
  buildHighlights,
  buildReviewSamples,
  buildProductCopy,
  createProductCard,
} from "./script.js"

function setTextContent(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = value
}

function renderGalleryImages(images = [], activeIndex = 0) {
  const gallery = document.getElementById("product-gallery")
  const mainImg = document.getElementById("product-image")
  if (!gallery || !mainImg) return
  const sanitized = images.length ? images : [mainImg.src].filter(Boolean)
  gallery.innerHTML = ""
  sanitized.slice(0, 4).forEach((src, idx) => {
    const isActive = idx === activeIndex
    const button = document.createElement("button")
    button.type = "button"
    button.className = [
      "w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200",
      isActive
        ? "border-[#b6349a] bg-white shadow-[0_10px_20px_rgba(182,52,154,0.2)]"
        : "border-transparent bg-[#fef5fd]",
    ].join(" ")
    const thumb = document.createElement("img")
    thumb.src = src
    thumb.alt = `Preview ${idx + 1}`
    thumb.className = "w-8 h-8 object-contain"
    button.appendChild(thumb)
    button.addEventListener("click", () => {
      mainImg.src = src
      renderGalleryImages(sanitized, idx)
    })
    gallery.appendChild(button)
  })
  if (sanitized[activeIndex]) {
    mainImg.src = sanitized[activeIndex]
  }
}

function renderHighlightList(highlights = []) {
  const list = document.getElementById("product-highlights")
  if (!list) return
  list.innerHTML = highlights
    .map(
      (item) => `
        <li class="flex items-center gap-2 text-sm text-gray-700">
          <span class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#fef0f8] text-[#b6349a]">
            ${item.icon}
          </span>
          <span>${item.label}</span>
        </li>`
    )
    .join("")
}

function renderReviewsList(reviews = []) {
  const list = document.getElementById("reviews-list")
  if (!list) return
  list.innerHTML = reviews
    .map(
      (review) => `
      <article class="border-b border-gray-100 pb-4 last:border-none">
        <div class="flex items-center justify-between text-sm text-gray-600 mb-1.5">
          <span class="font-semibold text-[#111827]">${review.author}</span>
          <span>${review.date}</span>
        </div>
        <div class="flex items-center text-[#f97316] gap-2 text-sm mb-2">
          <div class="flex items-center">${createStarIcons(
            review.rating,
            14
          )}</div>
          <span class="text-gray-500">${review.rating.toFixed(1)}</span>
        </div>
        <p class="text-sm text-gray-600 leading-relaxed">${review.text}</p>
      </article>`
    )
    .join("")
}

function renderRatingSummary(distribution, total) {
  Object.entries(distribution).forEach(([star, count]) => {
    const bar = document.querySelector(`[data-rating-bar="${star}"]`)
    const label = document.querySelector(`[data-rating-count="${star}"]`)
    const percent = total ? Math.round((count / total) * 100) : 0
    if (bar) bar.style.width = `${percent}%`
    if (label) label.textContent = `${count}`
  })
}

function renderRecommendations(product) {
  const container = document.getElementById("product-recommendations")
  if (!container) return
  const source = products.length ? products : items
  const sameCategory = source.filter(
    (item) => item.category === product.category && item.id !== product.id
  )
  const fallback = source.filter((item) => item.id !== product.id)
  const picks = (sameCategory.length ? sameCategory : fallback).slice(0, 5)
  container.innerHTML = ""
  picks.forEach((item) => {
    const card = createProductCard(item)
    if (card) container.appendChild(card)
  })
}

function populateProductPage(product) {
  const page = document.getElementById("product-page")
  const notFound = document.getElementById("product-not-found")
  if (page) page.classList.remove("hidden")
  if (notFound) notFound.classList.add("hidden")

  const title = product.title || "Product"
  setTextContent("product-title", title)
  setTextContent("product-subtitle", product.brand ? `by ${product.brand}` : "")
  setTextContent("product-unit", product.unit || "")
  setTextContent("product-description", product.description || "")

  const badges = document.getElementById("product-badges")
  if (badges) {
    badges.innerHTML = `
      <span class="px-3 py-1 rounded-full bg-[#fef0f8] text-[#b6349a] text-xs">Best Seller</span>
      <span class="px-3 py-1 rounded-full bg-[#f1f5f9] text-[#64748b] text-xs">${
        product.category || "Groceries"
      }</span>
    `
  }

  const priceCurrent = document.getElementById("product-price-current")
  const priceOriginal = document.getElementById("product-price-original")
  const priceDiscount = document.getElementById("product-price-discount")
  const priceValue = Number(product.price) || 0
  if (priceCurrent) priceCurrent.textContent = formatCurrencyINR(priceValue)
  if (product.discount) {
    const discountStr = String(product.discount).replace("%", "")
    const discountPct = parseFloat(discountStr)
    if (!Number.isNaN(discountPct) && priceOriginal && priceDiscount) {
      const original = priceValue / (1 - discountPct / 100)
      priceOriginal.textContent = formatCurrencyINR(original)
      priceDiscount.textContent = `-${discountPct.toFixed(0)}%`
    }
  } else {
    if (priceOriginal) priceOriginal.textContent = ""
    if (priceDiscount) priceDiscount.textContent = ""
  }

  const ratingValue = product.rating || 4.6
  const reviewCount = Math.max(25, Math.round(ratingValue * 95))
  const distribution = {
    5: Math.round(reviewCount * 0.6),
    4: Math.round(reviewCount * 0.23),
    3: Math.round(reviewCount * 0.1),
    2: Math.round(reviewCount * 0.045),
    1: 0,
  }
  const distributedTotal =
    distribution[5] + distribution[4] + distribution[3] + distribution[2]
  distribution[1] = reviewCount - distributedTotal

  setTextContent("product-rating-overall", ratingValue.toFixed(1))
  setTextContent(
    "product-rating-text",
    `${ratingValue.toFixed(1)} • ${reviewCount} reviews`
  )
  setTextContent("product-review-count", `${reviewCount} Reviews`)
  const ratingStars = document.getElementById("product-rating-stars")
  if (ratingStars) ratingStars.innerHTML = createStarIcons(ratingValue, 18)
  renderRatingSummary(distribution, reviewCount)

  renderHighlightList(buildHighlights(product))
  renderGalleryImages(
    [product.image, product.image, product.image].filter(Boolean),
    0
  )
  renderReviewsList(buildReviewSamples(product))

  const copy = buildProductCopy(product)
  setTextContent("product-about", copy.about)
  setTextContent("product-storage", copy.storage)
  setTextContent("product-ingredients", copy.ingredients)

  const stockEl = document.getElementById("product-stock")
  if (stockEl) {
    stockEl.textContent =
      product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"
  }

  renderRecommendations(product)

  const viewAllLink = document.getElementById("product-view-all")
  if (viewAllLink) {
    const q =
      product.category ||
      (product.tags && product.tags[0]) ||
      product.title ||
      ""
    viewAllLink.href = q
      ? `/search.html?q=${encodeURIComponent(q)}`
      : "/search.html"
  }

  const addBtn = document.getElementById("product-add-to-cart")
  const buyBtn = document.getElementById("product-buy-now")
  const hint = document.getElementById("product-added-hint")

  addBtn?.classList.add("cursor-pointer", "hover:bg-[#9b2c86]")
  buyBtn?.classList.add("cursor-pointer", "hover:bg-[#fff0fa]")

  // Use direct assignment to avoid adding duplicate listeners when the
  // page re-renders (populateProductPage can be called twice).
  if (addBtn) {
    addBtn.onclick = (e) => {
      e.preventDefault()
      addItemToCart(product.id, 1)
      if (hint) {
        hint.textContent = "Added to cart"
        setTimeout(() => {
          if (hint.textContent === "Added to cart") hint.textContent = ""
        }, 1500)
      }
    }
  }

  if (buyBtn) {
    buyBtn.onclick = (e) => {
      e.preventDefault()
      addItemToCart(product.id, 1)
      setTimeout(() => {
        window.location.href = "/checkout.html"
      }, 100)
    }
  }
}

async function initProductPage() {
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get("id") || ""

  const renderProduct = () => {
    const dataset = products.length ? products : items
    const product = dataset.find(
      (item) => String(item.id) === String(requestedId)
    )
    if (!product) {
      document.getElementById("product-page")?.classList.add("hidden")
      document.getElementById("product-not-found")?.classList.remove("hidden")
      return
    }
    populateProductPage(product)
  }

  renderProduct()
  await loadProducts().catch(() => {})
  renderProduct()
}

document.addEventListener("DOMContentLoaded", initProductPage)
