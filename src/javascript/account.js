import { updateCartDisplay } from "./script.js"

const STORAGE_CURRENT = "demo_currentUser_v1"
const STORAGE_USERS = "demo_users_v1"
const STORAGE_PAYMENTS = "demo_payments_v1"
const STORAGE_ADDRESSES = "demo_addresses_v1"

function readCurrent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CURRENT) || "null")
  } catch {
    return null
  }
}

function writeCurrent(user) {
  localStorage.setItem(STORAGE_CURRENT, JSON.stringify(user))
}

function updateStoredUser(user) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]")
    const idx = list.findIndex((u) => u.id === user.id)
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        name: user.name,
        email: user.email,
        phone: user.phone,
      }
      localStorage.setItem(STORAGE_USERS, JSON.stringify(list))
    }
  } catch (err) {
    // ignore
  }
}

// Payment Methods Management
function getPaymentMethods() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PAYMENTS) || "[]")
  } catch {
    return []
  }
}

function savePaymentMethods(methods) {
  localStorage.setItem(STORAGE_PAYMENTS, JSON.stringify(methods))
}

function renderPaymentMethods() {
  const container = document.getElementById("payment-methods-list")
  if (!container) return

  const methods = getPaymentMethods()
  if (methods.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500">No payment methods added yet.</p>'
    return
  }

  container.innerHTML = methods
    .map(
      (method, idx) => `
    <div class="p-4 rounded-lg border flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-8 ${
          method.type === "paypal" ? "bg-blue-600" : "bg-black"
        } rounded"></div>
        <div>
          <div class="text-sm font-semibold">${
            method.type === "paypal" ? "PayPal" : "Card"
          } ${method.lastFour || ""}</div>
          <div class="text-xs text-gray-500">Exp ${method.expiry}</div>
        </div>
      </div>
      <button class="text-pink-600 cursor-pointer delete-payment-btn" data-index="${idx}">Delete</button>
    </div>
  `
    )
    .join("")

  document.querySelectorAll(".delete-payment-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"))
      const methods = getPaymentMethods()
      methods.splice(idx, 1)
      savePaymentMethods(methods)
      renderPaymentMethods()
    })
  })
}

function setupPaymentModal() {
  const modal = document.getElementById("payment-modal")
  const form = document.getElementById("payment-form")
  const addBtn = document.querySelector('a[href="#add"]')
  const addBtnMobile = document.getElementById("add-payment-btn-mobile")
  const cancelBtn = document.getElementById("cancel-payment-btn")

  if (!modal) return

  const openModal = () => modal.classList.remove("hidden")
  const closeModal = () => {
    modal.classList.add("hidden")
    form.reset()
  }

  if (addBtn)
    addBtn.addEventListener("click", (e) => {
      e.preventDefault()
      openModal()
    })

  if (addBtnMobile) addBtnMobile.addEventListener("click", openModal)

  if (cancelBtn) cancelBtn.addEventListener("click", closeModal)

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const cardHolder = document.getElementById("card-holder").value
      const cardNumber = document.getElementById("card-number").value
      const cardExpiry = document.getElementById("card-expiry").value
      const cardCvv = document.getElementById("card-cvv").value

      if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv) {
        const msg = document.getElementById("success-message")
        if (msg) {
          msg.textContent = "Please fill in all fields"
          msg.className =
            "block mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm"
          setTimeout(() => msg.classList.add("hidden"), 3000)
        }
        return
      }

      const lastFour = cardNumber.replace(/\s/g, "").slice(-4)
      const methods = getPaymentMethods()
      methods.push({
        holder: cardHolder,
        lastFour: lastFour,
        expiry: cardExpiry,
        type: "card",
      })

      savePaymentMethods(methods)
      renderPaymentMethods()
      closeModal()
      const msg = document.getElementById("success-message")
      if (msg) {
        msg.textContent = "Card added successfully!"
        msg.className =
          "block mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm"
        msg.scrollIntoView({ behavior: "smooth", block: "nearest" })
        setTimeout(() => msg.classList.add("hidden"), 3000)
      }
    })
  }
}

