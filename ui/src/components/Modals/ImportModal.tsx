import { useState, useMemo } from "react";
import { BaseModal } from "./BaseModal";
import { useTransactions } from "../../hooks/useTransactions";
import { useCategories } from "../../hooks/useCategories";
import { parseBankCSV, type ParsedTransaction } from "../../utils/bankImport";
import { saveUserKeyword } from "../../utils/userKeywords";
import { UNCATEGORIZED_ID } from "../../constants/categoryConstants";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const { transactions, addTransaction } = useTransactions();
    const { categories } = useCategories();
    
    // Abecedně seřazené kategorie pro select boxy
    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.order - b.order),
        [categories]
    );

    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Zpracování nahrání souboru
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);

        try {
            const data = await parseBankCSV(file, transactions, categories);
            setParsedData(data);
        } catch (err) {
            setError("Nepodařilo se zpracovat CSV soubor. Zkontrolujte formát.");
            console.error(err);
        } finally {
            setIsParsing(false);
            // Vyresetujeme input, aby šel nahrát stejný soubor znovu
            event.target.value = ''; 
        }
    };

    // Uživatel ručně změní kategorii v tabulce
    // PROPAGUJ změnu na všechny řádky se stejným title (např. všechny TESCO, všechny GW Train)
    const handleCategoryChange = (id: string, newCategoryId: string) => {
        setParsedData(prev => {
            const changedItem = prev.find(t => t.id === id);
            if (!changedItem) return prev;
            
            // Aktualizuj VŠECHNY řádky se stejným title
            return prev.map(t => 
                t.title === changedItem.title ? { ...t, categoryId: newCategoryId } : t
            );
        });
    };

    // Uložení všech plateb do reálné databáze
    const handleSaveAll = () => {
        // Spočítáme transakce bez kategorie (červené řádky)
        const uncategorizedCount = parsedData.filter(t => t.categoryId === null).length;
        
        // Pokud jsou nějaké bez kategorie, zeptáme se
        if (uncategorizedCount > 0) {
            const confirmed = window.confirm(
                `Zbývá ${uncategorizedCount} transakcí bez zvolené kategorie.\n\nPokud je teď neuložíte s kategorií, budou uloženy jako "Nezařazeno".\n\nChcete pokračovat?`
            );
            
            if (!confirmed) return; // Uživatel zrušil
            
            // Compute normalized list in-memory instead of relying on setState
            const normalizedData = parsedData.map(t => 
                t.categoryId === null ? { ...t, categoryId: UNCATEGORIZED_ID } : t
            );
            
            // Continue with save using the normalized list
            normalizedData.forEach(t => {
                addTransaction({
                    id: crypto.randomUUID(),
                    title: t.title,
                    amount: t.amount,
                    date: t.date,
                    categoryId: t.categoryId as string
                });

                // Save keyword only if not uncategorized
                if (t.categoryId !== UNCATEGORIZED_ID) {
                    saveUserKeyword(t.title, t.categoryId as string);
                }
            });

            // Close and cleanup
            setParsedData([]);
            onClose();
            return;
        }
        
        // All transactions have a category
        // Filter only those with assigned category
        const validTransactions = parsedData.filter(t => t.categoryId !== null);
        
        // Uložíme je jednu po druhé (můžeš si v useTransactions udělat i batchAddTransaction pro optimalizaci)
        validTransactions.forEach(t => {
            // Ulož transakci
            addTransaction({
                id: crypto.randomUUID(), // v reálné implementaci by ID generoval backend
                title: t.title,
                amount: t.amount,
                date: t.date,
                categoryId: t.categoryId as string
            });

            // Learn from this mapping: title -> categoryId
            // Save keyword only if not uncategorized
            if (t.categoryId !== UNCATEGORIZED_ID) {
                saveUserKeyword(t.title, t.categoryId as string);
            }
        });

        // Zavřít a vyčistit
        setParsedData([]);
        onClose();
    };

    return (
        <BaseModal title="Import transakcí z banky" isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-4">
                
                {/* 1. Fáze: Nahrání souboru */}
                {parsedData.length === 0 && (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                        <input 
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileUpload} 
                            disabled={isParsing}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {isParsing && <p className="mt-2 text-slate-500">Zpracovávám soubor...</p>}
                        {error && <p className="mt-2 text-red-500">{error}</p>}
                    </div>
                )}

                {/* 2. Fáze: Náhled a oprava kategorií */}
                {parsedData.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                            Našli jsme <b>{parsedData.length}</b> transakcí. Zkontrolujte prosím přiřazené kategorie před uložením.
                        </div>

                        <div className="max-h-100 overflow-y-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-700">Datum</th>
                                        <th className="p-3 font-semibold text-slate-700">Položka</th>
                                        <th className="p-3 font-semibold text-slate-700 text-right">Částka</th>
                                        <th className="p-3 font-semibold text-slate-700">Kategorie</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {parsedData.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50">
                                            <td className="p-3 whitespace-nowrap text-slate-500">
                                                {new Date(t.date).toLocaleDateString('cs-CZ')}
                                            </td>
                                            <td className="p-3 font-medium text-slate-800 truncate max-w-37.5" title={t.title}>
                                                {t.title}
                                            </td>
                                            <td className={`p-3 text-right font-semibold whitespace-nowrap ${t.amount > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                                {t.amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}
                                            </td>
                                            <td className="p-3">
                                                {/* Pokud heuristika neví, select je červený a křičí "Vyberte!" */}
                                                <select
                                                    value={t.categoryId || ""}
                                                    onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                                                    className={`w-full p-1 border rounded text-sm ${!t.categoryId ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                                                >
                                                    <option value="" disabled>-- Vyberte --</option>
                                                    {sortedCategories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setParsedData([])}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={handleSaveAll}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            >
                                Uložit {parsedData.length} transakcí
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    );
}