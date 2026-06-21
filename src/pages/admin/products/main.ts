import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import { getProductos, getCategorias } from "../../../utils/api.ts";
import { escapeHtml } from "../../../utils/index.ts";
import type { Producto, Categoria } from "../../../types/index.ts";

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

let productos: Producto[] = [];
let categorias: Categoria[] = [];
let nextId = 100;

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
          ${navLink(ROUTES.products, "🍽️", "Productos", true)}
          ${navLink(ROUTES.orders, "📋", "Pedidos")}
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
              <h1 class="text-base font-semibold text-secondary">Productos</h1>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function imgCell(imagen: string | undefined, nombre: string): string {
  if (imagen) {
    return `<img
      src="${escapeHtml(imagen)}"
      alt="${escapeHtml(nombre)}"
      data-img-fallback
      class="w-10 h-10 rounded-lg object-cover bg-gray-100"
    >`;
  }
  return `<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🍽️</div>`;
}

function wireImageFallbacks(): void {
  document
    .querySelectorAll<HTMLImageElement>("[data-img-fallback]")
    .forEach((img) => {
      img.addEventListener("error", () => {
        const fallback = document.createElement("div");
        fallback.className =
          "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg";
        fallback.textContent = "🍽️";
        img.replaceWith(fallback);
      });
    });
}

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString("es-AR")}`;
}

function disponibleBadge(disponible: boolean): string {
  return disponible
    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Disponible</span>`
    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">No disponible</span>`;
}

// ─── Table ────────────────────────────────────────────────────────────────────