// Addresses Management
function getAddresses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ADDRESSES) || "[]")
  } catch {
    return []
  }
}

function saveAddresses(addresses) {
  localStorage.setItem(STORAGE_ADDRESSES, JSON.stringify(addresses))
}

function renderAddresses() {
  const container = document.getElementById("addresses-list")
  if (!container) return

  const addresses = getAddresses()
  if (addresses.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No addresses added yet.</p>'
    return
  }

  container.innerHTML = addresses
    .map(
      (addr, idx) => `
    <label class="flex items-center justify-between bg-white rounded-lg p-4 border">
      <div class="flex items-start gap-4">
        <input type="radio" name="addr" class="mt-1" />
        <div>
          <div class="text-sm font-semibold">${addr.label || "Address"}</div>
          <div class="text-xs text-gray-500">${addr.street}, ${addr.city}, ${
        addr.state
      } ${addr.zip}</div>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="text-pink-600 cursor-pointer edit-address-btn" data-index="${idx}">Edit</button>
        <button class="text-pink-600 cursor-pointer delete-address-btn" data-index="${idx}">Delete</button>
      </div>
    </label>
  `
    )
    .join("")

  document.querySelectorAll(".delete-address-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      const idx = parseInt(e.target.getAttribute("data-index"))
      const addresses = getAddresses()
      addresses.splice(idx, 1)
      saveAddresses(addresses)
      renderAddresses()
    })
  })
}

