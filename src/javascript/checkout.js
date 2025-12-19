const RAZORPAY_KEY = "rzp_test_1DP5mmOlF5G5ag"
const DELIVERY_FEE = 4.78
const SERVICE_FEE = 0

// Toggle sections
document.querySelectorAll(".checkout-section-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section")
    const content = document.getElementById(`${section}-content`)
    const isOpen = !content.classList.contains("hidden")

    // Close all sections
    document.querySelectorAll("[id$='-content']").forEach((el) => {
      el.classList.add("hidden")
    })

    // Open clicked section (if it was closed)
    if (!isOpen) {
      content.classList.remove("hidden")
    }
  })
})

function computeSummary(cart) {
  const itemsTotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0
    const qty = Number(item.quantity) || 0
    return sum + price * qty
  }, 0)
  const grandTotal = itemsTotal + DELIVERY_FEE + SERVICE_FEE
  return {
    itemsTotal,
    deliveryFee: DELIVERY_FEE,
    serviceFee: SERVICE_FEE,
    grandTotal,
  }
}

function saveOrder(order) {
  try {
    localStorage.setItem("lastOrder", JSON.stringify(order))
    try {
      const all = JSON.parse(localStorage.getItem("orders") || "[]")
      all.unshift(order)
      localStorage.setItem("orders", JSON.stringify(all))
    } catch (err) {
      // ignore secondary history failure
    }
  } catch (err) {
    console.error("Failed to save order:", err)
  }
}

function startRazorpayPayment(order, summary) {
  if (typeof Razorpay === "undefined") {
    alert("Razorpay SDK failed to load. Please check your network and try again.")
    return
  }

  const amountPaise = Math.max(1, Math.round(summary.grandTotal * 100))

  const rzp = new Razorpay({
    key: RAZORPAY_KEY,
    amount: amountPaise,
    currency: "INR",
    name: "EasyMart",
    description: "Sandbox checkout",
    theme: { color: "#B6349A" },
    prefill: {
      name: "EasyMart User",
      email: "test@example.com",
      contact: "9999999999",
    },
    handler: function (response) {
      order.payment = "razorpay"
      order.paymentId = response.razorpay_payment_id
      saveOrder(order)
      localStorage.removeItem("cart")
      window.location.href = "/orders.html?id=" + encodeURIComponent(order.id)
    },
  })

  rzp.on("payment.failed", (response) => {
    alert("Payment failed: " + (response?.error?.description || "Please try again."))
  })

  rzp.open()
}

// Load and display cart items in review section
async function loadCheckoutData() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("demo_currentUser_v1") || "null")
  if (!currentUser) {
    // Show message and redirect to login
    const messageEl = document.getElementById("login-required-message")
    if (messageEl) {
      messageEl.classList.remove("hidden")
      messageEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
    setTimeout(() => {
      window.location.href = "/login.html"
    }, 2000)
    return
  }

  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const reviewItems = document.getElementById("review-items")

  if (cart.length === 0) {
    reviewItems.innerHTML = '<p class="text-gray-500 text-sm">No items in cart</p>'
    return
  }

  let total = 0
  const html = cart
    .map((item) => {
      const itemTotal = item.price * item.quantity
      total += itemTotal
      return `
      <div class="flex items-center gap-4 py-3 border-b border-gray-100">
        <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-contain rounded-lg bg-gray-100" />
        <div class="flex-1">
          <p class="text-sm font-medium text-[#111827]">${item.title}</p>
          <p class="text-xs text-gray-500">Qty: ${item.quantity}</p>
        </div>
        <p class="text-sm font-semibold text-[#111827]">₹${itemTotal.toFixed(2)}</p>
      </div>
    `
    })
    .join("")

  reviewItems.innerHTML = html

  // Update summary using shared calculation
  const summary = computeSummary(cart)
  document.getElementById("summary-items-total").textContent = `₹${summary.itemsTotal.toFixed(2)}`
  document.getElementById("summary-delivery-fee").textContent = `₹${summary.deliveryFee.toFixed(2)}`
  document.getElementById("summary-service-fee").textContent = `₹${summary.serviceFee.toFixed(2)}`
  document.getElementById("summary-total").textContent = `₹${summary.grandTotal.toFixed(2)}`
  const paySummary = document.getElementById("payment-summary-text")
  if (paySummary) paySummary.textContent = "Razorpay (Sandbox)"
}

// Place order
document.getElementById("place-order-btn")?.addEventListener("click", () => {
  const address = (document.getElementById("delivery-address")?.value || "").trim()
  const city = (document.getElementById("delivery-city")?.value || "").trim()
  const postal = (document.getElementById("delivery-postal")?.value || "").trim()

  const missing = []
  if (!address) missing.push("Delivery Address")
  if (!city) missing.push("City")
  if (!postal) missing.push("Postal Code")

  if (missing.length) {
    // Clear previous inline errors
    document.querySelectorAll('.checkout-error').forEach(e => e.remove())

    const fieldMap = {
      'Delivery Address': { selector: '#delivery-address', section: 'delivery' },
      'City': { selector: '#delivery-city', section: 'delivery' },
      'Postal Code': { selector: '#delivery-postal', section: 'delivery' },
    }

    let firstInvalid = null

    missing.forEach(name => {
      const info = fieldMap[name]
      if (!info) return

      // Expand the section containing the field
      const content = document.getElementById(info.section + '-content')
      if (content && content.classList.contains('hidden')) content.classList.remove('hidden')

      const el = document.querySelector(info.selector)
      if (el) {
        const err = document.createElement('div')
        err.className = 'text-red-600 text-xs mt-1 checkout-error'
        err.textContent = 'This field is required'
        el.insertAdjacentElement('afterend', err)
        if (!firstInvalid) firstInvalid = el
      }
    })

    if (firstInvalid) firstInvalid.focus()
    return
  }

  // All good — create order object and redirect to order page
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const summary = computeSummary(cart)
  const placedAt = new Date()
  const processingAt = new Date(placedAt.getTime() + 24 * 60 * 60 * 1000) // +1 day
  const deliveryAt = new Date(placedAt.getTime() + 4 * 24 * 60 * 60 * 1000) // +4 days

  const order = {
    id: 'ORD-' + Date.now(),
    placedAt: placedAt.toISOString(),
    processingAt: processingAt.toISOString(),
    deliveryAt: deliveryAt.toISOString(),
    items: cart,
    address,
    city,
    postal,
    payment: "razorpay",
    summary: {
      itemsTotal: summary.itemsTotal,
      deliveryFee: summary.deliveryFee,
      serviceFee: summary.serviceFee,
      total: summary.grandTotal,
      currency: "INR",
    },
  }

  startRazorpayPayment(order, summary)
})

// Initialize
document.addEventListener("DOMContentLoaded", loadCheckoutData)
