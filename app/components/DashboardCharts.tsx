"use client";

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Transaction } from "@/types";
import { useState } from "react";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#64748b"];

export default function DashboardCharts({ transactions }: { transactions: Transaction[] }) {
  const [chartView, setChartView] = useState<"COMPARISON" | "CATEGORY">("COMPARISON");

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">
        ยังไม่มีข้อมูลสำหรับสร้างกราฟ
      </div>
    );
  }

  // 1. ข้อมูลสำหรับกราฟเปรียบเทียบ รายรับ vs รายจ่าย
  const totalIncome = transactions.filter(t => t.transaction_type === "INCOME").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.transaction_type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0);
  const comparisonData = [
    { name: "สรุปยอดรวม", "รายรับ": totalIncome, "รายจ่าย": totalExpense }
  ];

  // 2. ข้อมูลสำหรับกราฟวงกลม (หมวดหมู่รายจ่าย)
  const expenses = transactions.filter(t => t.transaction_type === "EXPENSE");
  const categoryDataMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryDataMap)
    .map(key => ({ name: key, value: categoryDataMap[key] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setChartView("COMPARISON")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${chartView === "COMPARISON" ? "bg-white text-brand-purple shadow-sm" : "text-slate-500"}`}
        >
          รายรับ VS รายจ่าย
        </button>
        <button
          onClick={() => setChartView("CATEGORY")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${chartView === "CATEGORY" ? "bg-white text-brand-purple shadow-sm" : "text-slate-500"}`}
        >
          หมวดหมู่รายจ่าย
        </button>
      </div>

      <div className="flex-1 w-full min-h-[250px]">
        {chartView === "COMPARISON" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `฿${val}`} />
              <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
              <Bar dataKey="รายรับ" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
              <Bar dataKey="รายจ่าย" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `฿${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-slate-400 text-sm">ไม่มีประวัติรายจ่าย</div>
          )
        )}
      </div>
    </div>
  );
}