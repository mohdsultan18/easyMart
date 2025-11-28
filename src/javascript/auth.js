const storageKeyUsers = "demo_users_v1"
const storageKeyCurrent = "demo_currentUser_v1"

// simple helpers
const $ = (sel) => document.querySelector(sel)
const qs = (sel) => Array.from(document.querySelectorAll(sel))

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(storageKeyUsers) || "[]")
  } catch (e) {
    return []
  }
}
function writeUsers(users) {
  localStorage.setItem(storageKeyUsers, JSON.stringify(users))
}
function setCurrent(user) {
  localStorage.setItem(storageKeyCurrent, JSON.stringify(user))
}
function getCurrent() {
  try {
    return JSON.parse(localStorage.getItem(storageKeyCurrent) || "null")
  } catch {
    return null
  }
}
function clearCurrent() {
  localStorage.removeItem(storageKeyCurrent)
}
function findUserByEmail(email) {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.split("/").pop()

  initUsersFromJson().then(() => {
    // common header buttons visibility on index.html
    setupHeaderUI()

    const path = window.location.pathname.split("/").pop() || ""

    if (path === "" || path === "index.html" || path === "/") {
      showIndexState()
    }

    // Support both `signup.html` and `/signup` style routes
    if (path === "signup.html" || path === "signup") {
      setupSignup()
    }

    // Support both `login.html` and `/login` style routes
    if (path === "login.html" || path === "login") {
      setupLogin()
    }
  })
})

async function initUsersFromJson() {
  const existing = readUsers()
  const existingEmails = new Set(
    existing.map((u) => (u.email || "").toLowerCase())
  )

  const candidates = ["/users.json", "/public/users.json"]
  for (const url of candidates) {
    try {
      const resp = await fetch(url, { cache: "no-store" })
      if (!resp.ok) continue
      const data = await resp.json()
      if (!Array.isArray(data)) continue
      const toAdd = []
      data.forEach((u) => {
        const email = (u.email || "").toLowerCase()
        if (!email) return
        if (!existingEmails.has(email)) {
          // ensure an id
          if (!u.id) u.id = Date.now() + Math.floor(Math.random() * 1000)
          toAdd.push(u)
          existingEmails.add(email)
        }
      })
      if (toAdd.length) {
        const merged = existing.concat(toAdd)
        writeUsers(merged)
      }
      return
    } catch (err) {}
  }
}

function setupHeaderUI() {
  let loginLink = document.getElementById("login-link")
  let signupLink = document.getElementById("signup-link")
  if (!loginLink)
    loginLink = document.querySelector(
      'a[href="login.html"], a[href="./login.html"]'
    )
  if (!signupLink)
    signupLink = document.querySelector(
      'a[href="signup.html"], a[href="./signup.html"]'
    )

  let logoutBtn =
    document.getElementById("logout-btn") ||
    document.getElementById("logout-btn-2")
  const loginContainer = document.querySelector(".login") || document.body

  const current = getCurrent()
  if (current) {
    if (loginLink) loginLink.classList.add("hidden")
    if (signupLink) signupLink.classList.add("hidden")

    if (logoutBtn) {
      logoutBtn.classList.remove("hidden")
      logoutBtn.addEventListener("click", () => {
        clearCurrent()
        window.location.href = "index.html"
      })
    } else if (loginLink) {
      try {
        loginLink.id = "user-display"
        loginLink.href = "#"
        loginLink.classList.remove("hidden")
        loginLink.innerHTML = ""
        loginLink.classList.add(
          "user-profile-trigger",
          "relative",
          "flex",
          "items-center",
          "gap-2",
          "px-3",
          "py-2",
          "rounded-full",
          "bg-white",
          "border",
          "border-gray-200",
          "shadow-sm",
          "hover:shadow-md",
          "transition"
        )
        loginLink.setAttribute("aria-haspopup", "true")
        loginLink.setAttribute("aria-expanded", "false")

        const initials =
          ((current.name || current.email || "").split(" ")[0] || "")
            .charAt(0)
            .toUpperCase() || "U"
        const avatar = document.createElement("span")
        avatar.className =
          "inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium"
        avatar.textContent = initials

        const label = document.createElement("div")
        label.className = "text-sm font-semibold text-gray-900"
        label.textContent = current.name || current.email

        const chevron = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        )
        chevron.setAttribute("width", "16")
        chevron.setAttribute("height", "16")
        chevron.setAttribute("viewBox", "0 0 24 24")
        chevron.classList.add(
          "text-gray-500",
          "transition-transform",
          "chevron"
        )
        chevron.innerHTML =
          '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />'

        const dropdown = document.createElement("div")
        dropdown.className =
          "absolute right-0 top-full mt-2 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-lg transition-all duration-150 transform opacity-0 pointer-events-none -translate-y-1"

        const logoutOption = document.createElement("button")
        logoutOption.id = "logout-btn"
        logoutOption.className =
          "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-100"
        logoutOption.textContent = "Log out"
        logoutOption.addEventListener("click", (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          clearCurrent()
          window.location.href = "index.html"
        })

        dropdown.appendChild(logoutOption)

        loginLink.appendChild(avatar)
        loginLink.appendChild(label)
        loginLink.appendChild(chevron)
        loginLink.appendChild(dropdown)

        let isOpen = false
        const dropdownClosed = [
          "opacity-0",
          "pointer-events-none",
          "-translate-y-1",
        ]
        const dropdownOpen = [
          "opacity-100",
          "pointer-events-auto",
          "translate-y-0",
        ]

        const setOpen = (state) => {
          isOpen = state
          loginLink.setAttribute("aria-expanded", String(state))
          if (state) {
            dropdown.classList.remove(...dropdownClosed)
            dropdown.classList.add(...dropdownOpen)
            loginLink.classList.add("ring-2", "ring-pink-200")
            chevron.classList.add("rotate-180")
          } else {
            dropdown.classList.remove(...dropdownOpen)
            dropdown.classList.add(...dropdownClosed)
            loginLink.classList.remove("ring-2", "ring-pink-200")
            chevron.classList.remove("rotate-180")
          }
        }

        loginLink.addEventListener("click", (ev) => {
          ev.preventDefault()
          setOpen(!isOpen)
        })

        document.addEventListener("click", (evt) => {
          if (!loginLink.contains(evt.target)) {
            setOpen(false)
          }
        })
      } catch (err) {
        // fallback to injecting into login container
        if (loginContainer && !document.getElementById("user-display")) {
          const div = document.createElement("div")
          div.id = "user-display"
          div.className = "flex items-center gap-2"

          const initialsF =
            ((current.name || current.email || "").split(" ")[0] || "")
              .charAt(0)
              .toUpperCase() || "U"
          const spanF = document.createElement("span")
          spanF.className =
            "inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium"
          spanF.textContent = initialsF

          const btnF = document.createElement("button")
          btnF.id = "logout-btn"
          btnF.className = "ml-2 text-sm text-gray-700"
          btnF.textContent = "Logout"
          btnF.addEventListener("click", () => {
            clearCurrent()
            window.location.href = "index.html"
          })

          div.appendChild(spanF)
          div.appendChild(btnF)
          loginContainer.appendChild(div)
        }
      }
    } else {
      if (loginContainer && !document.getElementById("user-display")) {
        const div = document.createElement("div")
        div.id = "user-display"
        div.className = "flex items-center gap-2"

        const initials =
          ((current.name || current.email || "").split(" ")[0] || "")
            .charAt(0)
            .toUpperCase() || "U"
        const span = document.createElement("span")
        span.className =
          "inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-medium"
        span.textContent = initials

        const btn = document.createElement("button")
        btn.id = "logout-btn"
        btn.className = "ml-2 text-sm text-gray-700"
        btn.textContent = "Logout"
        btn.addEventListener("click", () => {
          clearCurrent()
          window.location.href = "index.html"
        })

        div.appendChild(span)
        div.appendChild(btn)
        loginContainer.appendChild(div)
      }
    }
  } else {
    if (loginLink) loginLink.classList.remove("hidden")
    if (signupLink) signupLink.classList.remove("hidden")
    if (logoutBtn) logoutBtn.classList.add("hidden")
    const userDisplay = document.getElementById("user-display")
    if (userDisplay) userDisplay.remove()
  }
}

