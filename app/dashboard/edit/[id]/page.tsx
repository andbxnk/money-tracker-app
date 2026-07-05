"use client";

import { useState, useEffect, FormEvent, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, ArrowLeft, UploadCloud, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Transaction } from "@/types";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

const PREDEFINED_CATEGORIES = [
  "อาหาร/เครื่องดื่ม", "การเดินทาง", "ช้อปปิ้ง", 
  "บิล/ค่าใช้จ่าย", "เงินเดือน", "โอนเงิน", "อื่นๆ"
];

export default function EditTransactionPage({ params }: EditPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Form States
  const [amount, setAmount] = useState<string>("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [category, setCategory] = useState<string>("อาหาร/เครื่องดื่ม");
  const [customCategory, setCustomCategory] = useState<string>("");
  
  // Image Storage & Preview States
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Transaction Data & Auth Handshake
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push("/login");
          return;
        }
        setUser(session.user);

        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) throw new Error("ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์เข้าถึงรายการนี้");

        const tx = data as Transaction;
        setAmount(tx.amount.toString());
        setType(tx.transaction_type);
        
        // ตรวจสอบหมวดหมู่ว่าตรงกับที่มีในระบบไหม
        if (PREDEFINED_CATEGORIES.includes(tx.category)) {
          setCategory(tx.category);
        } else {
          setCategory("อื่นๆ");
          setCustomCategory(tx.category);
        }

        if (tx.receipt_url) {
          setExistingReceipt(tx.receipt_url);
          setPreviewUrl(tx.receipt_url); // ดึงรูปเก่ามาแสดงเป็น Preview ก่อน
        }

      } catch (err: unknown) {
        if (err instanceof Error) alert(err.message);
        router.push("/dashboard");
      } finally {
        setIsFetching(false);
      }
    };

    fetchTransaction();
  }, [resolvedParams.id, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setExistingReceipt(null); // เคลียร์ค่ารูปภาพเดิมออกด้วยถ้ากดลบ
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      let finalReceiptUrl = existingReceipt; 
      const finalCategory = category === "อื่นๆ" && customCategory.trim() !== "" ? customCategory : category;

      // เคสที่ 1: มีการเปลี่ยนไฟล์รูปใหม่ (อัปโหลดใหม่ และตามไปลบไฟล์เก่าถ้ามี)
      if (file) {
        if (existingReceipt) {
          const urlParts = existingReceipt.split("/receipts/");
          if (urlParts.length > 1) {
            await supabase.storage.from("receipts").remove([urlParts[1]]);
          }
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("receipts").upload(fileName, file);
        if (uploadError) throw new Error(`อัปโหลดไฟล์ล้มเหลว: ${uploadError.message}`);
        
        const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);
        finalReceiptUrl = data.publicUrl;
      } 
      // เคสที่ 2: กดลบรูปเดิมออก และไม่ได้เลือกไฟล์ใหม่แทนที่ (ลบไฟล์บน Storage)
      else if (!existingReceipt && previewUrl === null) {
        // ค้นหาและลบรูปเก่าใน Storage
        const { data: currentTx } = await supabase.from("transactions").select("receipt_url").eq("id", resolvedParams.id).single();
        if (currentTx?.receipt_url) {
          const urlParts = currentTx.receipt_url.split("/receipts/");
          if (urlParts.length > 1) {
            await supabase.storage.from("receipts").remove([urlParts[1]]);
          }
        }
        finalReceiptUrl = null;
      }

      const { error: dbError } = await supabase
        .from("transactions")
        .update({
          amount: parseFloat(amount),
          transaction_type: type,
          category: finalCategory,
          receipt_url: finalReceiptUrl,
        })
        .eq("id", resolvedParams.id);

      if (dbError) throw new Error(`อัปเดตข้อมูลล้มเหลว: ${dbError.message}`);
      
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup object URL เมื่อปิดหน้าหรือย้ายหน้า
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-purple w-10 h-10" />
      </div>
    );
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-500 hover:text-brand-purple hover:border-brand-purple transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">แก้ไขรายการ</h1>
          <p className="text-sm text-slate-500">ปรับปรุงข้อมูลรายรับ-รายจ่ายของคุณ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
        
        {/* Type Selection Tabs */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${
              type === "EXPENSE" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            รายจ่าย (Expense)
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${
              type === "INCOME" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            รายรับ (Income)
          </button>
        </div>

        <div className="space-y-8">
          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">จำนวนเงิน (บาท)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">฿</span>
              <input 
                type="number" 
                required 
                min="0.01" 
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-4 text-3xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 outline-none transition-all placeholder:text-slate-300"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category Pills Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">หมวดหมู่</label>
            <div className="flex flex-wrap gap-2.5">
              {PREDEFINED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 border-2 ${
                    category === cat 
                      ? "bg-brand-purple text-white border-brand-purple shadow-md shadow-brand-purple/20" 
                      : "bg-white text-slate-600 border-slate-100 hover:border-brand-purple/30 hover:bg-slate-50"
                  }`}
                >
                  {category === cat && <CheckCircle2 size={16} />}
                  {cat}
                </button>
              ))}
            </div>
            
            {/* Custom Category Input */}
            {category === "อื่นๆ" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                <input 
                  type="text" 
                  required 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="โปรดระบุหมวดหมู่ของคุณ..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-purple outline-none transition-all text-sm"
                />
              </div>
            )}
          </div>

          {/* Enhanced Image Upload Dropzone */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">สลิป / หลักฐานประกอบรายการ</label>
            <div 
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl transition-all overflow-hidden ${
                previewUrl 
                  ? "border-brand-purple bg-brand-purple/5" 
                  : "border-slate-200 hover:border-brand-blue hover:bg-brand-blue/5 cursor-pointer bg-slate-50 p-10"
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full h-64 group">
                  <Image src={previewUrl} alt="Receipt Preview" fill className="object-contain p-4" unoptimized />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeFile(); }}
                      className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-xl flex items-center gap-2 font-medium"
                    >
                      <X size={20} /> เปลี่ยนหรือลบสลิป
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-blue">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-700">คลิกเพื่ออัปโหลดรูปภาพสลิปใหม่</p>
                    <p className="text-sm text-slate-500 mt-1">รองรับไฟล์ JPG, PNG หรือ WEBP</p>
                  </div>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 py-4 text-center text-slate-600 bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-all"
          >
            ยกเลิก
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting} 
            className="flex-[2] py-4 text-lg font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink rounded-2xl hover:shadow-lg hover:shadow-brand-purple/30 focus:ring-4 focus:ring-brand-purple/20 transition-all hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> กำลังบันทึก...</> : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </main>
  );
}