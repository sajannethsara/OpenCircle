import { redirect } from "next/navigation"
import { verifyAdminSession } from "@/lib/auth"
import { AdminProjectsManager } from "./_components/admin-projects-manager"

export default async function AdminProjectsPage() {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  return <AdminProjectsManager />
}
