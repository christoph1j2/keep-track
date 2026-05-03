import { BarChart } from "@mui/x-charts/BarChart";
import type { Transaction } from "../../types/transaction";

export function Graph(
    {
        getTransactionsForMonth, income, expenses 
    }:
    {
        getTransactionsForMonth: (month: number) => Transaction[], income: number, expenses: number 
    }) {
    const now = new Date();
    // poslednich 6 mesicu pro graf od nejdrivejsiho po nejnovejsi
    const graphMonths = [now.getMonth() - 5, now.getMonth() - 4, now.getMonth() - 3, now.getMonth() - 2, now.getMonth() - 1, now.getMonth()].map(m => (m + 12) % 12);
    return (
            <section className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Příjmy vs Výdaje</h3>
                <div className="h-80">
                    <BarChart
                        xAxis={[
                            { data: graphMonths.map(m => new Date(0, m).toLocaleString('cs-CZ', { month: 'short' })) }
                        ]} // zobrazeni mesicu jako led, uno, bre ... pro 6 mesicu
                        yAxis={[
                            { label: 'Částka (Kč)',
                                width: 60,
                                min: 0,
                                max: Math.max(income, expenses) * 1.5, // trochu prostoru nad nejvyssim sloupcem
                            }
                        ]}
                        series={[
                            {
                                label: 'Příjmy',
                                data: graphMonths.map(
                                m => getTransactionsForMonth(m)
                                    .filter(t => t.amount > 0)
                                    .reduce((sum, currentItem) => sum + currentItem.amount, 0)
                                )
                            },
                            {
                                label: 'Výdaje',
                                data: graphMonths.map(
                                m => Math.abs(getTransactionsForMonth(m)
                                .filter(t => t.amount < 0)
                                .reduce((sum, currentItem) => sum + currentItem.amount, 0))
                            )
                            }
                        ]}
                        height={300}
                    />
                </div>
            </section>
    );
}