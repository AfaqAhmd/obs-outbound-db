import "./globals.css";
import ToasterClient from "@/components/ToasterClient";

export const metadata = {
  title: "Outbound DB",
  description: "Multi-client outbound data warehouse"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-slate-50">
        <div className="min-h-screen flex">
          <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="px-6 py-4 border-b border-slate-800">
              <h1 className="text-lg font-semibold tracking-tight">
                Outbound DB
              </h1>
              <p className="text-xs text-slate-400">
                Multi-client outbound database
              </p>
            </div>
            <nav className="px-4 py-4 space-y-1 text-sm">
              <a
                href="/clients"
                className="block rounded px-3 py-2 text-slate-200 hover:bg-slate-800"
              >
                Clients
              </a>
              <a
                href="/upload"
                className="block rounded px-3 py-2 text-slate-200 hover:bg-slate-800"
              >
                Upload
              </a>
              <a
                href="/analytics"
                className="block rounded px-3 py-2 text-slate-200 hover:bg-slate-800"
              >
                Analytics
              </a>
              <a
                href="/admin"
                className="block rounded px-3 py-2 text-slate-200 hover:bg-slate-800"
              >
                Admin
              </a>
            </nav>
          </aside>
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-4">
              {children}
            </div>
          </main>
        </div>
        <ToasterClient />
      </body>
    </html>
  );
}


