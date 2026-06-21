export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeImgSrc(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol === "javascript:") return null;
    return url;
  } catch {
    return null;
  }
}
