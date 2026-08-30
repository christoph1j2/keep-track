import { useEffect, useState } from "react";
import { CircularProgress, Button } from "@mui/material";
import { toast } from "react-hot-toast";
import { api } from "../../utils/api";
import { BaseModal } from "./BaseModal";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CategoryIcon from "@mui/icons-material/Category";
import ExtensionIcon from "@mui/icons-material/Extension";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface UserDetails {
  id: string;
  username: string;
  email: string;
  baseCurrency: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  stats: {
    transactionCount: number;
    aiCategorizedCount: number;
    aiRate: number;
    budgetCount: number;
    categoryCount: number;
    templateCount: number;
    importJobCount: number;
  };
}

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserDetailModal({ open, onClose, userId }: UserDetailModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      setDetails(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    api
      .get(`/admin/users/${userId}/details`)
      .then((res) => {
        if (isMounted) {
          setDetails(res.data);
        }
      })
      .catch((err) => {
        toast.error("Failed to load user details");
        console.error(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, userId]);

  return (
    <BaseModal isOpen={open} onClose={onClose} title="User Inspection Details">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <CircularProgress size={36} />
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading user details...</span>
        </div>
      ) : details ? (
        <div className="space-y-6 pt-2">
          {/* Header user info card */}
          <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {details.username}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{details.email}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Base Currency: <strong className="text-slate-800 dark:text-slate-200">{details.baseCurrency}</strong></span>
                <span>•</span>
                <span>Joined: {new Date(details.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
              details.role === "ADMIN"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}>
              {details.role}
            </span>
          </div>

          {/* Metrics grid */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Account Usage Overview
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-1 text-xs font-medium">
                  <ReceiptIcon fontSize="small" />
                  Transactions
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{details.stats?.transactionCount || 0}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 mb-1 text-xs font-medium">
                  <AutoAwesomeIcon fontSize="small" />
                  AI Categorized
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {details.stats?.aiCategorizedCount || 0} <span className="text-xs font-normal text-slate-400">({details.stats?.aiRate || 0}%)</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1 text-xs font-medium">
                  <AccountBalanceWalletIcon fontSize="small" />
                  Budgets
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{details.stats?.budgetCount || 0}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 mb-1 text-xs font-medium">
                  <CategoryIcon fontSize="small" />
                  Categories
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{details.stats?.categoryCount || 0}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-1 text-xs font-medium">
                  <ExtensionIcon fontSize="small" />
                  Templates
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{details.stats?.templateCount || 0}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1 text-xs font-medium">
                  <CloudUploadIcon fontSize="small" />
                  Import Jobs
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{details.stats?.importJobCount || 0}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-800">
            <Button onClick={onClose} variant="contained" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400">No user details available</div>
      )}
    </BaseModal>
  );
}
