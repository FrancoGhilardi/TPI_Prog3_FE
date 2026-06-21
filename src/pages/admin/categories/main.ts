import "../../../style.css";
import { requireAuth, logout, getUsuarioActual } from "../../../utils/auth.ts";
import { getCategorias } from "../../../utils/api.ts";
import { escapeHtml } from "../../../utils/index.ts";
import type { Categoria } from "../../../types/index.ts";

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
          ${navLink(ROUTES.categories, "📂", "Categorías", true)}
          ${navLink(ROUTES.products, "🍽️", "Productos")}
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
              <h1 class="text-base font-semibold text-secondary">Categorías</h1>
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

// ─── Table ────────────────────────────────────────────────────────────────────

function imgCell(imagen: string | undefined, nombre: string): string {
  if (imagen) {
    return `<img
      src="${escapeHtml(imagen)}"
      alt="${escapeHtml(nombre)}"
      data-img-fallback
      class="w-10 h-10 rounded-lg object-cover bg-gray-100"
    >`;
  }
  return `<div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📂</div>`;
}

function wireImageFallbacks(): void {
  document
    .querySelectorAll<HTMLImageElement>("[data-img-fallback]")
    .forEach((img) => {
      img.addEventListener("error", () => {
        const fallback = document.createElement("div");
        fallback.className =
          "w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg";
        fallback.textContent = "📂";
        img.replaceWith(fallback);
      });
    });
}

