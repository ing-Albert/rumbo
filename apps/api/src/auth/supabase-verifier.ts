import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export interface AuthVerifier {
  verify(token: string): Promise<AuthenticatedUser>;
}

export class SupabaseAuthVerifier implements AuthVerifier {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(projectUrl: string) {
    const normalizedUrl = projectUrl.replace(/\/$/, "");
    this.issuer = `${normalizedUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      audience: "authenticated"
    });
    if (!payload.sub) throw new Error("El token no contiene un usuario.");
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null
    };
  }
}

export function bearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
  return match?.[1] ?? null;
}
