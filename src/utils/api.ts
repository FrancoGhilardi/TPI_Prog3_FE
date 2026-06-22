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

const CATEGORIAS_LOCAL_KEY = "categorias_local";

export function saveCategoriasLocal(categorias: Categoria[]): void {
  localStorage.setItem(CATEGORIAS_LOCAL_KEY, JSON.stringify(categorias));
}

export async function getCategorias(): Promise<Categoria[]> {
  // futuro: fetch('/api/categorias')
  const raw = localStorage.getItem(CATEGORIAS_LOCAL_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Categoria[];
    } catch {
      /* fall through to JSON */
    }
  }
  return fetchJson<Categoria[]>(ENDPOINTS.categorias);
}

const PRODUCTOS_LOCAL_KEY = "productos_local";

export function saveProductosLocal(productos: Producto[]): void {
  localStorage.setItem(PRODUCTOS_LOCAL_KEY, JSON.stringify(productos));
}

export async function getProductos(): Promise<Producto[]> {
  // futuro: fetch('/api/productos')
  const raw = localStorage.getItem(PRODUCTOS_LOCAL_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Producto[];
    } catch {
      /* fall through to JSON */
    }
  }
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
  const raw = localStorage.getItem(PEDIDOS_LOCAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Pedido[];
  } catch {
    return [];
  }
}

export function savePedidoLocal(pedido: Pedido): void {
  const pedidos = getPedidosLocal();
  pedidos.push(pedido);
  localStorage.setItem(PEDIDOS_LOCAL_KEY, JSON.stringify(pedidos));
}

export function upsertPedidoLocal(pedido: Pedido): void {
  const pedidos = getPedidosLocal();
  const idx = pedidos.findIndex((p) => p.id === pedido.id);
  if (idx !== -1) {
    pedidos[idx] = pedido;
  } else {
    pedidos.push(pedido);
  }
  localStorage.setItem(PEDIDOS_LOCAL_KEY, JSON.stringify(pedidos));
}
