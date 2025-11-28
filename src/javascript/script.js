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
let products = []
import items from "/public/items.json"

async function loadProducts() {
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

const searchInputs = document.querySelectorAll(".search-input")
const suggestionArea = document.getElementById("suggestion-area")

function getActiveSearchInput() {
  return (
    Array.from(searchInputs).find((input) => input.offsetParent !== null) ||
    searchInputs[0] ||
    null
  )
}

function positionSuggestionArea() {
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

function isSuggestionVisible() {
  return suggestionArea && !suggestionArea.classList.contains("hidden")
}

function showSuggestions(keyword) {
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
    return title.includes(keyword) || tags.includes(keyword)
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
      <div class="bg-gray-100 flex items-center gap-5 ml-2 mb-4 mt-4 mr-2 rounded-lg hover:rounded-2xl p-2 suggestion-item" data-title="${title}">
        <img src="${img}" alt="${title}" class="w-[14%] h-[14%] ml-2 object-contain" />
        <p>${title}</p>
      </div>
    `
  })

  suggestionArea.innerHTML = html
  positionSuggestionArea()
  suggestionArea.classList.remove("hidden")

  suggestionArea.querySelectorAll(".suggestion-item").forEach((div) => {
    div.addEventListener("click", () => {
      const title = div.getAttribute("data-title")
      const visibleInput = getActiveSearchInput()
      if (visibleInput) {
        visibleInput.value = title
      }
      suggestionArea.classList.add("hidden")
    })
  })
}

searchInputs.forEach((input) => {
  input.addEventListener("input", (e) => {
    showSuggestions(e.target.value.trim().toLowerCase())
  })

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      suggestionArea.classList.add("hidden")
    }
  })

  input.addEventListener("focus", (e) => {
    if (e.target.value.trim()) {
      showSuggestions(e.target.value.trim().toLowerCase())
    }
  })
})

document.addEventListener("click", (e) => {
  const isSearchInput = Array.from(searchInputs).some((input) =>
    input.contains(e.target)
  )
  if (!suggestionArea.contains(e.target) && !isSearchInput) {
    suggestionArea.classList.add("hidden")
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

function createProductCard(item) {
  if (!productTemplate) return null

  const card = productTemplate.content.firstElementChild.cloneNode(true)
  const cardElement = card.querySelector("[data-home-item]") || card

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
    priceEl.textContent = `₹${item.price}`
  }

  return card
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
