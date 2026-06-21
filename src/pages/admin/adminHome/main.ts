import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import { getCategorias, getProductos, getPedidos } from "../../../utils/api.ts";
import { escapeHtml } from "../../../utils/index.ts";
import type { Estado } from "../../../types/index.ts";

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

function normalizeEstado(estado: string): Estado {
  const map: Record<string, Estado> = {
    EN_PREPARACION: "CONFIRMADO",
    ENTREGADO: "TERMINADO",
    PENDIENTE: "PENDIENTE",
    CONFIRMADO: "CONFIRMADO",
    TERMINADO: "TERMINADO",
    CANCELADO: "CANCELADO",
  };
  return map[estado] ?? "PENDIENTE";
}

const ESTADOS: Estado[] = ["PENDIENTE", "CONFIRMADO", "TERMINADO", "CANCELADO"];

const ESTADO_META: Record<Estado, { label: string; cls: string }> = {
  PENDIENTE: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMADO: { label: "Confirmado", cls: "bg-blue-100 text-blue-700" },
  TERMINADO: { label: "Terminado", cls: "bg-green-100 text-green-700" },
  CANCELADO: { label: "Cancelado", cls: "bg-red-100 text-red-600" },
};

// --- Sidebar / layout ---

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

function renderLayout(content: string): void {
  app.innerHTML = `
    <div class="min-h-screen bg-surface flex">

      <!-- Mobile overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="
        fixed top-0 left-0 h-full w-64 bg-white z-40 flex flex-col border-r border-gray-100
        -translate-x-full transition-transform duration-300
        lg:static lg:translate-x-0
      ">
        <div class="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <a href="${ROUTES.home}" class="flex items-center gap-2 font-bold text-xl text-secondary hover:text-primary transition">
            <span class="text-2xl">🍔</span>
            <span>Food Store</span>
          </a>
          <button id="sidebar-close" class="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar menú">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <p class="text-xs font-semibold text-muted uppercase tracking-wide px-3 mb-3">Gestión</p>
          ${navLink(ROUTES.adminHome, "📊", "Dashboard", true)}
          ${navLink(ROUTES.categories, "📂", "Categorías")}
          ${navLink(ROUTES.products, "🍽️", "Productos")}
          ${navLink(ROUTES.orders, "📋", "Pedidos")}
        </nav>

        <div class="p-4 border-t border-gray-100 shrink-0">
          ${navLink(ROUTES.home, "🛍️", "Ver Tienda")}
        </div>
      </aside>

      <!-- Main column -->
      <div class="flex-1 flex flex-col min-w-0">

        <header class="bg-white shadow-sm sticky top-0 z-20 shrink-0">
          <div class="h-16 flex items-center gap-3 px-4 lg:px-6">
            <button id="sidebar-toggle" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-secondary" aria-label="Abrir menú">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div class="flex-1">
              <h1 class="text-base font-semibold text-secondary">Dashboard</h1>
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

        <main class="flex-1 p-4 lg:p-6 overflow-auto">
          ${content}
        </main>
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

// --- Stat card ---

function statCard(
  icon: string,
  iconBg: string,
  label: string,
  value: number,
): string {
  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div class="w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-xl">${icon}</div>
      <div>
        <p class="text-3xl font-bold text-secondary leading-none mb-1">${value.toLocaleString("es-AR")}</p>
        <p class="text-xs text-muted font-medium">${label}</p>
      </div>
    </div>
  `;
}

// --- Summary content ---

function renderDashboardContent(
  totalCats: number,
  catsActivas: number,
  totalProds: number,
  prodsDisponibles: number,
  prodsInactivos: number,
  totalPedidos: number,
  pedidosPorEstado: Record<Estado, number>,
): string {
  return `
    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${statCard("📂", "bg-violet-100", "Total categorías", totalCats)}
      ${statCard("🍽️", "bg-blue-100", "Total productos", totalProds)}
      ${statCard("📋", "bg-orange-100", "Total pedidos", totalPedidos)}
      ${statCard("✅", "bg-green-100", "Productos disponibles", prodsDisponibles)}
    </div>

    <!-- Summary panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

      <!-- Inventario -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-secondary text-sm mb-4">Resumen de inventario</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-gray-50">
            <span class="text-sm text-muted">Categorías activas</span>
            <span class="font-semibold text-secondary">${catsActivas}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-gray-50">
            <span class="text-sm text-muted">Categorías totales</span>
            <span class="font-semibold text-secondary">${totalCats}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-gray-50">
            <span class="text-sm text-muted flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
              Productos disponibles
            </span>
            <span class="font-semibold text-secondary">${prodsDisponibles}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-muted flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              Productos no disponibles
            </span>
            <span class="font-semibold text-secondary">${prodsInactivos}</span>
          </div>
        </div>
      </div>

      <!-- Pedidos por estado -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="font-semibold text-secondary text-sm mb-4">Pedidos por estado</h2>
        <div class="space-y-3">
          ${ESTADOS.map((estado) => {
            const { label, cls } = ESTADO_META[estado];
            const count = pedidosPorEstado[estado];
            const pct =
              totalPedidos > 0 ? Math.round((count / totalPedidos) * 100) : 0;
            return `
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}">${label}</span>
                  <span class="text-sm font-semibold text-secondary">${count}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full ${cls.split(" ")[0].replace("bg-", "bg-").replace("100", "400")}" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// --- Skeleton ---

function skeletonContent(): string {
  return `
    <div class="animate-pulse space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${[1, 2, 3, 4].map(() => `<div class="bg-white rounded-2xl h-28"></div>`).join("")}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-white rounded-2xl h-52"></div>
        <div class="bg-white rounded-2xl h-52"></div>
      </div>
    </div>
  `;
}

function errorContent(msg: string): string {
  return `
    <div class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="text-5xl">⚠️</div>
      <p class="text-secondary font-medium text-center">${escapeHtml(msg)}</p>
      <button id="retry-btn" class="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition text-sm">
        Reintentar
      </button>
    </div>
  `;
}

// --- Load ---

async function loadData(): Promise<void> {
  renderLayout(skeletonContent());

  try {
    const [categorias, productos, pedidosRaw] = await Promise.all([
      getCategorias(),
      getProductos(),
      getPedidos(),
    ]);

    const pedidos = pedidosRaw.map((p) => ({
      ...p,
      estado: normalizeEstado(p.estado as string),
    }));

    const totalCats = categorias.length;
    const catsActivas = categorias.filter(
      (c) => !(c.eliminado ?? false),
    ).length;
    const totalProds = productos.length;
    const prodsDisponibles = productos.filter(
      (p) => p.disponible && !(p.eliminado ?? false),
    ).length;
    const prodsInactivos = totalProds - prodsDisponibles;
    const totalPedidos = pedidos.length;

    const pedidosPorEstado = ESTADOS.reduce<Record<Estado, number>>(
      (acc, e) => {
        acc[e] = pedidos.filter((p) => p.estado === e).length;
        return acc;
      },
      { PENDIENTE: 0, CONFIRMADO: 0, TERMINADO: 0, CANCELADO: 0 },
    );

    const content = renderDashboardContent(
      totalCats,
      catsActivas,
      totalProds,
      prodsDisponibles,
      prodsInactivos,
      totalPedidos,
      pedidosPorEstado,
    );

    renderLayout(content);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al cargar el dashboard.";
    renderLayout(errorContent(msg));
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
