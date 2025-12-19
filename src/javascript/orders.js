import { updateCartDisplay } from "./script.js"

const DEFAULT_DELIVERY_FEE = 4.78
const DEFAULT_SERVICE_FEE = 0
const DEFAULT_CURRENCY = "₹"

function fmtDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

async function initOrdersPage() {
  updateCartDisplay()

  // If an order id is provided in the query string, try to render that order
  const params = new URLSearchParams(window.location.search)
  const id = params.get("id")
  if (id) {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    const found = orders.find((o) => o.id === id)
    if (found) {
      renderOrderConfirmation(found)
      return
    }
  }

  // Otherwise fall back to lastOrder
  const lastOrder = JSON.parse(localStorage.getItem("lastOrder") || "null")
  if (lastOrder) {
    renderOrderConfirmation(lastOrder)
  } else {
    renderDefaultOrders()
  }
}

function renderOrderConfirmation(order) {
  // Update status badge and title
  const statusBadge = document.querySelector('[class*="FEF0F8"]')
  if (statusBadge) {
    statusBadge.textContent = "In Progress"
  }

  const titleEl = document.querySelector("h2")
  if (titleEl) {
    titleEl.textContent = "Order in Progress"
  }

  const subtitleEl = document.querySelector("h2")?.nextElementSibling
  if (subtitleEl) {
    subtitleEl.textContent = `Order Arrived at ${fmtDate(order.placedAt)}`
  }

  // Update timeline dates
  const placedCircle = document.querySelector('[class*="bg-green-100"]')
  const dateElements = document.querySelectorAll(
    '[class*="text-xs text-gray-600 text-center"]'
  )

  if (dateElements.length >= 3) {
    dateElements[0].textContent = fmtDate(order.placedAt)
    dateElements[1].textContent = fmtDate(order.processingAt)
    dateElements[2].textContent = fmtDate(order.deliveryAt)
  }

  // Render items with pagination
  const itemsContainer = document.getElementById("orders-items-container")
  if (itemsContainer && Array.isArray(order.items) && order.items.length > 0) {
    const totalItems = order.items.length
    const itemsPerPage = 5
    let currentPage = 1

    function renderItemsPage(page) {
      const startIdx = (page - 1) * itemsPerPage
      const endIdx = startIdx + itemsPerPage
      const paginatedItems = order.items.slice(startIdx, endIdx)

      const html = paginatedItems
        .map((item) => {
          const total = item.price * (item.quantity || 1)
          return `
          <div class="flex items-center gap-4 pb-4 border-b last:border-b-0">
            <img
              src="${item.image}"
              alt="${item.title}"
              class="w-16 h-16 object-contain rounded bg-gray-100"
            />
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-900">${item.title}</p>
              <p class="text-xs text-gray-500 mt-1">₹${item.price.toFixed(2)}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">${item.quantity}x</p>
            </div>
          </div>
        `
        })
        .join("")
      itemsContainer.innerHTML = html
    }

    // Hide or show pagination based on item count
    const paginationDiv = document.querySelector(".flex.items-center.justify-center.gap-2.mt-6")
    if (paginationDiv) {
      if (totalItems <= 5) {
        // Show all items, hide pagination
        paginationDiv.style.display = "none"
        renderItemsPage(1)
      } else {
        // Show pagination
        paginationDiv.style.display = "flex"
        const totalPages = Math.ceil(totalItems / itemsPerPage)

        // Set up pagination buttons
        const prevBtn = paginationDiv.querySelector("button:nth-child(1)")
        const nextBtn = paginationDiv.querySelector("button:last-child")
        const pageButtons = Array.from(paginationDiv.querySelectorAll("button")).slice(1, -1)

        function updatePaginationUI() {
          // Update page button styles
          pageButtons.forEach((btn, idx) => {
            const page = idx + 1
            if (page === currentPage) {
              btn.classList.add("bg-gray-100", "text-gray-900", "font-semibold")
              btn.classList.remove("text-gray-600", "hover:bg-gray-100")
            } else {
              btn.classList.remove("bg-gray-100", "text-gray-900", "font-semibold")
              btn.classList.add("text-gray-600", "hover:bg-gray-100")
            }
          })

          // Update prev/next button states
          prevBtn.disabled = currentPage === 1
          nextBtn.disabled = currentPage === totalPages
          prevBtn.classList.toggle("opacity-50", currentPage === 1)
          nextBtn.classList.toggle("opacity-50", currentPage === totalPages)
        }

        // Add click handlers
        prevBtn.addEventListener("click", () => {
          if (currentPage > 1) {
            currentPage--
            renderItemsPage(currentPage)
            updatePaginationUI()
          }
        })

        nextBtn.addEventListener("click", () => {
          if (currentPage < totalPages) {
            currentPage++
            renderItemsPage(currentPage)
            updatePaginationUI()
          }
        })

        pageButtons.forEach((btn, idx) => {
          const page = idx + 1
          btn.addEventListener("click", () => {
            currentPage = page
            renderItemsPage(currentPage)
            updatePaginationUI()
          })
        })

        // Initial render
        renderItemsPage(currentPage)
        updatePaginationUI()
      }
    }
  }

  // Update order summary
  const summaryEl = document.getElementById("order-summary")
  if (summaryEl) {
    const computedSubtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const summary = order.summary || {}
    const itemsTotal = Number(summary.itemsTotal) || computedSubtotal
    const deliveryFee = Number(summary.deliveryFee) || DEFAULT_DELIVERY_FEE
    const serviceFee = Number(summary.serviceFee) || DEFAULT_SERVICE_FEE
    const grandTotal =
      Number(summary.total) || itemsTotal + deliveryFee + serviceFee
    const currency = summary.currency || DEFAULT_CURRENCY

    const summaryHtml = `
      <h3 class="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

      <div class="space-y-3 mb-6">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Order Number</span>
          <span class="font-semibold text-gray-900">${
            order.id || "#1223-001"
          }</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Delivery Fees</span>
          <span class="font-semibold text-gray-900">${currency}${deliveryFee.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Service Fee</span>
          <span class="font-semibold text-gray-900">${currency}${serviceFee.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm border-t pt-3">
          <span class="text-gray-600">Subtotal</span>
          <span class="font-semibold text-gray-900">${currency}${itemsTotal.toFixed(2)}</span>
        </div>
      </div>

      <div class="border-t pt-4">
        <div class="flex justify-between">
          <span class="font-semibold text-gray-900">Total</span>
          <span class="text-xl font-bold text-gray-900">${currency}${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t space-y-3">
        <div>
          <p class="text-xs text-gray-500 mb-1">Pay With</p>
          <p class="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" />
              <path d="M2 10H22" stroke="currentColor" stroke-width="2" />
            </svg>
            ${order.payment || "Razorpay"}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Delivery Address</p>
          <p class="text-sm font-semibold text-[#B6349A]">
            ${order.address || "Shopping in"} ${order.city || ""} ${order.postal || ""}
          </p>
        </div>
      </div>
    `
    summaryEl.innerHTML = summaryHtml
  }
}

