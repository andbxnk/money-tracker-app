"use client";

import { useState } from "react";
import { Trash2, Edit, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

interface TransactionActionsProps {
  transactionId: string;
  receiptUrl: string | null;
}

export default function TransactionActions({
  transactionId,
  receiptUrl,
}: TransactionActionsProps) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const router = useRouter();

  const handleDelete = async () => {
    // ให้ SweetAlert ถามยืนยันก่อนลบ
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "รายการนี้จะถูกลบและไม่สามารถกู้คืนได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
      customClass: { popup: "rounded-3xl" },
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        const supabase = createClient();

        // ลบรูป
        if (receiptUrl) {
          const urlParts = receiptUrl.split("/receipts/");
          if (urlParts.length > 1) {
            await supabase.storage.from("receipts").remove([urlParts[1]]);
          }
        }

        // ลบข้อมูล
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionId);
        if (error) throw new Error(error.message);

        await Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: "rounded-3xl" },
        });

        router.refresh();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "ลบไม่สำเร็จ",
          text: error.message,
          customClass: { popup: "rounded-3xl" },
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/edit/${transactionId}`}
        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all"
        title="แก้ไข"
      >
        <Edit size={18} />
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 text-slate-400 hover:text-brand-pink hover:bg-brand-pink/10 rounded-lg transition-all disabled:opacity-50"
        title="ลบ"
      >
        {isDeleting ? (
          <Loader2 size={18} className="animate-spin text-brand-pink" />
        ) : (
          <Trash2 size={18} />
        )}
      </button>
    </div>
  );
}
