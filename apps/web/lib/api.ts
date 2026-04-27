/**
 * 浏览器端访问 FastAPI 基地址（CORS 需在后端放行本站 origin）
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}