function setupAddressModal() {
  const addBtnDesktop = document.getElementById("add-address-btn-desktop")
  const addBtnMobile = document.getElementById("add-address-btn-mobile")

  const openAddressModal = () => {
    const modalHtml = `
      <div id="address-modal" class="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg p-4 md:p-6 max-w-md w-full h-auto max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold mb-4">Add Address</h3>
          <form id="address-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Label (e.g., Home, Office)</label>
                <input type="text" id="addr-label" class="w-full border rounded px-3 py-2 text-sm md:text-base" placeholder="Home" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Street Address</label>
                <input type="text" id="addr-street" class="w-full border rounded px-3 py-2 text-sm md:text-base" placeholder="123 Main Street" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">City</label>
                <input type="text" id="addr-city" class="w-full border rounded px-3 py-2 text-sm md:text-base" placeholder="New York" required />
            </div>
              <div class="grid grid-cols-2 gap-2 md:gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">State</label>
                  <input type="text" id="addr-state" class="w-full border rounded px-3 py-2 text-sm md:text-base" placeholder="NY" required />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Zip Code</label>
                  <input type="text" id="addr-zip" class="w-full border rounded px-3 py-2 text-sm md:text-base" placeholder="10001" required />
              </div>
            </div>
              <div class="flex gap-2 md:gap-3 mt-4 md:mt-6">
                <button type="button" id="cancel-address-btn" class="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
                <button type="submit" class="flex-1 px-3 md:px-4 py-2 text-sm md:text-base bg-[#B6349A] text-white rounded-lg hover:bg-pink-700">
                Add Address
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    const existingModal = document.getElementById("address-modal")
    if (existingModal) existingModal.remove()

    document.body.insertAdjacentHTML("beforeend", modalHtml)
    const modal = document.getElementById("address-modal")
    const form = document.getElementById("address-form")
    const cancelBtn = document.getElementById("cancel-address-btn")

    const closeModal = () => modal.remove()

    cancelBtn.addEventListener("click", closeModal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal()
    })

    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const label = document.getElementById("addr-label").value
      const street = document.getElementById("addr-street").value
      const city = document.getElementById("addr-city").value
      const state = document.getElementById("addr-state").value
      const zip = document.getElementById("addr-zip").value

      const addresses = getAddresses()
      addresses.push({ label, street, city, state, zip })
      saveAddresses(addresses)
      renderAddresses()
      closeModal()
      const msg = document.getElementById("success-message")
      if (msg) {
        msg.textContent = "New address added successfully!"
        msg.className =
          "block mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm"
        msg.scrollIntoView({ behavior: "smooth", block: "nearest" })
        setTimeout(() => msg.classList.add("hidden"), 3000)
      }
    })
  }

  if (addBtnDesktop) {
    addBtnDesktop.addEventListener("click", (e) => {
      e.preventDefault()
      openAddressModal()
    })
  }

  if (addBtnMobile) {
    addBtnMobile.addEventListener("click", openAddressModal)
  }
}

function setupLogoutButton() {
  const btn = document.getElementById("logout-button")
  if (!btn) return
  btn.addEventListener("click", (e) => {
    e.preventDefault()
    localStorage.removeItem(STORAGE_CURRENT)
    window.location.href = "/login.html"
  })
}

function makeEditable(fieldId, key) {
  const p = document.getElementById(fieldId)
  if (!p) return
  const parent = p.parentElement
  const editBtn = parent.querySelector("button")
  if (!editBtn) return

  editBtn.addEventListener("click", (e) => {
    e.preventDefault()
    // Create input
    const input = document.createElement("input")
    input.type = key === "email" ? "email" : "text"
    input.value = p.textContent.trim()
    input.className = "border px-2 py-1 rounded w-64"

    const saveBtn = document.createElement("button")
    saveBtn.className =
      "ml-2 px-3 py-1 rounded bg-green-600 text-white text-sm cursor-pointer"
    saveBtn.textContent = "Save"

    const cancelBtn = document.createElement("button")
    cancelBtn.className =
      "ml-2 px-3 py-1 rounded bg-gray-200 text-sm cursor-pointer"
    cancelBtn.textContent = "Cancel"

    p.style.display = "none"
    editBtn.style.display = "none"
    parent.appendChild(input)
    parent.appendChild(saveBtn)
    parent.appendChild(cancelBtn)

    saveBtn.addEventListener("click", () => {
      const val = input.value.trim()
      if (!val) return
      p.textContent = val
      // Persist to current user and stored users
      const cur = readCurrent() || {}
      if (key === "fullname") cur.name = val
      if (key === "email") cur.email = val
      if (key === "phone") cur.phone = val
      writeCurrent(cur)
      updateStoredUser(cur)

      // cleanup
      input.remove()
      saveBtn.remove()
      cancelBtn.remove()
      p.style.display = ""
      editBtn.style.display = ""
      // update sidebar username
      const su = document.getElementById("sidebar-username")
      if (su) su.textContent = cur.name || cur.email || ""
    })

    cancelBtn.addEventListener("click", () => {
      input.remove()
      saveBtn.remove()
      cancelBtn.remove()
      p.style.display = ""
      editBtn.style.display = ""
    })
  })
}

function populateFields() {
  const cur = readCurrent()
  if (!cur) return
  const nameEl = document.getElementById("account-fullname")
  const emailEl = document.getElementById("account-email")
  const phoneEl = document.getElementById("account-phone")
  const sidebar = document.getElementById("sidebar-username")

  if (nameEl) nameEl.textContent = cur.name || ""
  if (emailEl) emailEl.textContent = cur.email || ""
  if (phoneEl) phoneEl.textContent = cur.phone || cur.phone || ""
  if (sidebar) sidebar.textContent = cur.name || cur.email || ""

  // make fields editable
  makeEditable("account-fullname", "fullname")
  makeEditable("account-email", "email")
  makeEditable("account-phone", "phone")
}

async function initAccountPage() {
  updateCartDisplay()
  setupLogoutButton()
  populateFields()

  // Check if on payment page
  if (document.getElementById("payment-methods-list")) {
    renderPaymentMethods()
    setupPaymentModal()
  }

  // Check if on addresses page
  if (document.body.textContent.includes("My Addresses")) {
    renderAddresses()
    setupAddressModal()
  }
}
document.addEventListener("DOMContentLoaded", initAccountPage)
