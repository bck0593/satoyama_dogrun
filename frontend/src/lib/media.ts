import { API_BASE_URL } from "@/src/lib/config";

function getApiOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
}

export function resolveMediaUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/media/")) {
    const apiOrigin = getApiOrigin();
    return apiOrigin ? `${apiOrigin}${src}` : src;
  }
  return src;
}
