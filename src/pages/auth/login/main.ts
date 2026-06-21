import "../../../style.css";
import { login, estaAutenticado, esAdmin } from "../../../utils/auth.ts";

const ROUTES = {
  adminHome: "/src/pages/admin/adminHome/index.html",
  storeHome: "/src/pages/store/home/index.html",
  register: "/src/pages/auth/register/index.html",
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
        <p class="text-muted mt-1 text-sm">Iniciá sesión para continuar</p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <form id="login-form" novalidate>

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
              autocomplete="current-password"
              placeholder="••••••"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-secondary placeholder:text-muted"
            />
          </div>

          <div id="error-msg" class="hidden mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"></div>

          <button
            type="submit"
            id="submit-btn"
            class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Ingresar
          </button>
        </form>

        <p class="text-center text-sm text-muted mt-6">
          ¿No tenés cuenta?
          <a href="${ROUTES.register}" class="text-primary font-medium hover:underline">
            Registrate
          </a>
        </p>
      </div>

    </div>
  </div>
`;

const form = document.getElementById("login-form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const errorMsg = document.getElementById("error-msg") as HTMLDivElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

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
  submitBtn.textContent = loading ? "Ingresando..." : "Ingresar";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    showError("El correo electrónico es requerido.");
    emailInput.focus();
    return;
  }
  if (!password) {
    showError("La contraseña es requerida.");
    passwordInput.focus();
    return;
  }

  setLoading(true);
  try {
    const usuario = await login(email, password);
    window.location.href =
      usuario.rol === "ADMIN" ? ROUTES.adminHome : ROUTES.storeHome;
  } catch (err) {
    showError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    setLoading(false);
  }
});
