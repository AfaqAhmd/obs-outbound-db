"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientsTable from "@/components/ClientsTable";
import toast from "react-hot-toast";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoadClients() {
      try {
        // Check if admin is authenticated first
        const adminCheckRes = await fetch("/api/admin/check");
        const adminCheckData = await adminCheckRes.json();

        if (adminCheckData.authenticated) {
          setAdmin(adminCheckData.admin);
          setIsAdmin(true);
          
          // Load clients (admins see all clients)
          const clientsRes = await fetch("/api/clients");
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
          setLoading(false);
          return;
        }

        // Check if user is authenticated
        const checkRes = await fetch("/api/user/check");
        const checkData = await checkRes.json();

        if (!checkData.authenticated) {
          router.push("/login");
          return;
        }

        setUser(checkData.user);
        setIsAdmin(false);

        // Load clients (API will filter based on user access)
        const clientsRes = await fetch("/api/clients");
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load clients");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndLoadClients();
  }, [router]);

  async function handleLogout() {
    try {
      if (isAdmin) {
        await fetch("/api/admin/logout", { method: "POST" });
        toast.success("Logged out");
        router.push("/admin/login");
      } else {
        await fetch("/api/user/logout", { method: "POST" });
        toast.success("Logged out");
        router.push("/login");
      }
    } catch (e) {
      toast.error("Failed to logout");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clients</h2>
          <p className="text-sm text-slate-400">
            View clients and their outbound datasets.
            {admin && (
              <span className="ml-2">
                Logged in as: {admin.username} (Admin)
              </span>
            )}
            {user && (
              <span className="ml-2">
                Logged in as: {user.username}
                {user.accessAllClients ? " (All clients)" : user.client ? ` (${user.client.name})` : ""}
              </span>
            )}
          </p>
        </div>
        {(admin || user) && (
          <button
            onClick={handleLogout}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
          >
            Logout
          </button>
        )}
      </div>
      <ClientsTable clients={clients} />
    </div>
  );
}

