import { isAdmin, configured } from "@/lib/auth";
import { getDraws, storageStatus } from "@/lib/db";
import { AdminLogin, AdminPanel } from "@/components/admin-panel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const authenticated = await isAdmin();
  return (
    <main id="contenido" className="admin-shell">
      {authenticated ? (
        <AdminPanel
          initialDraws={await getDraws(true)}
          storage={await storageStatus()}
        />
      ) : (
        <AdminLogin configured={configured()} storage={await storageStatus()} />
      )}
    </main>
  );
}
