import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
  note: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface AuthSession {
  user: User | null;
}