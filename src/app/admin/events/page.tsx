import { redirect } from "next/navigation"
import { verifyAdminSession } from "@/lib/auth"
import { AdminEventsManager } from "./_components/admin-events-manager"

export default async function AdminEventsPage() {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  return <AdminEventsManager />
}
