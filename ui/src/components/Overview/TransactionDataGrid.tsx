import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { useState } from "react";
import { TextField } from "@mui/material";
import type { Transaction } from "../../types/transaction";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useIsMobile } from "../../hooks/useIsMobile";
import { TransactionMobileList } from "./TransactionMobileList";
import { useCategoryStore } from "../../store/categoryStore";

interface TransactionDataGridProps {
    transactions: Transaction[];
    onUpdateTransaction: (updated: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    onSplitTransaction: (transaction: Transaction) => void;
}

/**
 * Responsive transaction table that uses DataGrid on desktop and a mobile list on small screens.
 * Supports inline updates, category changes, delete actions, and split action routing.
 *
 * @param props.transactions Rows to display.
 * @param props.onUpdateTransaction Called after a confirmed inline update.
 * @param props.onDeleteTransaction Called after a confirmed delete.
 * @param props.onSplitTransaction Called when the user requests to split a transaction.
 */
export function TransactionDataGrid({
        transactions,
        onUpdateTransaction,
        onDeleteTransaction,
        onSplitTransaction
    }: TransactionDataGridProps) {
    const categories = useCategoryStore((state) =>  state.categories );
    const isMobile = useIsMobile();
    const [searchTerm, setSearchTerm] = useState("");

    // Filter transactions by search term (case-insensitive substring match on title)
    const filteredBySearch = searchTerm.trim()
        ? transactions.filter((t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : transactions;

    /**
     * Validates and commits inline row edits.
     * Category-only edits are saved without the general text/amount confirmation prompt.
     *
     * @param newRow Row candidate after user edits.
     * @param oldRow Previous persisted row values.
     * @returns Row to keep in the grid, either newRow or oldRow when validation/cancel occurs.
     */
    const handleProcessRowUpdate = (newRow: Transaction, oldRow: Transaction) => {
        // pokud se nic nezměnilo, nevoláme update
        if (newRow.title === oldRow.title 
            &&
            newRow.amount === oldRow.amount 
            && 
            newRow.date === oldRow.date
            &&
            newRow.categoryId === oldRow.categoryId) {
            return oldRow;
        }

        // validace - částka musí být číslo, nesmi být nula
        const amount = parseFloat(newRow.amount as unknown as string);
        if (isNaN(amount)) {
            alert("Částka musí být platné číslo.");
            return oldRow; // vrátíme původní hodnotu, která se neuloží
        }
        if (amount === 0) {
            alert("Částka nesmí být nula.");
            return oldRow;
        }
        newRow.amount = amount; // reassignujeme na spravny typ

        // pokud se zmenila pouze kategorie
        const onlyCategoryChanged = 
            newRow.title === oldRow.title
            &&
            newRow.amount === oldRow.amount
            &&
            newRow.date === oldRow.date
            &&
            newRow.categoryId !== oldRow.categoryId;

        if (!onlyCategoryChanged) {
            const changes = newRow.amount !== oldRow.amount
                ? `částku z ${oldRow.amount} na ${newRow.amount}`
                : `název z "${oldRow.title}" na "${newRow.title}"`;

            const isConfirmed = window.confirm(`Opravdu chcete změnit ${changes}?`); 
            //! tady by bylo fajn mít custom modal, ale pro jednoduchost použijeme zatim confirm

            if (!isConfirmed) {
                return oldRow; // user zrušil změnu, vrátíme původní hodnotu, která se neuloží
            }
        }

        onUpdateTransaction(newRow);
        return newRow; // vrátíme novou hodnotu, která se uloží do DataGridu
    }


    const colDef: GridColDef[] = [
        {
            field: "title",
            headerName: "Název",
            flex: .75,
            editable: true,
            resizable: false,
            renderCell: (params: GridRenderCellParams) => {
                const category = categories.find(c => c.id === params.row.categoryId);

                return (
                    <div className="flex items-center gap-2 min-w-0">
                        <CategoryIcon 
                            name={category?.iconName || ''} 
                        />
                        <span className="truncate" title={params.value as string}>{params.value}</span>
                    </div>
                );
            }
        },
        {
            field: "amount",
            headerName: "Částka",
            flex: 0.5,
            editable: true,
            resizable: false,
            renderCell: (params: GridRenderCellParams) => {
                const value = params.value.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });
                return <span className={`${params.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>{value}</span>
            }
        },
        {
            field: "categoryId",
            headerName: "Kategorie",
            flex: 0.50,
            type: "singleSelect",
            editable: true,
            resizable: false,
            valueOptions: categories.map((c) => ({
                value: c.id,
                label: c.label
            })),
            renderCell: (params: GridRenderCellParams) => {
                const category = categories.find(c => c.id === params.value);
                return (
                    <div className="w-full h-full flex items-center">
                        <div 
                            className={`inline-flex items-center gap-1 px-3 py-2 rounded-full ${category?.colorClass}-500 ${category?.colorClass}-100 text-sm cursor-pointer`}
                            onClick={() => params.api.startCellEditMode({ id: params.id, field: 'categoryId' })}
                            >
                            <CategoryIcon 
                                name={category?.iconName || ''}
                            />
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{category?.label || 'Nepřiřazeno'}</span>
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
                            const isConfirmed = window.confirm(`Opravdu chcete změnit kategorii?`);
                            if (isConfirmed) {
                                params.api.setEditCellValue({ id: params.id, field: 'categoryId', value: newValue });
                                params.api.stopCellEditMode({ id: params.id, field: 'categoryId' });
                            }
                        }}
                        className="w-full px-2 py-1 border border-slate-400 rounded text-sm"
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                );
            }
        },
        {
            field: "date",
            headerName: "Datum",
            flex: 0.50,
            resizable: false,
            renderCell: (params: GridRenderCellParams) => {
                const date = new Date(params.value).toLocaleDateString('cs-CZ');
                return <span>{date}</span>
            }
        },
        {
            field: "split",
            headerName: "Rozdělit",
            flex: 0.30,
            resizable: false,
            sortable: false,
            align: "center",
            renderCell: (params: GridRenderCellParams) => {
                return (
                    <button
                        className="cursor-pointer"
                        onClick={() => {
                            // otevre modal split transaction
                            onSplitTransaction(params.row as Transaction);
                        }}
                    >
                        ✂️
                    </button>
                )
            }
        },
        {
            field: "delete",
            headerName: "Smazat",
            flex: 0.30,
            resizable: false,
            sortable: false,
            align: "center",
            renderCell: (params: GridRenderCellParams) => {
                return (
                    <button
                        className="cursor-pointer"
                        onClick={() => {
                            const isConfirmed = window.confirm("Opravdu chcete smazat tuto transakci?");
                            if (isConfirmed) {
                                onDeleteTransaction(params.id as string);
                            }
                        }}
                    >
                        🗑️
                    </button>
                )
            }
        }
    ];

    return isMobile ? (
        <TransactionMobileList transactions={filteredBySearch} onUpdateTransaction={onUpdateTransaction} onDeleteTransaction={onDeleteTransaction} onSplitTransaction={onSplitTransaction} />
    ) : (
        <div className="flex flex-col gap-4 h-full">
            <div className="px-4 pt-4">
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Hledat podle názvu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <DataGrid
                    rows={filteredBySearch}
                    columns={colDef}
                    disableColumnMenu
                    processRowUpdate={handleProcessRowUpdate}
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
                    }}
                    disableRowSelectionOnClick
                    autoPageSize
                    initialState={{
                        sorting: {
                            sortModel: [{field: "date", sort: "desc"}]
                        }
                    }}
                />
            </div>
        </div>
    );
}