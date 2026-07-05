"use client";

import { ImageIcon } from "lucide-react";
import Swal from "sweetalert2";

export default function ReceiptViewer({ receiptUrl }: { receiptUrl: string }) {
  const viewReceipt = () => {
    Swal.fire({
      title: "หลักฐานการทำรายการ",
      imageUrl: receiptUrl,
      imageAlt: "Receipt",
      width: "auto",
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        image: "max-h-[70vh] w-auto object-contain rounded-xl mt-4",
        popup: "rounded-3xl p-6"
      }
    });
  };

  return (
    <button 
      onClick={viewReceipt} 
      title="คลิกเพื่อดูสลิป"
      className="inline-flex p-2 text-brand-blue bg-brand-blue/10 rounded-xl hover:bg-brand-blue/20 hover:scale-110 transition-all cursor-pointer"
    >
      <ImageIcon size={18} />
    </button>
  );
}