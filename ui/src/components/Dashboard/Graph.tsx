import { BarChart } from "@mui/x-charts/BarChart";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useTransactionStore } from "../../store/transactionStore";
import { useTheme } from "../../contexts/ThemeContext";
import { ChartsTooltipContainer, useAxesTooltip } from "@mui/x-charts";


function CustomTooltip({ isDark }: { isDark: boolean }) {
    const axesTooltip = useAxesTooltip<'bar'>();
    const tooltipData = axesTooltip?.[0];
    if (!tooltipData) return null;

    const bg = isDark ? "#1E293B" : "#ffffff";
    const border = isDark ? "#334155" : "#E2E8F0";
    const color = isDark ? "#F8FAFC" : "#0F172A";
    const subColor = isDark ? "#94A3B8" : "#64748B";

    const formatCzk = (value: number | null) =>
        value == null
            ? "–"
            : value.toLocaleString("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

    return (
        <ChartsTooltipContainer>
            <div style={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderRadius: "8px",
                padding: "10px 14px",
                color,
                fontSize: "13px",
                minWidth: "180px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}>
                {/* X axis label, e.g. "bře" */}
                <div style={{ fontWeight: 700, marginBottom: 8, color: subColor, fontSize: "12px" }}>
                    {tooltipData.axisFormattedValue}
                </div>
                {tooltipData.seriesItems.map((item) => (
                    <div key={item.seriesId} style={{
                        display: "flex", alignItems: "center",
                        gap: 8, marginBottom: 4,
                    }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: 2,
                            backgroundColor: item.color, flexShrink: 0,
                        }} />
                        <span style={{ flex: 1 }}>{item.formattedLabel}</span>
                        <span style={{ fontWeight: 600 }}>
                            {formatCzk(item.value as number)}
                        </span>
                    </div>
                ))}
            </div>
        </ChartsTooltipContainer>
    );
}

export function Graph() {
    const isMobile = useIsMobile();
    const now = new Date();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const transactions = useTransactionStore((state) => state.transactions);

    const getTransactionsForMonth = (month: number, year: number) =>
        transactions.filter((t) => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

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
            .reduce((sum, t) => sum + t.amount, 0)
    );

    const monthlyExpenses = graphPeriods.map(({ month, year }) =>
        Math.abs(
            getTransactionsForMonth(month, year)
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + t.amount, 0)
        )
    );

    const chartHeight = isMobile ? 220 : 300;
    const maxValue = Math.max(...monthlyIncome, ...monthlyExpenses, 0);

    const axisColor = isDark ? "#CBD5E1" : "#334155";
    const lineColor = isDark ? "#475569" : "#CBD5E1";

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 transition-colors">
            <h3 className="text-xl font-bold mb-4">Příjmy vs Výdaje</h3>
            <BarChart
                key={theme}
                localeText={{
                    loading: 'Data should be available soon.',
                    noData: 'Select some data to display.',
                }}
                xAxis={[{
                    data: graphPeriods.map(p => p.label),
                    tickLabelStyle: { fill: axisColor },
                    labelStyle: { fill: axisColor },
                    slotProps: {
                        axisLine: { stroke: lineColor },
                        axisTick: { stroke: lineColor },
                    },
                }]}
                yAxis={[{
                    label: "Částka (Kč)",
                    width: 80,
                    min: 0,
                    max: maxValue * 1.1 || 100,
                    tickLabelStyle: { fill: axisColor },
                    labelStyle: { fill: axisColor },
                    slotProps: {
                        axisLine: { stroke: lineColor },
                        axisTick: { stroke: lineColor },
                    },
                }]}
                series={[
                    { id: 'prijmy-series', label: "Příjmy", data: monthlyIncome },
                    { id: 'vydaje-series', label: "Výdaje", data: monthlyExpenses },
                ]}
                height={chartHeight}
                colors={['#10B981', '#F43F5E']}
                slots={{
                    tooltip: () => <CustomTooltip isDark={isDark} />
                }}
                slotProps={{
                    legend: {
                        sx: { color: axisColor },
                    },
                }}
                sx={{
                    // Axis tick labels (the month names and numbers)
                    "& .MuiChartsAxis-tickLabel tspan": {
                        fill: `${axisColor} !important`,
                    },
                    // Axis label ("Částka (Kč)")
                    "& .MuiChartsAxis-label tspan": {
                        fill: `${axisColor} !important`,
                    },
                    // Axis lines and ticks
                    "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                        stroke: `${lineColor} !important`,
                    },
                }}
            />
        </section>
    );
}