function renderDefaultOrders() {
  // Render sample order items if no lastOrder exists
  const container = document.getElementById("orders-items-container")
  if (!container) return

  const items = [
    {
      name: "Sweet Green Seedless",
      price: 99.99,
      originalPrice: 150.0,
      quantity: 12,
      image: "./src/assets/images/image 1.png",
    },
    {
      name: "Sweet Green Seedless",
      price: 99.99,
      originalPrice: 150.0,
      quantity: 12,
      image: "./src/assets/images/image 1.png",
    },
    {
      name: "Sweet Green Seedless",
      price: 99.99,
      originalPrice: 150.0,
      quantity: 12,
      image: "./src/assets/images/image 1.png",
    },
    {
      name: "Sweet Green Seedless",
      price: 99.99,
      originalPrice: 150.0,
      quantity: 12,
      image: "./src/assets/images/image 1.png",
    },
  ]

  const totalItems = items.length
  const itemsPerPage = 5
  let currentPage = 1

  function renderItemsPage(page) {
    const startIdx = (page - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    const paginatedItems = items.slice(startIdx, endIdx)

    const html = paginatedItems
      .map(
        (item) => `
        <div class="flex items-center gap-4 pb-4 border-b last:border-b-0">
          <img
            src="${item.image}"
            alt="${item.name}"
            class="w-16 h-16 object-contain rounded bg-gray-100"
          />
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900">${item.name}</p>
            <p class="text-xs text-gray-500 mt-1">₹${item.price.toFixed(2)}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-900">${item.quantity}x</p>
          </div>
        </div>
      `
      )
      .join("")

    container.innerHTML = html
  }

  // Handle pagination
  const paginationDiv = document.querySelector(".flex.items-center.justify-center.gap-2.mt-6")
  if (paginationDiv) {
    if (totalItems <= 5) {
      // Show all items, hide pagination
      paginationDiv.style.display = "none"
      renderItemsPage(1)
    } else {
      // Show pagination
      paginationDiv.style.display = "flex"
      const totalPages = Math.ceil(totalItems / itemsPerPage)

      // Set up pagination buttons
      const prevBtn = paginationDiv.querySelector("button:nth-child(1)")
      const nextBtn = paginationDiv.querySelector("button:last-child")
      const pageButtons = Array.from(paginationDiv.querySelectorAll("button")).slice(1, -1)

      function updatePaginationUI() {
        // Update page button styles
        pageButtons.forEach((btn, idx) => {
          const page = idx + 1
          if (page === currentPage) {
            btn.classList.add("bg-gray-100", "text-gray-900", "font-semibold")
            btn.classList.remove("text-gray-600", "hover:bg-gray-100")
          } else {
            btn.classList.remove("bg-gray-100", "text-gray-900", "font-semibold")
            btn.classList.add("text-gray-600", "hover:bg-gray-100")
          }
        })

        // Update prev/next button states
        prevBtn.disabled = currentPage === 1
        nextBtn.disabled = currentPage === totalPages
        prevBtn.classList.toggle("opacity-50", currentPage === 1)
        nextBtn.classList.toggle("opacity-50", currentPage === totalPages)
      }

      // Add click handlers
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--
          renderItemsPage(currentPage)
          updatePaginationUI()
        }
      })

      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++
          renderItemsPage(currentPage)
          updatePaginationUI()
        }
      })

      pageButtons.forEach((btn, idx) => {
        const page = idx + 1
        btn.addEventListener("click", () => {
          currentPage = page
          renderItemsPage(currentPage)
          updatePaginationUI()
        })
      })

      // Initial render
      renderItemsPage(currentPage)
      updatePaginationUI()
    }
  }
}

document.addEventListener("DOMContentLoaded", initOrdersPage)
