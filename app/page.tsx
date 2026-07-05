import Link from "next/link";
import { Wallet, PieChart, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-brand-pink/10 via-brand-blue/10 to-brand-purple/10">
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <Wallet className="w-16 h-16 text-brand-purple" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-pink via-brand-purple to-brand-blue">
            Money Tracker
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            จัดการเงินของคุณอย่างชาญฉลาด บันทึกรายรับ-รายจ่าย พร้อมแนบสลิปง่ายๆ ในแอปเดียว
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <PieChart className="w-10 h-10 text-brand-pink mb-4" />
            <h3 className="text-xl font-semibold mb-2">สรุปยอดชัดเจน</h3>
            <p className="text-slate-600">แยกหมวดหมู่รายรับและรายจ่าย ช่วยให้คุณเห็นภาพรวมการเงินได้ง่ายขึ้น</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <Wallet className="w-10 h-10 text-brand-blue mb-4" />
            <h3 className="text-xl font-semibold mb-2">แนบสลิปได้ทุกรายการ</h3>
            <p className="text-slate-600">รองรับการอัปโหลดรูปภาพสลิปเก็บไว้เป็นหลักฐาน ป้องกันการลืม</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <ShieldCheck className="w-10 h-10 text-brand-purple mb-4" />
            <h3 className="text-xl font-semibold mb-2">ปลอดภัยระดับโลก</h3>
            <p className="text-slate-600">ปกป้องข้อมูลของคุณด้วยระบบความปลอดภัยมาตรฐานสากล</p>
          </div>
        </div>

        <div className="pt-8">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all bg-brand-purple rounded-xl hover:bg-brand-purple/90 hover:scale-105 shadow-lg shadow-brand-purple/30"
            >
              เข้าสู่ Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all bg-brand-blue rounded-xl hover:bg-brand-blue/90 hover:scale-105 shadow-lg shadow-brand-blue/30"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-brand-purple bg-white border-2 border-brand-purple/20 transition-all rounded-xl hover:bg-brand-purple/5 hover:scale-105"
              >
                สมัครสมาชิกฟรี
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}