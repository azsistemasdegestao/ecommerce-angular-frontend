export const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export interface DecodedJwt {
  sub: string;
  email: string;
  [ROLE_CLAIM]?: string | string[];
  exp: number;
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '='));
    return JSON.parse(json) as DecodedJwt;
  } catch {
    return null;
  }
}

export function roleFromJwt(decoded: DecodedJwt): string | null {
  const role = decoded[ROLE_CLAIM];
  if (!role) return null;
  return Array.isArray(role) ? (role[0] ?? null) : role;
}
