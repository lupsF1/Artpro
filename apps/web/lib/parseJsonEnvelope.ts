export type Envelope<T> = { code: number; message: string; data: T | null };

export function parseJsonEnvelope<T>(text: string, context: string): Envelope<T> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`${context}: 响应体为空`);
  }
  try {
    return JSON.parse(trimmed) as Envelope<T>;
  } catch {
    throw new Error(`${context}: 非合法 JSON`);
  }
}
