export function parseToursData<T = unknown>(raw: string): T[] {
  const sanitized = raw.replace(/^\uFEFF/, '').trim();

  if (!sanitized) {
    return [];
  }

  const parsed = JSON.parse(sanitized) as unknown;

  if (!Array.isArray(parsed)) {
    throw new SyntaxError('tours-data.json must contain a JSON array');
  }

  return parsed as T[];
}
