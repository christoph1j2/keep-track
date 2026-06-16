import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { useState } from "react";
import { TextField } from "@mui/material";
import type { Transaction } from "../../types/transaction";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useIsMobile } from "../../hooks/useIsMobile";
import { TransactionMobileList } from "./TransactionMobileList";
import { useCategoryStore } from "../../store/categoryStore";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../../store/confirmStore";
import { useSettingsStore } from "../../store/settingsStore";
import { formatCurrency } from "../../utils/formatCurrency";

interface TransactionDataGridProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSplitTransaction: (transaction: Transaction) => void;
}

export function TransactionDataGrid({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onSplitTransaction,
}: TransactionDataGridProps) {
  const { theme } = useTheme();
  const categories = useCategoryStore((state) => state.categories);
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  const { t } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const { language } = useSettingsStore();
  const locale = language === "cs" ? "cs-CZ" : "en-US";

  const isDark = theme === "dark";
  const gridLineColor = isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.2)";

  const filteredBySearch = searchTerm.trim()
    ? transactions.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions;

  const handleProcessRowUpdate = (newRow: Transaction, oldRow: Transaction) => {
    if (
      newRow.title === oldRow.title &&
      newRow.amount === oldRow.amount &&
      newRow.date === oldRow.date &&
      newRow.categoryId === oldRow.categoryId
    ) {
      return oldRow;
    }

    const amount = parseFloat(newRow.amount as unknown as string);
    if (isNaN(amount)) {
      alert(t('overview.invalidNumber'));
      return oldRow;
    }
    if (amount === 0) {
      alert(t('overview.zeroAmount'));
      return oldRow;
    }
    newRow.amount = amount;

    const onlyCategoryChanged =
      newRow.title === oldRow.title &&
      newRow.amount === oldRow.amount &&
      newRow.date === oldRow.date &&
      newRow.categoryId !== oldRow.categoryId;

    if (!onlyCategoryChanged) {
      const changes =
        newRow.amount !== oldRow.amount
          ? `částku z ${oldRow.amount} na ${newRow.amount}`
          : `název z "${oldRow.title}" na "${newRow.title}"`;
      const isConfirmed = window.confirm(t('overview.updateConfirm', { changes }));
      if (!isConfirmed) {
        return oldRow;
      }
    }
    onUpdateTransaction(newRow);
    return newRow;
  };

  const colDef: GridColDef[] = [
    {
      field: "title",
      headerName: t('overview.columns.title'),
      flex: 0.75,
      editable: true,
      resizable: false,
      renderCell: (params: GridRenderCellParams) => {
        const category = categories.find((c) => c.id === params.row.categoryId);
        return (
          <div className="flex items-center gap-2 min-w-0 h-full">
            <CategoryIcon name={category?.iconName || ""} />
            <span className="truncate text-slate-800 dark:text-slate-200" title={params.value as string}>
              {params.value}
            </span>
          </div>
        );
      },
    },
    {
      field: "amount",
      headerName: t('overview.columns.amount'),
      flex: 0.5,
      editable: true,
      resizable: false,
      renderCell: (params: GridRenderCellParams) => {
        // Úprava barev částek, aby byly dobře čitelné na světlém i tmavém pozadí
        return (
          <span className={`font-medium ${
            params.value >= 0 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-rose-600 dark:text-rose-400"
          }`}>
            {formatCurrency(params.value)}
          </span>
        );
      },
    },
    {
      field: "categoryId",
      headerName: t('overview.columns.category'),
      flex: 0.5,
      type: "singleSelect",
      editable: true,
      resizable: false,
      valueOptions: categories.map((c) => ({ value: c.id, label: c.label })),
      renderCell: (params: GridRenderCellParams) => {
        const category = categories.find((c) => c.id === params.value);
        return (
          <div className="w-full h-full flex items-center">
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer border border-transparent hover:ring-1 hover:ring-slate-400/30 dark:hover:ring-slate-200/20 transition-colors ${
                category?.colorClass ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
              onClick={() => params.api.startCellEditMode({ id: params.id, field: "categoryId" })}
            >
              <CategoryIcon name={category?.iconName || ""} />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {category?.label || t('overview.unassigned')}
              </span>
            </div>
          </div>
        );
      },
      renderEditCell: (params) => {
        return (
          <select
            autoFocus
            value={params.value}
            onChange={(e) => {
              const newValue = e.target.value;
                params.api.setEditCellValue({ id: params.id, field: "categoryId", value: newValue });
                params.api.stopCellEditMode({ id: params.id, field: "categoryId" });            
            }}
            className="w-full px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:border-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      field: "date",
      headerName: t('overview.columns.date'),
      flex: 0.5,
      resizable: false,
      renderCell: (params: GridRenderCellParams) => {
        const date = new Date(params.value).toLocaleDateString(locale);
        return <span className="text-slate-500 dark:text-slate-400">{date}</span>;
      },
    },
    {
      field: "split",
      headerName: t('overview.columns.split'),
      flex: 0.3,
      resizable: false,
      sortable: false,
      align: "center",
      renderCell: (params: GridRenderCellParams) => {
        return (
          <button
            className="cursor-pointer hover:scale-110 transition-transform p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
            onClick={() => onSplitTransaction(params.row as Transaction)}
          >
            ✂️
          </button>
        );
      },
    },
    {
      field: "delete",
      headerName: t('overview.columns.delete'),
      flex: 0.3,
      resizable: false,
      sortable: false,
      align: "center",
      renderCell: (params: GridRenderCellParams) => {
        return (
          <button
            className="cursor-pointer hover:scale-110 transition-transform p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
            showConfirm(
                t('common.warning'),
                t('overview.confirm.delete'),
                () => onDeleteTransaction(params.id as string)
              );
            }}
          >
            🗑️
          </button>
        );
      },
    },
  ];

  return isMobile ? (
    <TransactionMobileList
      transactions={filteredBySearch}
      onUpdateTransaction={onUpdateTransaction}
      onDeleteTransaction={onDeleteTransaction}
      onSplitTransaction={onSplitTransaction}
    />
  ) : (
    <div className="flex flex-col gap-4 h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 rounded-2xl">
      <div className="px-4 pt-4">
        <TextField
          fullWidth
          size="small"
          placeholder={t('overview.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: isDark ? "#e2e8f0" : "#0f172a",
              backgroundColor: isDark ? "#0d1527" : "#f8fafc",
              "& fieldset": { borderColor: isDark ? "#334155" : "#cbd5e1" },
              "&:hover fieldset": { borderColor: isDark ? "#475569" : "#94a3b8" },
              "&.Mui-focused fieldset": { borderColor: "#6366f1" },
            },
            "& .MuiInputBase-input::placeholder": {
              color: isDark ? "#94a3b8" : "#64748b",
              opacity: 1,
            },
          }}
        />
      </div>
      <div className="flex-1 overflow-hidden rounded-b-2xl">
        <DataGrid
          rows={filteredBySearch}
          columns={colDef}
          disableColumnMenu
          disableRowSelectionOnClick
          autoPageSize
          processRowUpdate={handleProcessRowUpdate}
          initialState={{
            sorting: { sortModel: [{ field: "date", sort: "desc" }] },
          }}
          // EXTRÉMNÍ BORDEL
          sx={{
            "--DataGrid-rowBorderColor": gridLineColor,
            "--unstable_DataGrid-radius": "0px",
            border: 0,
            color: isDark ? "#e2e8f0" : "#0f172a",
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: isDark ? "#1e293b !important" : "#f8fafc !important",
              borderBottom: `1px solid ${gridLineColor}`,
            },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: isDark ? "#1e293b !important" : "#f8fafc !important",
              "&:hover .MuiDataGrid-sortIcon": {
                color: isDark ? "#cbd5e1 !important" : "#475569 !important",
              },
              "&:hover .MuiIconButton-root": {
                backgroundColor: isDark ? "rgba(203, 213, 225, 0.12)" : "rgba(71, 85, 105, 0.1)",
                color: isDark ? "#cbd5e1 !important" : "#475569 !important",
              },
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: isDark ? "#94a3b8" : "#475569",
              fontWeight: 600,
            },
            "& .MuiDataGrid-row": {
              borderBottom: `1px solid ${gridLineColor}`,
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              },
            },
            "& .MuiDataGrid-iconButtonContainer": {
              color: isDark ? "#94a3b8" : "#475569",
            },
            "& .MuiDataGrid-sortButton": {
              color: isDark ? "#cbd5e1 !important" : "#475569 !important",
            },
            "& .MuiDataGrid-sortIcon": {
              color: isDark ? "#cbd5e1 !important" : "#475569 !important",
            },
            "& .MuiDataGrid-columnHeader--sorted .MuiSvgIcon-root": {
              color: isDark ? "#cbd5e1 !important" : "#475569 !important",
            },
            "& .MuiDataGrid-columnHeader--sorted .MuiIconButton-root": {
              backgroundColor: isDark ? "rgba(203, 213, 225, 0.12)" : "rgba(71, 85, 105, 0.1)",
              color: isDark ? "#cbd5e1 !important" : "#475569 !important",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: `1px solid ${gridLineColor}`,
              display: "flex",
              alignItems: "center",
              "&:focus-within": { outline: "1px solid #6366f1" },
            },
            "& .MuiDataGrid-withBorderColor": {
              borderColor: `${gridLineColor} !important`,
            },
            "& .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller": {
              borderColor: `${gridLineColor} !important`,
            },
            "& .MuiDataGrid-columnSeparator": {
              color: gridLineColor,
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "transparent",
              borderTop: `1px solid ${gridLineColor}`,
              color: isDark ? "#94a3b8" : "#475569",
              borderRadius: "0 0 16px 16px",
            },
            "& .MuiTablePagination-root": {
              color: isDark ? "#94a3b8" : "#475569",
              borderRadius: "16px",
            },
            "& .MuiTablePagination-actions": {
              color: isDark ? "#94a3b8" : "#475569",
              borderRadius: "16px",
            },
          }}
        />
      </div>
    </div>
  );
}
