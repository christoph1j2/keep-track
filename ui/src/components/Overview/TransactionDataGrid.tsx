import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { Transaction } from "../../types/transaction";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useCategories } from "../../hooks/useCategories";
import { useIsMobile } from "../../hooks/useIsMobile";
import { TransactionMobileList } from "./TransactionMobileList";

interface TransactionDataGridProps {
    transactions: Transaction[];
    onUpdateTransaction: (updated: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
}

export function TransactionDataGrid({ transactions, onUpdateTransaction, onDeleteTransaction }: TransactionDataGridProps) {
    const { categories, getCategoryById } = useCategories();
    const isMobile = useIsMobile();

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
            //! tady by bylo fajn mít custom modal, ale pro jednoduchost použijeme confirm

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
                return (
                    <div className="flex items-center gap-2">
                        <CategoryIcon 
                            name={getCategoryById(params.row.categoryId)?.iconName || ''} 
                        />
                        <span>{params.value}</span>
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
            valueOptions: categories.map(c => ({
                value: c.id,
                label: c.label
            })),
            renderCell: (params: GridRenderCellParams) => {
                const category = getCategoryById(params.value);
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
            field: "delete",
            headerName: "",
            width: 50,
            resizable: false,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => {
                return (
                    <button
                        className="w-full cursor-pointer"
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
            } // TODO NA MOBIL
        }
    ];

    return isMobile ? (
        <TransactionMobileList transactions={transactions} onUpdateTransaction={onUpdateTransaction} />
    ) : (
        <DataGrid
            rows={transactions}
            columns={colDef}
            disableColumnMenu
            processRowUpdate={handleProcessRowUpdate}
            sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
            }}
            disableRowSelectionOnClick
            autoPageSize
        />
    );
}