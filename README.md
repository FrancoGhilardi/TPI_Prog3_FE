# Food Store — Frontend Web

Trabajo Práctico Integrador — Programación 3, UTN (2do año, 1er semestre).

Aplicación web multipágina para una tienda de comidas. Incluye catálogo, carrito, checkout, historial de pedidos y panel de administración completo (CRUD de categorías, productos y gestión de pedidos).

---

## Inicio rápido

```bash
pnpm install
pnpm dev
```

Servidor disponible en `http://localhost:5173`.

---

## Stack

- **Vite** — dev server y bundler
- **TypeScript** — tipado estático (strict)
- **Tailwind CSS v4** — estilos utility-first (integración vía `@tailwindcss/vite`)
- **Vanilla TS** — sin frameworks de UI
- **pnpm** — gestor de paquetes

---

## Credenciales de prueba

| Rol           | Email              | Contraseña   |
| ------------- | ------------------ | ------------ |
| Administrador | `admin@admin.com`  | `123456`     |
| Cliente       | `cliente@food.com` | `cliente123` |

---

## Constante de envío

`ENVIO = 500` (pesos argentinos, definida en `src/utils/config.ts`).

El total de cada pedido es `subtotal + ENVIO`.

---

## Divergencias del JSON provisto y decisiones tomadas

### 1. Estados de pedidos

El JSON de pedidos usa `EN_PREPARACION` y `ENTREGADO`, que no coinciden con el enum canónico del backend (`EstadoPedido`). Se normaliza en `src/utils/index.ts → normalizeEstado()`:

| JSON             | Canónico     |
| ---------------- | ------------ |
| `EN_PREPARACION` | `CONFIRMADO` |
| `ENTREGADO`      | `TERMINADO`  |
| `PENDIENTE`      | `PENDIENTE`  |

Así el frontend y el backend comparten los mismos 4 valores: `PENDIENTE`, `CONFIRMADO`, `TERMINADO`, `CANCELADO`.

### 2. IDs anidados (objetos completos, no IDs planos)

El JSON ya viene con objetos anidados:

- `productos.json` → `categoria: { id, nombre, descripcion }` (no `categoriaId`)
- `pedidos.json` → `detalles[].producto: { ...objeto completo }` y `usuarioDto: { ...objeto completo }`

Los tipos de TypeScript modelan esta estructura real. Son compatibles con los DTOs que devolvería la futura API REST.

### 3. Campo `eliminado` ausente

Ningún JSON trae el campo `eliminado`. Se trata como `false` cuando no está presente: `producto.eliminado ?? false`.

### 4. Filtro de "Mis Pedidos" por ID

Se filtra por `usuarioDto.id`, no por mail, porque el mail del usuario en `usuarios.json` (`cliente@food.com`) difiere del que figura en `pedidos.json` (`cliente@mail.com`). El `id = 2` es consistente en ambos archivos.

### 5. Persistencia en memoria

Las operaciones CRUD del panel de administración (crear, editar, eliminar categorías y productos) y los cambios de estado de pedidos **solo persisten en memoria**. Al recargar la página se vuelve al estado del JSON original. Esto es intencional para esta iteración.

Los pedidos generados desde el checkout sí persisten en `localStorage` (clave `pedidos_local`).

### 6. Usuarios registrados

Los usuarios registrados desde `/register` se guardan en sesión (`localStorage`) pero **no persisten** en `usuarios.json`. Al hacer logout se pierde la cuenta registrada y no es posible volver a iniciar sesión con esas credenciales.

### 7. fetch()

Toda la capa de datos está encapsulada en `src/utils/api.ts` con funciones (`getCategorias()`, `getProductos()`, etc.) y comentarios marcando los endpoints REST futuros (`// futuro: fetch('/api/productos')`).

---

## Estructura de páginas

```
src/pages/
  auth/login/          # FHU-01 — Iniciar sesión
  auth/register/       # FHU-02 — Registro
  store/home/          # FHU-03 — Catálogo con filtros y búsqueda
  store/productDetail/ # FHU-04 — Detalle de producto
  store/cart/          # FHU-05 — Carrito y checkout
  client/orders/       # FHU-06 — Mis pedidos
  admin/adminHome/     # FHU-07 — Dashboard administrador
  admin/categories/    # FHU-08 — CRUD Categorías
  admin/products/      # FHU-09 — CRUD Productos
  admin/orders/        # FHU-10 — Gestión de pedidos
```
