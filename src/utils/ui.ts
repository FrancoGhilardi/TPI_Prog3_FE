import { escapeHtml } from "./index.ts";

export function errorState(msg: string): string {
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

export function skeletonTable(rows: number): string {
  return `
    <div class="animate-pulse space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-7 w-36 bg-gray-200 rounded-xl"></div>
        <div class="h-9 w-44 bg-gray-200 rounded-xl"></div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        ${Array.from({ length: rows }, () => `<div class="h-14 mx-5 my-3 rounded-lg bg-gray-100"></div>`).join("")}
      </div>
    </div>
  `;
}
