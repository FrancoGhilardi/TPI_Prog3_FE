import type { Categoria, Producto, Usuario, Pedido } from "../types/index.ts";
import { ENDPOINTS } from "./config.ts";
import { getStorageJson, setStorageJson } from "./index.ts";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${response.statusText} — ${url}`,
    );
  }
  return response.json() as Promise<T>;
}

const CATEGORIAS_LOCAL_KEY = "categorias_local";

export function saveCategoriasLocal(categorias: Categoria[]): void {
  setStorageJson(CATEGORIAS_LOCAL_KEY, categorias);
}

export async function getCategorias(): Promise<Categoria[]> {
  // futuro: fetch('/api/categorias')
  const cached = getStorageJson<Categoria[] | null>(CATEGORIAS_LOCAL_KEY, null);
  if (cached) return cached;
  return fetchJson<Categoria[]>(ENDPOINTS.categorias);
}

const PRODUCTOS_LOCAL_KEY = "productos_local";

export function saveProductosLocal(productos: Producto[]): void {
  setStorageJson(PRODUCTOS_LOCAL_KEY, productos);
}

export async function getProductos(): Promise<Producto[]> {
  // futuro: fetch('/api/productos')
  const cached = getStorageJson<Producto[] | null>(PRODUCTOS_LOCAL_KEY, null);
  if (cached) return cached;
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

const PEDIDOS_LOCAL_KEY = "pedidos_local";

export function getPedidosLocal(): Pedido[] {
  return getStorageJson<Pedido[]>(PEDIDOS_LOCAL_KEY, []);
}

export function savePedidoLocal(pedido: Pedido): void {
  const pedidos = getPedidosLocal();
  pedidos.push(pedido);
  setStorageJson(PEDIDOS_LOCAL_KEY, pedidos);
}

export function upsertPedidoLocal(pedido: Pedido): void {
  const pedidos = getPedidosLocal();
  const idx = pedidos.findIndex((p) => p.id === pedido.id);
  if (idx !== -1) {
    pedidos[idx] = pedido;
  } else {
    pedidos.push(pedido);
  }
  setStorageJson(PEDIDOS_LOCAL_KEY, pedidos);
}
