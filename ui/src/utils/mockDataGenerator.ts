import type { Category } from "../types/category";
import type { Transaction } from "../types/transaction";


export function generateMockTransactions(categories: Category[]): Transaction[] {
    const mockTransactions: Transaction[] = [];

    // pokud nejsou kategorie, nemuzeme generovat transakce
    if (categories.length === 0) {
        console.error("Nelze generovat transakce bez kategorií. Prosím, vytvořte nejdříve kategorie.");
        return [];
    }

    // Generujeme 200 polozek rozlozenych v case (poslednich 6 mesicu) a naplnenych nahodnymi daty
    for (let i = 0; i < 200; i++) {
        // nahodna kategorie
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        /**
         * TODO 
         * - rozhodnuti : prijem (10-20%) vs vydaj (80-90%)
         * - dle toho vygenerovat nahodnou castku
         * - vybrat nahodny nazev ze seznamu
         * - vygenerovat datum v poslednich 6 mesicich
         */
        // prijem nebo vydaj?
        const isIncome = Math.random() < 0.15; // 15% pravdepodobnost prijmu

        // vygenerovat nahodnou castku
        const amount = isIncome
            ? Math.floor(Math.random() * 9000) + 1000 // prijem mezi 1000 a 10000
            : -(Math.floor(Math.random() * 4900) + 100); // vydaj mezi -100 a -5000

        // vygenerovat nahodny nazev
        let title = '';
        if (isIncome) {
            const incomeTitles = ['Výplata', 'Brigáda', 'Převod od kamaráda', 'Vrácená platba', 'Prodej na Bazoši'];
            title = incomeTitles[Math.floor(Math.random() * incomeTitles.length)];
        } else{
            const expensePrefixes = ['Nákup: ', 'Platba kartou - ', 'Měsíční platba (', 'Útrata: '];
            const prefix = expensePrefixes[Math.floor(Math.random() * expensePrefixes.length)];
            // Hack: Prefix + Název kategorie. Např: "Platba kartou - Zábava" nebo "Nákup: Jídlo". 
            title = `${prefix}${randomCategory.label}${prefix.includes('(') ? ')' : ''}`;
        }

        // vygenerovat datum v poslednich 6 mesicich
        const daysAgo = Math.floor(Math.random() * 180); // 0-179 dní zpět
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - daysAgo);
        // nahodny cas
        randomDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            title: title,
            amount: amount,
            date: randomDate.toISOString(),
            categoryId: randomCategory.id,
        };

        mockTransactions.push(newTransaction);
    }
    return mockTransactions;
}