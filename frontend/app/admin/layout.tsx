"use client";

import { AuthGuard } from "@/src/components/auth-guard";
import { AdminSidebar } from "@/src/components/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireStaff>
      <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] min-h-screen w-screen bg-slate-100">
        <AdminSidebar />
        <main className="mx-auto min-h-screen w-full max-w-[1400px] flex-1 px-4 pb-6 pt-16 md:pl-[292px] md:pr-8 md:pt-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
