import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

const teamDomain = required("CF_TEAM_DOMAIN")
const audience = required("CF_ACCESS_AUD")
const allowedEmail = required("ALLOWED_EMAIL").toLowerCase()

const jwksUrl = new URL(`https://${teamDomain}/cdn-cgi/access/certs`)
const jwks = createRemoteJWKSet(jwksUrl, { cooldownDuration: 60_000 })

export interface AccessIdentity {
  email: string
  sub: string
}

export class AuthError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message)
  }
}

export async function verifyAccessJWT(token: string | undefined): Promise<AccessIdentity> {
  if (!token) throw new AuthError(401, "missing Cf-Access-Jwt-Assertion")

  let payload: JWTPayload
  try {
    ;({ payload } = await jwtVerify(token, jwks, {
      issuer: `https://${teamDomain}`,
      audience,
    }))
  } catch {
    throw new AuthError(401, "invalid Access token")
  }

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : ""
  if (email !== allowedEmail) throw new AuthError(403, "email not allowed")

  return { email, sub: String(payload.sub ?? "") }
}

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`missing required env var: ${name}`)
  return v
}
