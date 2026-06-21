import type { UsuarioSesion } from "../types/index.ts";
import { getUsuarios } from "./api.ts";

const SESSION_KEY = "usuario_sesion";

const ROUTES = {
  login: "/src/pages/auth/login/index.html",
  adminHome: "/src/pages/admin/adminHome/index.html",
  storeHome: "/src/pages/store/home/index.html",
} as const;

export async function login(
  mail: string,
  password: string,
): Promise<UsuarioSesion> {
  const usuarios = await getUsuarios();
  const usuario = usuarios.find(
    (u) => u.mail === mail && u.password === password,
  );
  if (!usuario) {
    throw new Error("Credenciales incorrectas");
  }
  const { password: _pw, ...sesion } = usuario;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  return sesion;
}

export function loginDirecto(sesion: UsuarioSesion): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

export function getUsuarioActual(): UsuarioSesion | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = ROUTES.login;
}

export function estaAutenticado(): boolean {
  return getUsuarioActual() !== null;
}

export function esAdmin(): boolean {
  return getUsuarioActual()?.rol === "ADMIN";
}

export function requireAuth(rolRequerido?: "ADMIN" | "USUARIO"): UsuarioSesion {
  const usuario = getUsuarioActual();
  if (!usuario) {
    window.location.href = ROUTES.login;
    throw new Error("No autenticado");
  }
  if (rolRequerido && usuario.rol !== rolRequerido) {
    window.location.href =
      usuario.rol === "ADMIN" ? ROUTES.adminHome : ROUTES.storeHome;
    throw new Error("Acceso denegado");
  }
  return usuario;
}
