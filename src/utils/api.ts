import type { Categoria, Producto, Usuario, Pedido } from "../types/index.ts";
import { ENDPOINTS } from "./config.ts";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${response.statusText} — ${url}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function getCategorias(): Promise<Categoria[]> {
  // futuro: fetch('/api/categorias')
  return fetchJson<Categoria[]>(ENDPOINTS.categorias);
}

export async function getProductos(): Promise<Producto[]> {
  // futuro: fetch('/api/productos')
  return fetchJson<Producto[]>(ENDPOINTS.productos);
}

export async function getUsuarios(): Promise<Usuario[]> {
  // futuro: fetch('/api/usuarios')
  return fetchJson<Usuario[]>(ENDPOINTS.usuarios);
}

export async function getPedidos(): Promise<Pedido[]> {
  // futuro: fetch('/api/pedidos')
  return fetchJson<Pedido[]>(ENDPOINTS.pedidos);
}
