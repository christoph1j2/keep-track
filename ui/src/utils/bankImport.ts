import Papa from "papaparse";

// def pro mezikrok - transakce cekajici na schvaleni
export interface ParsedTransaction {
  id: string; // docasne id pro react key
  date: string;
  title: string;
  amount: number;
  originalAmount: number; 
  originalCurrency: string; 
}

//TODO: add support for more csv formats (different banks = diff delimiters, different column names, etc.)
/**
 * PARSER: Zpracuje CSV soubor z banky a ignoruje balast nahoře
 */
export function parseBankCSV(file: File): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return reject("Nepodařilo se přečíst soubor");

      // 1. KROK: Najdeme reálnou hlavičku tabulky a odřízneme balast (KB+, Fio atd.)
      const lines = text.split("\n");
      let headerIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        // Hledáme řádek, co obsahuje 'datum' a zároveň něco jako 'zauctovani' nebo 'castka'
        if (
          line.includes("datum") &&
          (line.includes("zauctovani") ||
            line.includes("zaúčtování") ||
            line.includes("castka") ||
            line.includes("částka"))
        ) {
          headerIndex = i;
          break;
        }
      }

      // Vytvoříme nový čistý text, který začíná až správnou hlavičkou
      const cleanCsvText = lines.slice(headerIndex).join("\n");

      // 2. KROK: Pustíme PapaParse na vyčištěný text
      Papa.parse(cleanCsvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: ParsedTransaction[] = [];
          const data = results.data as Record<string, string>[];

          for (const row of data) {
            // Sjednotíme všechny názvy sloupců na malá písmena a odstraníme mezery (odolnost proti změnám v bance)
            const normalizedRow: Record<string, string> = {};
            for (const key in row) {
              normalizedRow[key.trim().toLowerCase()] = row[key];
            }

            // Adaptér pro KB+ a další
            const rawDate =
              normalizedRow["datum zauctovani"] ||
              normalizedRow["datum zaúčtování"] ||
              normalizedRow["datum provedeni"] ||
              normalizedRow["datum"] ||
              "";
            const rawAmount =
              normalizedRow["castka"] ||
              normalizedRow["částka"] ||
              normalizedRow["objem"] ||
              "0";

            // Komerční banka někdy dává jméno do protistrany, jindy do zprávy, jindy do typu transakce
            let rawTitle =
              normalizedRow["nazev protistrany"] ||
              normalizedRow["název protistrany"] ||
              normalizedRow["nazev protiuctu"] ||
              normalizedRow["název protiuctu"];
            if (!rawTitle || rawTitle.trim() === "") {
              rawTitle =
                normalizedRow["zprava pro prijemce"] ||
                normalizedRow["typ transakce"] ||
                normalizedRow["doplňující informace"] ||
                "Neznámá platba";
            }

            // Pokud řádek nemá datum nebo částku, je to nějaký zbytek tabulky na konci (např. součty)
            if (!rawDate || !rawAmount) continue;

            const amount = parseFloat(
              rawAmount.replace(/\s/g, "").replace(",", "."),
            );

            // Skip zero amounts or invalid rows
            if (isNaN(amount) || amount === 0) continue;

            // Parse date and skip row if invalid
            let isoDate: string | undefined;
            try {
              const [day, month, year] = rawDate.split(".");
              if (day && month && year) {
                const parsedDate = new Date(
                  `${year.trim()}-${month.trim()}-${day.trim()}`,
                );
                if (!isNaN(parsedDate.getTime())) {
                  isoDate = parsedDate.toISOString();
                } else {
                  console.warn("Invalid date parsed:", rawDate);
                  continue;
                }
              } else {
                console.warn("Missing date components:", rawDate);
                continue;
              }
            } catch (e) {
              console.warn("Date parsing error:", rawDate, e);
              continue;
            }

            if (!isoDate) continue;

            parsed.push({
              id: crypto.randomUUID(),
              date: isoDate,
              title: rawTitle.trim(),
              amount: amount,
              originalAmount: amount, // For now, we assume the original amount is the same as the normalized amount
              originalCurrency: "CZK", // Default currency, can be adjusted based on bank data
            });
          }
          resolve(parsed);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    };

    reader.onerror = () => reject("Chyba při čtení souboru");

    // Zkusíme přečíst jako utf-8. Pokud by byla v importu pak rozbitá diakritika (např.  místo Č),
    // změň 'utf-8' na 'windows-1250'
    reader.readAsText(file, "windows-1250");
  });
}
