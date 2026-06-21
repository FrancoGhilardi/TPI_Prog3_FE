import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import { getPedidos, getPedidosLocal } from "../../../utils/api.ts";
import { escapeHtml } from "../../../utils/index.ts";
import type { Pedido, Estado } from "../../../types/index.ts";

const ROUTES = {
  home: "/src/pages/store/home/index.html",
  adminHome: "/src/pages/admin/adminHome/index.html",
  categories: "/src/pages/admin/categories/index.html",
  products: "/src/pages/admin/products/index.html",
  orders: "/src/pages/admin/orders/index.html",
};

requireAuth("ADMIN");
const usuario = getUsuarioActual()!;
const app = document.getElementById("app")!;

let pedidos: Pedido[] = [];
let estadoFiltro: Estado | "TODOS" = "TODOS";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADOS: Estado[] = ["PENDIENTE", "CONFIRMADO", "TERMINADO", "CANCELADO"];

const ESTADO_META: Record<
  Estado,
  { label: string; badgeCls: string; filterCls: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    badgeCls: "bg-yellow-100 text-yellow-700",
    filterCls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  CONFIRMADO: {
    label: "Confirmado",
    badgeCls: "bg-blue-100 text-blue-700",
    filterCls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  TERMINADO: {
    label: "Terminado",
    badgeCls: "bg-green-100 text-green-700",
    filterCls: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeCls: "bg-red-100 text-red-600",
    filterCls: "bg-red-100 text-red-600 border-red-200",
  },
};

const FORMA_PAGO_LABEL: Record<string, string> = {
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeEstado(raw: string): Estado {
  const map: Record<string, Estado> = {
    EN_PREPARACION: "CONFIRMADO",
    ENTREGADO: "TERMINADO",
    PENDIENTE: "PENDIENTE",
    CONFIRMADO: "CONFIRMADO",
    TERMINADO: "TERMINADO",
    CANCELADO: "CANCELADO",
  };
  return map[raw] ?? "PENDIENTE";
}

function formatFecha(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function estadoBadge(estado: Estado): string {
  const { label, badgeCls } = ESTADO_META[estado];
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCls}">${label}</span>`;
}

function clienteNombre(p: Pedido): string {
  return `${escapeHtml(p.usuarioDto.nombre)} ${escapeHtml(p.usuarioDto.apellido)}`;
}

function filteredPedidos(): Pedido[] {
  return estadoFiltro === "TODOS"
    ? pedidos
    : pedidos.filter((p) => p.estado === estadoFiltro);
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function navLink(
  href: string,
  icon: string,
  label: string,
  active = false,
): string {
  const base =
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors";
  const cls = active
    ? `${base} bg-primary text-white`
    : `${base} text-secondary hover:bg-orange-50 hover:text-primary`;
  return `<a href="${href}" class="${cls}">${icon} ${label}</a>`;
}

function renderLayout(): void {
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex">
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden"></div>
      <aside id="sidebar" class="
        fixed top-0 left-0 h-full w-64 bg-white z-40 flex flex-col border-r border-gray-100
        -translate-x-full transition-transform duration-300 lg:static lg:translate-x-0
      ">
        <div class="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <a href="${ROUTES.home}" class="flex items-center gap-2 font-bold text-xl text-secondary hover:text-primary transition">
            <span class="text-2xl">🍔</span><span>Food Store</span>
          </a>
          <button id="sidebar-close" class="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar menú">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <p class="text-xs font-semibold text-muted uppercase tracking-wide px-3 mb-3">Gestión</p>
          ${navLink(ROUTES.adminHome, "📊", "Dashboard")}
          ${navLink(ROUTES.categories, "📂", "Categorías")}
          ${navLink(ROUTES.products, "🍽️", "Productos")}
          ${navLink(ROUTES.orders, "📋", "Pedidos", true)}
        </nav>
        <div class="p-4 border-t border-gray-100 shrink-0">
          ${navLink(ROUTES.home, "🛍️", "Ver Tienda")}
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="bg-white shadow-sm sticky top-0 z-20 shrink-0">
          <div class="h-16 flex items-center gap-3 px-4 lg:px-6">
            <button id="sidebar-toggle" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-secondary" aria-label="Abrir menú">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div class="flex-1">
              <h1 class="text-base font-semibold text-secondary">Pedidos</h1>
            </div>
            <span class="hidden md:block text-sm text-muted">
              Hola, <strong class="text-secondary">${escapeHtml(usuario.nombre)}</strong>
            </span>
            <span class="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Admin</span>
            <button id="logout-btn" class="p-2 rounded-xl hover:bg-gray-100 transition text-muted hover:text-secondary" aria-label="Cerrar sesión">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>
        <main id="main-content" class="flex-1 p-4 lg:p-6 overflow-auto"></main>
      </div>
    </div>
  `;

  const sidebar = document.getElementById("sidebar")!;
  const overlay = document.getElementById("sidebar-overlay")!;
  function openSidebar(): void {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeSidebar(): void {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
  document
    .getElementById("sidebar-toggle")
    ?.addEventListener("click", openSidebar);
  document
    .getElementById("sidebar-close")
    ?.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);
  document.getElementById("logout-btn")!.addEventListener("click", logout);
}

function getMain(): HTMLElement {
  return document.getElementById("main-content")!;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function orderCard(p: Pedido): string {
  const cantProductos = p.detalles.reduce((sum, d) => sum + d.cantidad, 0);
  const primeros = p.detalles.slice(0, 2);
  const resto = p.detalles.length - 2;

  return `
    <div data-order-id="${p.id}"
      class="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 cursor-pointer
             hover:shadow-md hover:ring-1 hover:ring-primary/20 transition-all">

      <!-- Top row -->
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-bold text-secondary text-sm">Pedido #${p.id}</p>
          <p class="text-xs text-muted mt-0.5">${clienteNombre(p)}</p>
        </div>
        <div class="shrink-0 text-right">
          ${estadoBadge(p.estado)}
          <p class="text-xs text-muted mt-1">${formatFecha(p.fecha)}</p>
        </div>
      </div>

      <!-- Products preview -->
      <div class="text-xs text-muted space-y-0.5">
        ${primeros
          .map(
            (d) =>
              `<p class="truncate">× ${d.cantidad} ${escapeHtml(d.producto.nombre)}</p>`,
          )
          .join("")}
        ${resto > 0 ? `<p class="text-muted italic">+ ${resto} producto${resto > 1 ? "s" : ""} más</p>` : ""}
      </div>

      <!-- Bottom row -->
      <div class="flex items-center justify-between pt-1 border-t border-gray-50">
        <span class="text-xs text-muted">${cantProductos} ítem${cantProductos !== 1 ? "s" : ""} · ${escapeHtml(FORMA_PAGO_LABEL[p.formaPago] ?? p.formaPago)}</span>
        <span class="font-bold text-secondary text-sm">${formatPrice(p.total)}</span>
      </div>
    </div>
  `;
}

function renderCards(): void {
  const visible = filteredPedidos();
  getMain().innerHTML = `
    <div class="space-y-4">

      <!-- Header + filter -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 class="text-lg font-bold text-secondary flex-1">
          Pedidos
          <span class="ml-1 text-sm font-normal text-muted">(${pedidos.length})</span>
        </h2>
        <!-- Estado filter -->
        <div class="flex flex-wrap gap-2">
          <button data-filter="TODOS"
            class="filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                   ${estadoFiltro === "TODOS" ? "bg-secondary text-white border-secondary" : "bg-white text-secondary border-gray-200 hover:bg-gray-50"}">
            Todos (${pedidos.length})
          </button>
          ${ESTADOS.map((e) => {
            const count = pedidos.filter((p) => p.estado === e).length;
            const active = estadoFiltro === e;
            const { label, filterCls } = ESTADO_META[e];
            return `
              <button data-filter="${e}"
                class="filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                       ${active ? filterCls : "bg-white text-secondary border-gray-200 hover:bg-gray-50"}">
                ${label} (${count})
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Cards grid -->
      ${
        visible.length === 0
          ? `<div class="py-16 flex flex-col items-center gap-3 text-muted bg-white rounded-2xl">
               <span class="text-4xl">📋</span>
               <p class="text-sm">No hay pedidos${estadoFiltro !== "TODOS" ? ` con estado "${ESTADO_META[estadoFiltro as Estado].label}"` : ""}</p>
             </div>`
          : `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               ${visible.map(orderCard).join("")}
             </div>`
      }
    </div>

    <div id="modal-root"></div>
  `;

  // Filter buttons
  document.querySelectorAll<HTMLElement>("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset["filter"]!;
      estadoFiltro = val === "TODOS" ? "TODOS" : (val as Estado);
      renderCards();
    });
  });

  // Order card click → detail modal
  document.querySelectorAll<HTMLElement>("[data-order-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset["orderId"]);
      const pedido = pedidos.find((p) => p.id === id);
      if (pedido) openDetailModal(pedido);
    });
  });
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function openDetailModal(pedido: Pedido): void {
  const modalRoot = document.getElementById("modal-root")!;

  const subtotal = pedido.detalles.reduce((sum, d) => sum + d.subtotal, 0);

  modalRoot.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
           role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 id="modal-title" class="font-bold text-secondary text-base">Pedido #${pedido.id}</h2>
            <p class="text-xs text-muted mt-0.5">${formatFecha(pedido.fecha)}</p>
          </div>
          <button id="modal-close" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          <!-- Estado + cambio -->
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Estado actual</p>
              ${estadoBadge(pedido.estado)}
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5" for="select-estado">
                Cambiar estado
              </label>
              <select id="select-estado"
                class="px-3 py-2 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white">
                ${ESTADOS.map(
                  (e) =>
                    `<option value="${e}" ${pedido.estado === e ? "selected" : ""}>${ESTADO_META[e].label}</option>`,
                ).join("")}
              </select>
            </div>
          </div>

          <!-- Cliente -->
          <div>
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Cliente</p>
            <div class="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p class="text-xs text-muted">Nombre</p>
                <p class="font-medium text-secondary">${clienteNombre(pedido)}</p>
              </div>
              <div>
                <p class="text-xs text-muted">Correo</p>
                <p class="font-medium text-secondary truncate">${escapeHtml(pedido.usuarioDto.mail)}</p>
              </div>
              ${
                pedido.usuarioDto.celular
                  ? `<div>
                       <p class="text-xs text-muted">Celular</p>
                       <p class="font-medium text-secondary">${escapeHtml(pedido.usuarioDto.celular)}</p>
                     </div>`
                  : ""
              }
              <div>
                <p class="text-xs text-muted">Forma de pago</p>
                <p class="font-medium text-secondary">${escapeHtml(FORMA_PAGO_LABEL[pedido.formaPago] ?? pedido.formaPago)}</p>
              </div>
            </div>
          </div>

          <!-- Productos -->
          <div>
            <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Productos</p>
            <div class="rounded-xl border border-gray-100 overflow-hidden">
              ${pedido.detalles
                .map(
                  (d, i) => `
                <div class="flex items-center gap-3 px-4 py-3 ${i < pedido.detalles.length - 1 ? "border-b border-gray-50" : ""}">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-secondary truncate">${escapeHtml(d.producto.nombre)}</p>
                    <p class="text-xs text-muted">${formatPrice(d.producto.precio)} × ${d.cantidad}</p>
                  </div>
                  <p class="text-sm font-semibold text-secondary tabular-nums shrink-0">${formatPrice(d.subtotal)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <!-- Resumen -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div class="flex justify-between text-muted">
              <span>Subtotal</span>
              <span class="tabular-nums">${formatPrice(subtotal)}</span>
            </div>
            ${
              pedido.total !== subtotal
                ? `<div class="flex justify-between text-muted">
                     <span>Envío</span>
                     <span class="tabular-nums">${formatPrice(pedido.total - subtotal)}</span>
                   </div>`
                : ""
            }
            <div class="flex justify-between font-bold text-secondary border-t border-gray-200 pt-2">
              <span>Total</span>
              <span class="tabular-nums">${formatPrice(pedido.total)}</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button id="modal-cancel"
            class="px-4 py-2 text-sm font-semibold text-secondary rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Cerrar
          </button>
          <button id="modal-save"
            class="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition">
            Guardar estado
          </button>
        </div>
      </div>
    </div>
  `;

  function closeModal(): void {
    modalRoot.innerHTML = "";
  }
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  document
    .getElementById("modal-cancel")
    ?.addEventListener("click", closeModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById("modal-save")?.addEventListener("click", () => {
    const nuevoEstado = (
      document.getElementById("select-estado") as HTMLSelectElement
    ).value as Estado;
    const idx = pedidos.findIndex((p) => p.id === pedido.id);
    if (idx !== -1) {
      pedidos[idx] = { ...pedidos[idx]!, estado: nuevoEstado };
    }
    closeModal();
    renderCards();
  });
}

// ─── Skeleton / Error ─────────────────────────────────────────────────────────

function skeletonContent(): string {
  return `
    <div class="animate-pulse space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-7 w-28 bg-gray-200 rounded-xl"></div>
        <div class="flex gap-2">
          ${[1, 2, 3, 4, 5].map(() => `<div class="h-8 w-24 bg-gray-200 rounded-xl"></div>`).join("")}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${[1, 2, 3, 4, 5, 6].map(() => `<div class="bg-white rounded-2xl h-36 shadow-sm"></div>`).join("")}
      </div>
    </div>
  `;
}

function errorContent(msg: string): string {
  return `
    <div class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="text-5xl">⚠️</div>
      <p class="text-secondary font-medium text-center">${escapeHtml(msg)}</p>
      <button id="retry-btn"
        class="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm">
        Reintentar
      </button>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  renderLayout();
  getMain().innerHTML = skeletonContent();
  try {
    const jsonPedidos = await getPedidos();
    const localPedidos = getPedidosLocal();

    // Merge + normalize estados + deduplicate by id (local takes precedence)
    const byId = new Map<number, Pedido>();
    [...jsonPedidos, ...localPedidos].forEach((p) => {
      byId.set(p.id, { ...p, estado: normalizeEstado(p.estado as string) });
    });

    pedidos = [...byId.values()].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    renderCards();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al cargar pedidos.";
    getMain().innerHTML = errorContent(msg);
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
