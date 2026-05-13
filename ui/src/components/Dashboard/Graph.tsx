import { BarChart } from "@mui/x-charts/BarChart";
import type { Transaction } from "../../types/transaction";

/**
 * Compares monthly income and expenses over the last six months.
 * The chart expects a transaction provider callback so month filtering logic can stay in the parent.
 *
 * @param props.getTransactionsForMonth Function that returns transactions for a given month and year.
 */
export function Graph(
    {
        getTransactionsForMonth
    }:
    {
        getTransactionsForMonth: (month: number, year: number) => Transaction[]
    }
) {
    const now = new Date();

    const graphPeriods = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        return {
            month: date.getMonth(),
            year: date.getFullYear(),
            label: date.toLocaleString("cs-CZ", { month: "short" }),
        };
    });

    const monthlyIncome = graphPeriods.map(({ month, year }) =>
        getTransactionsForMonth(month, year)
            .filter(t => t.amount > 0)
            .reduce((sum, item) => sum + item.amount, 0)
    );

    const monthlyExpenses = graphPeriods.map(({ month, year }) =>
        Math.abs(
            getTransactionsForMonth(month, year)
                .filter(t => t.amount < 0)
                .reduce((sum, item) => sum + item.amount, 0)
        )
    );

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Příjmy vs Výdaje</h3>
            <div className="h-103.5">
                <BarChart
                    xAxis={[{ data: graphPeriods.map(p => p.label) }]}
                    yAxis={[{
                        label: "Částka (Kč)",
                        width: "auto",
                        min: 0,
                        max: Math.max(...monthlyIncome, ...monthlyExpenses) * 1.1,
                    }]}
                    series={[
                        { label: "Příjmy", data: monthlyIncome },
                        { label: "Výdaje", data: monthlyExpenses },
                    ]}
                    height={350}
                />
            </div>
        </section>
    );
}