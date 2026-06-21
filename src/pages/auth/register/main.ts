import "../../../style.css";
import { getUsuarios } from "../../../utils/api.ts";
import { loginDirecto, estaAutenticado, esAdmin } from "../../../utils/auth.ts";
import type { UsuarioSesion } from "../../../types/index.ts";

const ROUTES = {
  adminHome: "/src/pages/admin/adminHome/index.html",
  storeHome: "/src/pages/store/home/index.html",
  login: "/src/pages/auth/login/index.html",
};

if (estaAutenticado()) {
  window.location.replace(esAdmin() ? ROUTES.adminHome : ROUTES.storeHome);
}

const app = document.getElementById("app")!;

app.innerHTML = `
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🍔</div>
        <h1 class="text-3xl font-bold text-secondary">Food Store</h1>
        <p class="text-muted mt-1 text-sm">Creá tu cuenta</p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <form id="register-form" novalidate>

          <div class="mb-5">
            <label for="nombre" class="block text-sm font-medium text-secondary mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              autocomplete="given-name"
              placeholder="Tu nombre"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted"
            />
          </div>

          <div class="mb-5">
            <label for="email" class="block text-sm font-medium text-secondary mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autocomplete="email"
              placeholder="tu@email.com"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted"
            />
          </div>

          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-secondary mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autocomplete="new-password"
              placeholder="Mínimo 6 caracteres"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted"
            />
          </div>

          <div id="error-msg" class="hidden mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"></div>

          <button
            type="submit"
            id="submit-btn"
            class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Crear cuenta
          </button>
        </form>

        <p class="text-center text-sm text-muted mt-6">
          ¿Ya tenés cuenta?
          <a href="${ROUTES.login}" class="text-primary font-medium hover:underline">
            Iniciá sesión
          </a>
        </p>

        <p class="text-center text-xs text-muted mt-3">
          Nota: el usuario registrado no persiste tras cerrar sesión en esta versión.
        </p>
      </div>

    </div>
  </div>
`;

const form = document.getElementById("register-form") as HTMLFormElement;
const nombreInput = document.getElementById("nombre") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const errorMsg = document.getElementById("error-msg") as HTMLDivElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(msg: string): void {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function clearError(): void {
  errorMsg.textContent = "";
  errorMsg.classList.add("hidden");
}

function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Creando cuenta..." : "Crear cuenta";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!nombre) {
    showError("El nombre es requerido.");
    nombreInput.focus();
    return;
  }
  if (!email || !EMAIL_RE.test(email)) {
    showError("Ingresá un correo electrónico válido.");
    emailInput.focus();
    return;
  }
  if (password.length < 6) {
    showError("La contraseña debe tener al menos 6 caracteres.");
    passwordInput.focus();
    return;
  }

  setLoading(true);
  try {
    const usuarios = await getUsuarios();
    const existe = usuarios.some(
      (u) => u.mail.toLowerCase() === email.toLowerCase(),
    );
    if (existe) {
      showError("Ya existe una cuenta con ese correo electrónico.");
      setLoading(false);
      emailInput.focus();
      return;
    }

    const nuevoId = Math.max(...usuarios.map((u) => u.id), 0) + 1;
    const sesion: UsuarioSesion = {
      id: nuevoId,
      nombre,
      apellido: "",
      mail: email,
      rol: "USUARIO",
    };
    loginDirecto(sesion);
    window.location.href = ROUTES.storeHome;
  } catch {
    showError("Error al crear la cuenta. Intentá de nuevo.");
    setLoading(false);
  }
});
