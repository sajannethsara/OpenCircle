import { redirect } from "next/navigation"
import { verifyAdminSession } from "@/lib/auth"

export default async function AdminPage() {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  redirect("/admin/projects")
}
