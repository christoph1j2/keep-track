import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { Transaction } from "../../types/transaction";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useCategories } from "../../hooks/useCategories";

interface TransactionDataGridProps {
    transactions: Transaction[];
}

export function TransactionDataGrid({ transactions } : TransactionDataGridProps) {
    const { getCategoryById } = useCategories();

    const colDef: GridColDef[] = [
        {
            field: "title",
            headerName: "Název",
            flex: 1,
            renderCell: (params: GridRenderCellParams) => {
                return (
                    <div className="flex items-center gap-2">
                        <CategoryIcon name={getCategoryById(params.row.categoryId)?.iconName || ''} />
                        <span>{params.value}</span>
                    </div>
                );
            }
        },
        {
            field: "amount",
            headerName: "Částka",
            flex: 0.5,
            renderCell: (params: GridRenderCellParams) => {
                const value = params.value.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });
                return <span className={`${params.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>{value}</span>
            }
        },
        {
            field: "date",
            headerName: "Datum",
            flex: 0.5,
            renderCell: (params: GridRenderCellParams) => {
                const date = new Date(params.value).toLocaleDateString('cs-CZ');
                return <span>{date}</span>
            }
        }
    ];

    return (
        <DataGrid
            rows={transactions}
            columns={colDef}
            disableColumnMenu
            sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
            }}
            disableRowSelectionOnClick
            autoPageSize
        />
    )
}