function showIndexState() {
  const current = getCurrent()
  if (current) {
    document.getElementById("welcome-user").classList.remove("hidden")
    document.getElementById("welcome-guest").classList.add("hidden")
    document.getElementById("user-name").textContent =
      current.name || current.email
  } else {
    document.getElementById("welcome-user").classList.add("hidden")
    document.getElementById("welcome-guest").classList.remove("hidden")
  }
}

/* --------------------- SIGNUP --------------------- */
function setupSignup() {
  const form = document.getElementById("signup-form")
  const msg = document.getElementById("signup-msg")
  const toggle = document.getElementById("toggle-signup-pw")

  if (toggle) {
    toggle.addEventListener("click", () => {
      const pw = document.getElementById("signup-password")
      if (pw.type === "password") {
        pw.type = "text"
        toggle.textContent = "Hide"
      } else {
        pw.type = "password"
        toggle.textContent = "Show"
      }
    })
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    msg.textContent = ""

    const name = document.getElementById("signup-name").value.trim()
    const email = document.getElementById("signup-email").value.trim()
    const password = document.getElementById("signup-password").value

    if (!name || !email || !password || password.length < 6) {
      msg.textContent =
        "Please complete form — password must be at least 6 characters."
      msg.classList.remove("text-green-600")
      msg.classList.add("text-red-600")
      return
    }

    const existing = findUserByEmail(email)
    if (existing) {
      msg.textContent = "Email already registered. Please log in."
      msg.classList.remove("text-green-600")
      msg.classList.add("text-red-600")
      return
    }

    const users = readUsers()
    const newUser = { id: Date.now(), name, email, password }
    users.push(newUser)
    writeUsers(users)

    msg.textContent = "Account created! Signing you in and redirecting…"
    msg.classList.remove("text-red-600")
    msg.classList.add("text-green-600")

    // auto-sign-in after signup for smoother demo UX
    setCurrent({ id: newUser.id, name: newUser.name, email: newUser.email })
    setTimeout(() => {
      window.location.href = "index.html"
    }, 900)
  })
}

/* --------------------- LOGIN --------------------- */
function setupLogin() {
  const form = document.getElementById("login-form")
  const msg = document.getElementById("login-msg")
  const toggle = document.getElementById("toggle-login-pw")

  if (toggle) {
    toggle.addEventListener("click", () => {
      const pw = document.getElementById("login-password")
      if (pw.type === "password") {
        pw.type = "text"
        toggle.textContent = "Hide"
      } else {
        pw.type = "password"
        toggle.textContent = "Show"
      }
    })
  }

  // handle login submit
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    msg.textContent = ""

    const email = document.getElementById("login-email").value.trim()
    const password = document.getElementById("login-password").value

    const user = findUserByEmail(email)
    if (!user || user.password !== password) {
      msg.textContent = "Invalid credentials (this is UI-only)."
      return
    }

    setCurrent({ id: user.id, name: user.name, email: user.email })
    window.location.href = "index.html"
  })
}