function renderTable(): void {
  getMain().innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-secondary">
          Categorías
          <span class="ml-1 text-sm font-normal text-muted">(${categorias.length})</span>
        </h2>
        <button id="btn-new" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Categoría
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        ${
          categorias.length === 0
            ? `<div class="py-16 flex flex-col items-center gap-3 text-muted">
                 <span class="text-4xl">📂</span>
                 <p class="text-sm">No hay categorías. Creá una nueva.</p>
               </div>`
            : `
          <!-- Desktop table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 text-xs text-muted uppercase tracking-wide">
                  <th class="py-3.5 px-5 text-left font-semibold w-14">ID</th>
                  <th class="py-3.5 px-5 text-left font-semibold w-16">Imagen</th>
                  <th class="py-3.5 px-5 text-left font-semibold">Nombre</th>
                  <th class="py-3.5 px-5 text-left font-semibold hidden lg:table-cell">Descripción</th>
                  <th class="py-3.5 px-5 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                ${categorias
                  .map(
                    (cat) => `
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="py-3 px-5 text-muted font-mono text-xs">#${cat.id}</td>
                    <td class="py-3 px-5">${imgCell(cat.imagen, cat.nombre)}</td>
                    <td class="py-3 px-5 font-medium text-secondary">${escapeHtml(cat.nombre)}</td>
                    <td class="py-3 px-5 text-muted hidden lg:table-cell max-w-xs truncate">
                      ${cat.descripcion ? escapeHtml(cat.descripcion) : '<span class="italic text-gray-300">—</span>'}
                    </td>
                    <td class="py-3 px-5">
                      <div class="flex items-center gap-2 justify-end">
                        <button data-edit="${cat.id}"
                          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary transition">
                          Editar
                        </button>
                        <button data-delete="${cat.id}"
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

          <!-- Mobile cards -->
          <div class="md:hidden divide-y divide-gray-50">
            ${categorias
              .map(
                (cat) => `
              <div class="p-4 flex gap-3 items-start">
                <div class="shrink-0">${imgCell(cat.imagen, cat.nombre)}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="font-semibold text-secondary text-sm">${escapeHtml(cat.nombre)}</p>
                      <p class="text-xs text-muted mt-0.5 font-mono">#${cat.id}</p>
                    </div>
                  </div>
                  ${cat.descripcion ? `<p class="text-xs text-muted mt-1 line-clamp-2">${escapeHtml(cat.descripcion)}</p>` : ""}
                  <div class="flex gap-2 mt-2.5">
                    <button data-edit="${cat.id}"
                      class="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary hover:text-primary transition">
                      Editar
                    </button>
                    <button data-delete="${cat.id}"
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
      const cat = categorias.find((c) => c.id === id);
      if (cat) openModal(cat);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset["delete"]);
      const cat = categorias.find((c) => c.id === id);
      if (cat) confirmDelete(cat);
    });
  });
}

// ─── Modal create/edit ────────────────────────────────────────────────────────

function openModal(cat: Categoria | null): void {
  const isEdit = cat !== null;
  const modalRoot = document.getElementById("modal-root")!;

  modalRoot.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
           role="dialog" aria-modal="true" aria-labelledby="modal-title">

        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 id="modal-title" class="font-bold text-secondary text-base">
            ${isEdit ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button id="modal-close" class="p-1.5 rounded-lg hover:bg-gray-100 text-muted" aria-label="Cerrar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto flex-1 px-6 py-5">
          <form id="cat-form" class="space-y-4" novalidate>
            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-nombre">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                id="field-nombre"
                type="text"
                value="${isEdit ? escapeHtml(cat!.nombre) : ""}"
                maxlength="100"
                placeholder="Ej: Hamburguesas"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <p id="err-nombre" class="hidden text-xs text-red-500 mt-1">El nombre es requerido.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-descripcion">
                Descripción <span class="text-red-500">*</span>
              </label>
              <textarea
                id="field-descripcion"
                rows="3"
                maxlength="250"
                placeholder="Descripción breve de la categoría"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              >${isEdit && cat!.descripcion ? escapeHtml(cat!.descripcion) : ""}</textarea>
              <p id="err-descripcion" class="hidden text-xs text-red-500 mt-1">La descripción es requerida.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-secondary mb-1.5" for="field-imagen">
                URL de imagen <span class="text-red-500">*</span>
              </label>
              <input
                id="field-imagen"
                type="url"
                value="${isEdit && cat!.imagen ? escapeHtml(cat!.imagen) : ""}"
                placeholder="https://..."
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-secondary
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <p id="err-imagen" class="hidden text-xs text-red-500 mt-1">La URL de imagen es requerida.</p>
              <div id="img-preview" class="mt-2 ${isEdit && cat!.imagen ? "" : "hidden"}">
                <img
                  id="preview-img"
                  src="${isEdit && cat!.imagen ? escapeHtml(cat!.imagen) : ""}"
                  alt="Vista previa"
                  class="w-16 h-16 rounded-xl object-cover bg-gray-100"
                />
              </div>
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
            ${isEdit ? "Guardar cambios" : "Crear categoría"}
          </button>
        </div>
      </div>
    </div>
  `;

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

  // Focus first field
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
    const imagen = (
      document.getElementById("field-imagen") as HTMLInputElement
    ).value.trim();

    const errNombre = document.getElementById("err-nombre")!;
    const errDesc = document.getElementById("err-descripcion")!;
    const errImg = document.getElementById("err-imagen")!;
    [errNombre, errDesc, errImg].forEach((el) => el.classList.add("hidden"));

    let valid = true;
    if (!nombre) {
      errNombre.classList.remove("hidden");
      valid = false;
    }
    if (!descripcion) {
      errDesc.classList.remove("hidden");
      valid = false;
    }
    if (!imagen) {
      errImg.classList.remove("hidden");
      valid = false;
    }
    if (!valid) return;

    if (isEdit) {
      const idx = categorias.findIndex((c) => c.id === cat!.id);
      if (idx !== -1) {
        categorias[idx] = { ...categorias[idx]!, nombre, descripcion, imagen };
      }
    } else {
      categorias.push({ id: nextId++, nombre, descripcion, imagen });
    }

    closeModal();
    renderTable();
  });
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function confirmDelete(cat: Categoria): void {
  const modalRoot = document.getElementById("modal-root")!;

  modalRoot.innerHTML = `
    <div id="confirm-backdrop" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
           role="alertdialog" aria-modal="true">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">🗑️</div>
          <div>
            <h3 class="font-bold text-secondary text-sm">Eliminar categoría</h3>
            <p class="text-xs text-muted mt-0.5">Solo aplica en memoria — se restablece al recargar.</p>
          </div>
        </div>
        <p class="text-sm text-secondary">
          ¿Eliminar <strong>${escapeHtml(cat.nombre)}</strong>?
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
    categorias = categorias.filter((c) => c.id !== cat.id);
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
        ${[1, 2, 3, 4, 5]
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
    categorias = await getCategorias();
    nextId =
      categorias.length > 0 ? Math.max(...categorias.map((c) => c.id)) + 1 : 1;
    renderTable();
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error al cargar categorías.";
    getMain().innerHTML = errorContent(msg);
    document.getElementById("retry-btn")?.addEventListener("click", loadData);
  }
}

loadData();
