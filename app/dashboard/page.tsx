import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";
import { Transaction } from "@/types";
import DashboardCharts from "@/app/components/DashboardCharts";
import TransactionActions from "@/app/components/TransactionActions";
import ReceiptViewer from "@/app/components/ReceiptViewer"; // <-- Import ตัวใหม่

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("ไม่สามารถโหลดข้อมูลได้");

  const typedTransactions: Transaction[] = (transactions as Transaction[]) || [];

  const totalIncome = typedTransactions
    .filter(tx => tx.transaction_type === "INCOME")
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalExpense = typedTransactions
    .filter(tx => tx.transaction_type === "EXPENSE")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;
  
  // คำนวณสัดส่วน (Ratio) รายจ่ายเทียบกับรายรับ
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);
  const isOverspent = totalExpense > totalIncome;

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">ภาพรวมการเงิน</h1>
          <p className="text-slate-500 mt-1">สรุปรายรับ-รายจ่ายของคุณทั้งหมด</p>
        </div>
        <Link 
          href="/dashboard/new" 
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-medium rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-brand-purple/20"
        >
          <Plus size={20} /> บันทึกรายการใหม่
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isOverspent ? 'bg-red-100' : 'bg-brand-blue/10'}`}>
            <Wallet className={`${isOverspent ? 'text-red-500' : 'text-brand-blue'} w-8 h-8`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">ยอดเงินคงเหลือ</p>
            <h3 className={`text-2xl font-bold ${isOverspent ? 'text-red-600' : 'text-slate-800'}`}>
              ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            <TrendingUp className="text-green-600 w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">รายรับทั้งหมด</p>
            <h3 className="text-2xl font-bold text-green-600">฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <TrendingDown className="text-red-600 w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">รายจ่ายทั้งหมด</p>
            <h3 className="text-2xl font-bold text-red-600">฿{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* สุขภาพการเงิน (Financial Health Bar) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700">สัดส่วนรายจ่ายต่อรายรับ (Financial Health)</h2>
            <p className="text-xs text-slate-500 mt-1">
              {isOverspent ? "⚠️ ระวัง! คุณใช้จ่ายเกินรายรับแล้ว" : "✨ ยอดเยี่ยม! คุณคุมค่าใช้จ่ายได้ดี"}
            </p>
          </div>
          <span className={`text-xl font-bold ${isOverspent ? 'text-red-500' : 'text-brand-purple'}`}>
            {expenseRatio.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-4 rounded-full transition-all duration-1000 ${
              expenseRatio > 90 ? 'bg-red-500' : expenseRatio > 70 ? 'bg-orange-400' : 'bg-green-500'
            }`} 
            style={{ width: `${Math.min(expenseRatio, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-6">วิเคราะห์การเงิน</h2>
          <div className="flex-1 w-full h-full">
            <DashboardCharts transactions={typedTransactions} />
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">ประวัติรายการล่าสุด</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="p-4 text-sm font-semibold text-slate-500">วันที่</th>
                  <th className="p-4 text-sm font-semibold text-slate-500">หมวดหมู่</th>
                  <th className="p-4 text-sm font-semibold text-slate-500">จำนวนเงิน</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 text-center">สลิป</th>
                  <th className="p-4 text-sm font-semibold text-slate-500 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {typedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">ยังไม่มีประวัติรายการ</td>
                  </tr>
                ) : (
                  typedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 text-slate-600 text-sm">
                        {new Date(tx.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700">
                          {tx.category}
                        </span>
                      </td>
                      <td className={`p-4 font-bold ${tx.transaction_type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.transaction_type === 'INCOME' ? '+' : '-'}฿{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        {tx.receipt_url ? (
                          <ReceiptViewer receiptUrl={tx.receipt_url} />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-4 flex justify-end opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <TransactionActions transactionId={tx.id} receiptUrl={tx.receipt_url} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}