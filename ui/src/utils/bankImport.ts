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

/**
 * Helper to normalize keys by lowercasing, stripping diacritics, and collapsing spaces.
 */
function normalizeKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/[\s_-]+/g, " "); // Collapse spaces/underscores/dashes
}

/**
 * Parses dates in a variety of common formats:
 * - DD.MM.YYYY (Czech standard)
 * - YYYY-MM-DD (ISO standard)
 * - DD/MM/YYYY or MM/DD/YYYY (Slash formats)
 */
function parseFlexibleDate(rawDate: string): string | undefined {
  if (!rawDate) return undefined;
  
  const cleaned = rawDate.trim();

  // Try parsing native ISO or standard formats first
  const nativeParsed = new Date(cleaned);
  if (!isNaN(nativeParsed.getTime()) && cleaned.includes("-")) {
    return nativeParsed.toISOString();
  }

  // Match DD.MM.YYYY (Czech style)
  const dotRegex = /^(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/;
  const dotMatch = cleaned.match(dotRegex);
  if (dotMatch) {
    const day = parseInt(dotMatch[1], 10);
    const month = parseInt(dotMatch[2], 10);
    const year = parseInt(dotMatch[3], 10);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0); // Noon to prevent timezone shifting
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
  }

  // Match slash or dash formats: DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
  const delimiterRegex = /^(\d{1,2}|\d{4})[-/](\d{1,2})[-/](\d{1,2}|\d{4})/;
  const delimiterMatch = cleaned.match(delimiterRegex);
  if (delimiterMatch) {
    let year = 0;
    let month = 0;
    let day = 0;

    const p1 = delimiterMatch[1];
    const p2 = delimiterMatch[2];
    const p3 = delimiterMatch[3];

    if (p1.length === 4) {
      // YYYY/MM/DD
      year = parseInt(p1, 10);
      month = parseInt(p2, 10);
      day = parseInt(p3, 10);
    } else if (p3.length === 4) {
      // DD/MM/YYYY or MM/DD/YYYY
      year = parseInt(p3, 10);
      const v1 = parseInt(p1, 10);
      const v2 = parseInt(p2, 10);

      if (v1 > 12) {
        day = v1;
        month = v2;
      } else if (v2 > 12) {
        day = v2;
        month = v1;
      } else {
        // Default to DD/MM/YYYY
        day = v1;
        month = v2;
      }
    }

    if (year > 0 && month > 0 && day > 0) {
      const dateObj = new Date(year, month - 1, day, 12, 0, 0);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
  }

  // Fallback to standard native parsing if nothing else matched
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return undefined;
}

/**
 * Parses numbers with space thousands separators and commas as decimal separators.
 */
function parseFlexibleAmount(rawAmount: string): number {
  if (!rawAmount) return 0;

  // Clean whitespace (including non-breaking spaces)
  let cleaned = rawAmount.replace(/[\s\u00a0]/g, "");

  // Handle trailing positive/negative signs (e.g. "125.00-")
  if (cleaned.endsWith("-")) {
    cleaned = "-" + cleaned.slice(0, -1);
  } else if (cleaned.endsWith("+")) {
    cleaned = cleaned.slice(0, -1);
  }

  // Remove trailing/leading currency characters
  cleaned = cleaned.replace(/[A-Za-zKč$€£]+/g, "");

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.indexOf(".") < cleaned.indexOf(",")) {
      // e.g. "1.250,50" -> dot is thousand separator
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // e.g. "1,250.50" -> comma is thousand separator
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    // e.g. "1250,50" -> comma is decimal
    cleaned = cleaned.replace(",", ".");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * PARSER: Zpracuje CSV soubor z banky a ignoruje balast nahoře.
 * Podporuje různé formáty bank (KB+, Fio, Česká spořitelna, Air Bank, Revolut, atd.).
 */
export function parseBankCSV(file: File): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return reject("Nepodařilo se přečíst soubor");

      // 1. KROK: Najdeme reálnou hlavičku tabulky a odřízneme balast (KB+, Fio atd.)
      const lines = text.split("\n");
      let headerIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.trim().length < 5) continue;

        // Hledáme řádek, co obsahuje 'datum'/'date' a zároveň částku/'amount'/'objem'/'value'
        const hasDate = line.includes("datum") || line.includes("date") || line.includes("dátum");
        const hasAmount = line.includes("castka") || line.includes("částka") || line.includes("amount") || line.includes("objem") || line.includes("value") || line.includes("suma");

        if (hasDate && hasAmount) {
          headerIndex = i;
          break;
        }
      }

      // Pokud se nepodaří najít rozumnou hlavičku, začneme od prvního řádku
      if (headerIndex === -1) {
        headerIndex = 0;
      }

      // Vytvoříme nový čistý text, který začíná až správnou hlavičkou
      const cleanCsvText = lines.slice(headerIndex).join("\n");

      // 2. KROK: Pustíme PapaParse na vyčištěný text
      Papa.parse(cleanCsvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const parsed: ParsedTransaction[] = [];
          const data = results.data as Record<string, string>[];

          for (const row of data) {
            // Sjednotíme a normalizujeme názvy sloupců
            const normalizedRow: Record<string, string> = {};
            for (const key in row) {
              normalizedRow[normalizeKey(key)] = row[key];
            }

            // 1. Vyhledání data (zkoušíme různé CZ a EN názvy sloupců)
            const dateFields = [
              "datum zauctovani",
              "datum provedeni",
              "datum transakce",
              "datum splatnosti",
              "datum",
              "transaction date",
              "booking date",
              "value date",
              "date of transaction",
              "date",
              "time",
              "valuta"
            ];

            let rawDate = "";
            for (const field of dateFields) {
              if (normalizedRow[field]) {
                rawDate = normalizedRow[field];
                break;
              }
            }

            if (!rawDate) {
              const foundKey = Object.keys(normalizedRow).find(
                (k) => k.includes("datum") || k.includes("date")
              );
              if (foundKey) {
                rawDate = normalizedRow[foundKey];
              }
            }

            // 2. Vyhledání částky (podpora pro debet/kredit nebo jeden sloupec částky)
            const debitFields = ["debet", "vydaj", "debit", "withdrawal", "out"];
            const creditFields = ["kredit", "prijem", "credit", "deposit", "in"];

            let debitVal = "";
            for (const field of debitFields) {
              if (normalizedRow[field]) {
                debitVal = normalizedRow[field];
                break;
              }
            }

            let creditVal = "";
            for (const field of creditFields) {
              if (normalizedRow[field]) {
                creditVal = normalizedRow[field];
                break;
              }
            }

            let amount = 0;
            let hasDebitOrCredit = false;

            if (debitVal || creditVal) {
              const debitAmount = debitVal ? parseFlexibleAmount(debitVal) : 0;
              const creditAmount = creditVal ? parseFlexibleAmount(creditVal) : 0;
              if (debitAmount !== 0 || creditAmount !== 0) {
                amount = Math.abs(creditAmount) - Math.abs(debitAmount);
                hasDebitOrCredit = true;
              }
            }

            if (!hasDebitOrCredit) {
              const amountFields = [
                "castka v mene uctu",
                "castka transakce",
                "castka",
                "objem",
                "hodnota",
                "suma",
                "amount",
                "value",
                "volume",
                "transaction amount",
                "total"
              ];
              let rawAmount = "";
              for (const field of amountFields) {
                if (normalizedRow[field]) {
                  rawAmount = normalizedRow[field];
                  break;
                }
              }
              if (!rawAmount) {
                const foundKey = Object.keys(normalizedRow).find(
                  (k) => k.includes("castka") || k.includes("amount") || k.includes("objem") || k.includes("value")
                );
                if (foundKey) {
                  rawAmount = normalizedRow[foundKey];
                }
              }
              amount = parseFlexibleAmount(rawAmount);
            }

            // Pokud řádek nemá datum nebo částku, přeskočíme ho (např. součty na konci)
            if (!rawDate || amount === 0) continue;

            // Zpracujeme flexibilní formát data
            const isoDate = parseFlexibleDate(rawDate);
            if (!isoDate) {
              console.warn("Could not parse date:", rawDate);
              continue;
            }

            // 3. Vyhledání názvu/popisu transakce
            const payeeFields = [
              "nazev protistrany",
              "nazev protiuctu",
              "protistrana",
              "protiucet",
              "payee",
              "partner",
              "merchant",
              "counterparty",
              "receiver",
              "sender"
            ];

            const descFields = [
              "zprava pro prijemce",
              "popis transakce",
              "popis",
              "note",
              "poznamka",
              "description",
              "details",
              "reference",
              "zprava",
              "info"
            ];

            const typeFields = [
              "typ transakce",
              "typ",
              "type",
              "doplnujici informace",
              "kategorie"
            ];

            let payee = "";
            for (const field of payeeFields) {
              if (normalizedRow[field]) {
                payee = normalizedRow[field].trim();
                break;
              }
            }

            let description = "";
            for (const field of descFields) {
              if (normalizedRow[field]) {
                description = normalizedRow[field].trim();
                break;
              }
            }

            let typeInfo = "";
            for (const field of typeFields) {
              if (normalizedRow[field]) {
                typeInfo = normalizedRow[field].trim();
                break;
              }
            }

            let titleParts: string[] = [];
            if (payee) titleParts.push(payee);
            if (description && description !== payee) {
              titleParts.push(description);
            }
            
            let finalTitle = titleParts.join(" - ").replace(/\s+/g, " ").trim();
            if (!finalTitle) {
              finalTitle = typeInfo || "Neznámá platba";
            }

            // 4. Vyhledání měny transakce
            const currencyFields = ["mena", "currency", "ccy"];
            let originalCurrency = "CZK";
            for (const field of currencyFields) {
              if (normalizedRow[field]) {
                const val = normalizedRow[field].trim().toUpperCase();
                if (val && val.length <= 4) {
                  originalCurrency = val;
                  break;
                }
              }
            }

            parsed.push({
              id: crypto.randomUUID(),
              date: isoDate,
              title: finalTitle,
              amount: amount,
              originalAmount: amount,
              originalCurrency: originalCurrency,
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

    // Čteme jako windows-1250 pro podporu CZ kódování z bank
    reader.readAsText(file, "windows-1250");
  });
}
