export interface ApiError {
  type: string | null;
  title: string | null;
  status: number;
  errors: Record<string, string[]> | null;
  traceId: string | null;
  retryAfterSeconds: number | null;
}

export function toApiError(status: number, body: unknown, retryAfterHeader: string | null): ApiError {
  const raw = (body ?? {}) as Record<string, unknown>;
  return {
    type: typeof raw['type'] === 'string' ? (raw['type'] as string) : null,
    title: typeof raw['title'] === 'string' ? (raw['title'] as string) : null,
    status,
    errors: (raw['errors'] as Record<string, string[]>) ?? null,
    traceId: typeof raw['traceId'] === 'string' ? (raw['traceId'] as string) : null,
    retryAfterSeconds: retryAfterHeader ? Number(retryAfterHeader) : null,
  };
}
