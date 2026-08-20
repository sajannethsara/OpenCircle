import { cookies } from "next/headers"

const ADMIN_COOKIE_NAME = "opencircle_admin_session"

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USER || process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PSW || process.env.ADMIN_PASSWORD,
  }
}

export function verifyAdminCredentials(user: string, psw: string): boolean {
  const { username, password } = getAdminCredentials()
  return user.trim() === username && psw.trim() === password
}

export async function createAdminSession() {
  const cookieStore = await cookies()
  const { username } = getAdminCredentials()
  const token = Buffer.from(`${username}:${Date.now()}`).toString("base64")

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!sessionToken) {
    return false
  }

  try {
    const decoded = Buffer.from(sessionToken, "base64").toString("utf-8")
    const [user] = decoded.split(":")
    const { username } = getAdminCredentials()

    return user === username
  } catch {
    return false
  }
}
