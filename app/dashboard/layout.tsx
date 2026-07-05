import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, Wallet } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-brand-purple font-bold text-xl hover:opacity-80 transition-opacity">
            <Wallet className="text-brand-pink" /> 
            <span>MoneyTracker</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:inline-block">
              {user.email}
            </span>
            <form action="/auth/signout" method="POST">
              <button 
                type="submit" 
                className="text-slate-500 hover:text-brand-pink transition-colors flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-brand-pink/5"
              >
                <LogOut size={18} /> 
                <span className="hidden sm:inline-block">ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}