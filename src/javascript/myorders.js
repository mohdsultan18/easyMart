import { updateCartDisplay } from "./script.js"

function fmtDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

function renderOrdersList() {
  updateCartDisplay()
  const container = document.getElementById("orders-list")
  if (!container) return

  const list = JSON.parse(localStorage.getItem("orders") || "[]")
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = '<p class="text-gray-500">You have no orders yet.</p>'
    return
  }

  const html = list
    .map((order) => {
      const total = order.items.reduce(
        (s, it) => s + it.price * (it.quantity || 1),
        0
      )
      const status =
        order.status ||
        (new Date(order.deliveryAt) <= new Date() ? "Delivered" : "In Progress")
      const badgeClass =
        status === "Delivered"
          ? "bg-green-100 text-green-700"
          : status === "Cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-[#FEF0F8] text-[#B6349A]"

      const thumbs = (order.items || [])
        .slice(0, 5)
        .map(
          (it) =>
            `<img src="${it.image}" class="inline-block w-8 h-8 rounded bg-white mr-1" />`
        )
        .join("")
      const extra =
        (order.items || []).length > 5
          ? `<span class="inline-block ml-2 text-xs text-gray-500">+${
              (order.items || []).length - 5
            }</span>`
          : ""

      return `
      <div class="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex-1">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between md:mb-3 mb-2 gap-2 md:gap-0">
            <div>
              <div class="text-sm font-semibold">Order ${status}</div>
              <div class="text-xs text-gray-500">${fmtDate(
                order.placedAt
              )}</div>
            </div>
            <div class="text-left md:text-right">
              <div class="text-sm font-semibold">₹${total.toFixed(2)}</div>
              <div class="text-xs text-gray-500">Paid with ${
                order.payment || "card"
              }</div>
            </div>
          </div>
          <div class="flex items-center gap-2 overflow-x-auto">
            <div class="flex items-center flex-shrink-0">${thumbs}${extra}</div>
          </div>
        </div>
        <div class="md:ml-4 flex flex-col items-start md:items-end gap-2">
          <span class="px-3 py-1 rounded-full text-xs ${badgeClass}">${status}</span>
          <a href="/orders.html?id=${
            order.id
          }" class="text-sm text-[#B6349A] flex items-center gap-2">View Details <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#B6349A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </div>
      </div>
    `
    })
    .join("\n")

  container.innerHTML = html
}

document.addEventListener("DOMContentLoaded", renderOrdersList)