function renderTable(): void {
  getMain().innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-secondary">
          Productos
          <span class="ml-1 text-sm font-normal text-muted">(${productos.length})</span>
        </h2>
        <button id="btn-new" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Producto
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        ${
          productos.length === 0
            ? `<div class="py-16 flex flex-col items-center gap-3 text-muted">
                 <span class="text-4xl">🍽️</span>
                 <p class="text-sm">No hay productos. Creá uno nuevo.</p>
               </div>`
            : `
          <!-- Desktop table -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 text-xs text-muted uppercase tracking-wide">
                  <th class="py-3.5 px-4 text-left font-semibold w-12">ID</th>
                  <th class="py-3.5 px-4 text-left font-semibold w-14">Img</th>
                  <th class="py-3.5 px-4 text-left font-semibold">Nombre</th>
                  <th class="py-3.5 px-4 text-left font-semibold hidden xl:table-cell">Descripción</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Precio</th>
                  <th class="py-3.5 px-4 text-left font-semibold">Categoría</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Stock</th>
                  <th class="py-3.5 px-4 text-left font-semibold">Estado</th>
                  <th class="py-3.5 px-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                ${productos
                  .map(
                    (p) => `
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="py-3 px-4 text-muted font-mono text-xs">#${p.id}</td>
                    <td class="py-3 px-4">${imgCell(p.imagen, p.nombre)}</td>
                    <td class="py-3 px-4 font-medium text-secondary max-w-[160px] truncate">${escapeHtml(p.nombre)}</td>
                    <td class="py-3 px-4 text-muted hidden xl:table-cell max-w-[200px] truncate">
                      ${p.descripcion ? escapeHtml(p.descripcion) : '<span class="italic text-gray-300">—</span>'}
                    </td>
                    <td class="py-3 px-4 text-right font-semibold text-secondary tabular-nums">${formatPrice(p.precio)}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                        ${escapeHtml(p.categoria.nombre)}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right tabular-nums ${p.stock === 0 ? "text-red-500 font-semibold" : "text-secondary"}">${p.stock}</td>
                    <td class="py-3 px-4">${disponibleBadge(p.disponible)}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2 justify-end">
                        <button data-edit="${p.id}"
                          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary transition">
                          Editar
                        </button>
                        <button data-delete="${p.id}"
                          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Tablet / Mobile cards -->
          <div class="lg:hidden divide-y divide-gray-50">
            ${productos
              .map(
                (p) => `
              <div class="p-4 flex gap-3 items-start">
                <div class="shrink-0">${imgCell(p.imagen, p.nombre)}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 flex-wrap">
                    <div class="min-w-0">
                      <p class="font-semibold text-secondary text-sm truncate">${escapeHtml(p.nombre)}</p>
                      <p class="text-xs text-muted mt-0.5 font-mono">#${p.id}</p>
                    </div>
                    <span class="font-semibold text-secondary text-sm tabular-nums shrink-0">${formatPrice(p.precio)}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                      ${escapeHtml(p.categoria.nombre)}
                    </span>
                    ${disponibleBadge(p.disponible)}
                    <span class="text-xs text-muted">Stock: <strong class="${p.stock === 0 ? "text-red-500" : "text-secondary"}">${p.stock}</strong></span>
                  </div>
                  ${p.descripcion ? `<p class="text-xs text-muted mt-1 line-clamp-2">${escapeHtml(p.descripcion)}</p>` : ""}
                  <div class="flex gap-2 mt-2.5">
                    <button data-edit="${p.id}"
                      class="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary transition">
                      Editar
                    </button>
                    <button data-delete="${p.id}"
                      class="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `
        }
      </div>
    </div>

    <div id="modal-root"></div>
  `;

  wireImageFallbacks();

  document
    .getElementById("btn-new")
    ?.addEventListener("click", () => openModal(null));

  document.querySelectorAll<HTMLElement>("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset["edit"]);
      const prod = productos.find((p) => p.id === id);
      if (prod) openModal(prod);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset["delete"]);
      const prod = productos.find((p) => p.id === id);
      if (prod) confirmDelete(prod);
    });
  });
}

// ─── Modal create/edit ────────────────────────────────────────────────────────

function categoriaOptions(selectedId: number | null): string {
  return categorias
    .map(
      (cat) =>
        `<option value="${cat.id}" ${selectedId === cat.id ? "selected" : ""}>${escapeHtml(cat.nombre)}</option>`,
    )
    .join("");
}

function openModal(prod: Producto | null): void {
  const isEdit = prod !== null;
  const modalRoot = document.getElementById("modal-root")!;

  if (categorias.length === 0) {
    modalRoot.innerHTML = `
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p class="text-sm text-secondary mb-4">No hay categorías disponibles. Creá al menos una primero.</p>
          <a href="${ROUTES.categories}" class="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
            Ir a Categorías
          </a>
        </div>
      </div>
    `;
    return;
  }

  modalRoot.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
           role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 id="modal-title" class="font-bold text-secondary text-base">
            ${isEdit ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button id="modal-close" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 px-6 py-5">
          <form id="prod-form" class="space-y-4" novalidate>

            <!-- Nombre -->
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-nombre">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                id="field-nombre"
                type="text"
                value="${isEdit ? escapeHtml(prod!.nombre) : ""}"
                maxlength="120"
                placeholder="Ej: Hamburguesa Clásica"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <p id="err-nombre" class="hidden text-xs text-red-500 mt-1">El nombre es requerido.</p>
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-descripcion">
                Descripción
              </label>
              <textarea
                id="field-descripcion"
                rows="2"
                maxlength="300"
                placeholder="Ingredientes y detalles del producto"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              >${isEdit && prod!.descripcion ? escapeHtml(prod!.descripcion) : ""}</textarea>
            </div>

            <!-- Precio + Stock -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-precio">
                  Precio <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    id="field-precio"
                    type="number"
                    min="1"
                    step="0.01"
                    value="${isEdit ? prod!.precio : ""}"
                    placeholder="0"
                    class="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <p id="err-precio" class="hidden text-xs text-red-500 mt-1">Precio debe ser mayor a 0.</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-stock">
                  Stock <span class="text-red-500">*</span>
                </label>
                <input
                  id="field-stock"
                  type="number"
                  min="0"
                  step="1"
                  value="${isEdit ? prod!.stock : ""}"
                  placeholder="0"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                <p id="err-stock" class="hidden text-xs text-red-500 mt-1">Stock debe ser ≥ 0.</p>
              </div>
            </div>

            <!-- Categoría -->
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-categoria">
                Categoría <span class="text-red-500">*</span>
              </label>
              <select
                id="field-categoria"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
              >
                <option value="">— Seleccioná una categoría —</option>
                ${categoriaOptions(isEdit ? prod!.categoria.id : null)}
              </select>
              <p id="err-categoria" class="hidden text-xs text-red-500 mt-1">Seleccioná una categoría válida.</p>
            </div>

            <!-- Imagen -->
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-imagen">
                URL de imagen
              </label>
              <input
                id="field-imagen"
                type="url"
                value="${isEdit && prod!.imagen ? escapeHtml(prod!.imagen) : ""}"
                placeholder="https://..."
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <div id="img-preview" class="mt-2 ${isEdit && prod!.imagen ? "" : "hidden"}">
                <img
                  id="preview-img"
                  src="${isEdit && prod!.imagen ? escapeHtml(prod!.imagen) : ""}"
                  alt="Vista previa"
                  class="w-16 h-16 rounded-xl object-cover bg-gray-100"
                />
              </div>
            </div>

            <!-- Disponible -->
            <div class="flex items-center gap-3">
              <input
                id="field-disponible"
                type="checkbox"
                ${isEdit ? (prod!.disponible ? "checked" : "") : "checked"}
                class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label for="field-disponible" class="text-sm font-semibold text-secondary cursor-pointer select-none">
                Disponible para la venta
              </label>
            </div>

          </form>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button id="modal-cancel"
            class="px-4 py-2 text-sm font-semibold text-secondary rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button id="modal-submit"
            class="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition">
            ${isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  `;

  // Image preview
  const imgInput = document.getElementById("field-imagen") as HTMLInputElement;
  const previewDiv = document.getElementById("img-preview")!;
  const previewImg = document.getElementById("preview-img") as HTMLImageElement;
  imgInput.addEventListener("input", () => {
    const url = imgInput.value.trim();
    if (url) {
      previewImg.src = url;
      previewDiv.classList.remove("hidden");
    } else {
      previewDiv.classList.add("hidden");
    }
  });

  (document.getElementById("field-nombre") as HTMLInputElement).focus();

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

  document.getElementById("modal-submit")?.addEventListener("click", () => {
    const nombre = (
      document.getElementById("field-nombre") as HTMLInputElement
    ).value.trim();
    const descripcion = (
      document.getElementById("field-descripcion") as HTMLTextAreaElement
    ).value.trim();
    const precioRaw = parseFloat(
      (document.getElementById("field-precio") as HTMLInputElement).value,
    );
    const stockRaw = parseInt(
      (document.getElementById("field-stock") as HTMLInputElement).value,
      10,
    );
    const categoriaId = parseInt(
      (document.getElementById("field-categoria") as HTMLSelectElement).value,
      10,
    );
    const imagen = (
      document.getElementById("field-imagen") as HTMLInputElement
    ).value.trim();
    const disponible = (
      document.getElementById("field-disponible") as HTMLInputElement
    ).checked;

    const errNombre = document.getElementById("err-nombre")!;
    const errPrecio = document.getElementById("err-precio")!;
    const errStock = document.getElementById("err-stock")!;
    const errCategoria = document.getElementById("err-categoria")!;
    [errNombre, errPrecio, errStock, errCategoria].forEach((el) =>
      el.classList.add("hidden"),
    );

    let valid = true;
    if (!nombre) {
      errNombre.classList.remove("hidden");
      valid = false;
    }
    if (!precioRaw || precioRaw <= 0) {
      errPrecio.classList.remove("hidden");
      valid = false;
    }
    if (isNaN(stockRaw) || stockRaw < 0) {
      errStock.classList.remove("hidden");
      valid = false;
    }
    const catObj = categorias.find((c) => c.id === categoriaId);
    if (!catObj) {
      errCategoria.classList.remove("hidden");
      valid = false;
    }
    if (!valid) return;

    if (isEdit) {
      const idx = productos.findIndex((p) => p.id === prod!.id);
      if (idx !== -1) {
        productos[idx] = {
          ...productos[idx]!,
          nombre,
          descripcion: descripcion || undefined,
          precio: precioRaw,
          stock: stockRaw,
          categoria: catObj!,
          imagen: imagen || undefined,
          disponible,
        };
      }
    } else {
      productos.push({
        id: nextId++,
        nombre,
        descripcion: descripcion || undefined,
        precio: precioRaw,
        stock: stockRaw,
        categoria: catObj!,
        imagen: imagen || undefined,
        disponible,
        eliminado: false,
      });
    }

    closeModal();
    renderTable();
  });
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function confirmDelete(prod: Producto): void {
  const modalRoot = document.getElementById("modal-root")!;

  modalRoot.innerHTML = `
    <div id="confirm-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
           role="alertdialog" aria-modal="true">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">🗑️</div>
          <div>
            <h3 class="font-bold text-secondary text-sm">Eliminar producto</h3>
            <p class="text-xs text-muted mt-0.5">Solo aplica en memoria — se restablece al recargar.</p>
          </div>
        </div>
        <p class="text-sm text-secondary">
          ¿Eliminar <strong>${escapeHtml(prod.nombre)}</strong>?
        </p>
        <div class="flex gap-3">
          <button id="confirm-cancel"
            class="flex-1 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button id="confirm-delete"
            class="flex-1 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `;

  function closeConfirm(): void {
    modalRoot.innerHTML = "";
  }
  document
    .getElementById("confirm-cancel")
    ?.addEventListener("click", closeConfirm);
  document
    .getElementById("confirm-backdrop")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeConfirm();
    });
  document.getElementById("confirm-delete")?.addEventListener("click", () => {
    productos = productos.filter((p) => p.id !== prod.id);
    closeConfirm();
    renderTable();
  });
}

// ─── Skeleton / Error ─────────────────────────────────────────────────────────

function skeletonContent(): string {
  return `
    <div class="animate-pulse space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-7 w-36 bg-gray-200 rounded-xl"></div>
        <div class="h-9 w-44 bg-gray-200 rounded-xl"></div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        ${[1, 2, 3, 4, 5, 6]
          .map(
            () => `<div class="h-14 mx-5 my-3 rounded-lg bg-gray-100"></div>`,
          )
          .join("")}
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
    [productos, categorias] = await Promise.all([
      getProductos(),
      getCategorias(),
    ]);
    nextId =
      productos.length > 0 ? Math.max(...productos.map((p) => p.id)) + 1 : 1;
    renderTable();
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al cargar productos.";
    getMain().innerHTML = errorContent(msg);
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
