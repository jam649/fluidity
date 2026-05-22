import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { randomBytes } from "node:crypto"
import { AuthError, verifyAccessJWT, type AccessIdentity } from "./auth.js"

const dataDir = process.env.DATA_DIR ?? "/data"
const port = Number(process.env.PORT ?? 3000)
const stateFile = join(dataDir, "state.json")

await mkdir(dirname(stateFile), { recursive: true })

type Variables = { identity: AccessIdentity }
const app = new Hono<{ Variables: Variables }>()

app.use("*", async (c, next) => {
  try {
    const token = c.req.header("Cf-Access-Jwt-Assertion")
    const identity = await verifyAccessJWT(token)
    c.set("identity", identity)
    await next()
  } catch (err) {
    if (err instanceof AuthError) return c.json({ error: err.message }, err.status)
    console.error("auth error", err)
    return c.json({ error: "auth failure" }, 500)
  }
})

app.get("/api/state", async c => {
  try {
    const raw = await readFile(stateFile, "utf8")
    c.header("Content-Type", "application/json")
    return c.body(raw)
  } catch (err) {
    if (isErrno(err) && err.code === "ENOENT") {
      return c.json({ format: "fluidity-settings-v1", settings: {} })
    }
    console.error("read error", err)
    return c.json({ error: "read failure" }, 500)
  }
})

app.put("/api/state", async c => {
  const ctype = c.req.header("Content-Type") ?? ""
  if (!ctype.includes("application/json")) return c.json({ error: "expected application/json" }, 415)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid JSON body" }, 400)
  }
  if (body === null || typeof body !== "object") return c.json({ error: "body must be an object" }, 400)

  const serialized = JSON.stringify(body)
  if (serialized.length > 1_000_000) return c.json({ error: "payload too large" }, 413)

  const tmp = `${stateFile}.${randomBytes(8).toString("hex")}.tmp`
  try {
    await writeFile(tmp, serialized, "utf8")
    await rename(tmp, stateFile)
  } catch (err) {
    console.error("write error", err)
    return c.json({ error: "write failure" }, 500)
  }
  return c.json({ ok: true, bytes: serialized.length })
})

app.get("/api/healthz", c => c.json({ ok: true }))

function isErrno(err: unknown): err is Error & { code?: string } {
  return err instanceof Error && typeof (err as { code?: unknown }).code === "string"
}

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, info => {
  console.log(`malvault-api listening on :${info.port}, data=${stateFile}`)
})
