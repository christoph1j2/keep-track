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

type CsvDelimiter = "," | ";" | "\t" | "|";

const CSV_DELIMITER_CANDIDATES: CsvDelimiter[] = [",", ";", "\t", "|"];

const DATE_FIELD_ALIASES = [
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
  "valuta",
  "posted",
  "posting date",
  "booking",
  "transaction booked",
];

const AMOUNT_FIELD_ALIASES = [
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
  "total",
  "sum",
  "balance",
];

const DEBIT_FIELD_ALIASES = [
  "debet",
  "vydaj",
  "debit",
  "withdrawal",
  "out",
  "outgoing",
];
const CREDIT_FIELD_ALIASES = [
  "kredit",
  "prijem",
  "credit",
  "deposit",
  "in",
  "incoming",
];
const PAYEE_FIELD_ALIASES = [
  "nazev protistrany",
  "nazev protiuctu",
  "protistrana",
  "protiucet",
  "payee",
  "partner",
  "merchant",
  "counterparty",
  "receiver",
  "sender",
  "name",
  "recipient",
  "beneficiary",
];
const DESCRIPTION_FIELD_ALIASES = [
  "zprava pro prijemce",
  "popis transakce",
  "popis",
  "note",
  "poznamka",
  "description",
  "details",
  "reference",
  "zprava",
  "info",
  "message",
  "communication",
  "remark",
  "doplnujici informace",
];
const TYPE_FIELD_ALIASES = [
  "typ transakce",
  "typ",
  "type",
  "kategorie",
  "transaction type",
  "transaction kind",
  "category",
];
const CURRENCY_FIELD_ALIASES = ["mena", "currency", "ccy", "curr"];

function normalizeText(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_\-./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Helper to normalize keys by lowercasing, stripping diacritics, and collapsing spaces.
 */
function normalizeKey(str: string): string {
  return normalizeText(str);
}

function detectDelimiter(lines: string[]): CsvDelimiter {
  const sampleLines = lines
    .map((line) => line.replace(/^\uFEFF/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 25);

  let bestDelimiter: CsvDelimiter = ";";
  let bestScore = -1;

  for (const delimiter of CSV_DELIMITER_CANDIDATES) {
    let score = 0;
    const counts: number[] = [];

    for (const line of sampleLines) {
      const count = line.split(delimiter).length - 1;
      if (count > 0) {
        counts.push(count);
        score += count;
      }
    }

    if (counts.length > 0) {
      const uniqueCounts = new Set(counts);
      score += counts.length * 3;
      score += uniqueCounts.size === 1 ? 10 : 0;
      score += Math.max(...counts);
    }

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

function countAliasMatches(line: string): number {
  const normalized = normalizeText(line);
  const aliases = [
    ...DATE_FIELD_ALIASES,
    ...AMOUNT_FIELD_ALIASES,
    ...DEBIT_FIELD_ALIASES,
    ...CREDIT_FIELD_ALIASES,
    ...PAYEE_FIELD_ALIASES,
    ...DESCRIPTION_FIELD_ALIASES,
    ...TYPE_FIELD_ALIASES,
    ...CURRENCY_FIELD_ALIASES,
  ];

  return aliases.reduce(
    (count, alias) =>
      count + (normalized.includes(normalizeText(alias)) ? 1 : 0),
    0,
  );
}

function detectHeaderIndex(lines: string[], delimiter: CsvDelimiter): number {
  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].replace(/^\uFEFF/, "");
    const line = rawLine.trim();
    if (line.length < 3) continue;

    const columnCount = line.split(delimiter).length;
    if (columnCount < 2) continue;

    const aliasScore = countAliasMatches(line);
    const separatorScore = columnCount >= 3 ? 2 : 0;
    const structuralScore = Math.min(columnCount, 8);
    const score = aliasScore * 8 + separatorScore + structuralScore;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex === -1 ? 0 : bestIndex;
}

function buildNormalizedRow(
  row: Record<string, string>,
): Record<string, string> {
  const normalizedRow: Record<string, string> = {};

  for (const key in row) {
    const normalizedKey = normalizeKey(key);
    const value = row[key]?.trim?.() ?? row[key] ?? "";

    if (
      !(normalizedKey in normalizedRow) ||
      normalizedRow[normalizedKey].length === 0
    ) {
      normalizedRow[normalizedKey] = value;
    }
  }

  return normalizedRow;
}

function pickFieldValue(
  row: Record<string, string>,
  aliases: string[],
): string {
  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    if (row[normalizedAlias]) {
      return row[normalizedAlias];
    }
  }

  const keys = Object.keys(row);
  const normalizedAliases = aliases.map((alias) => normalizeKey(alias));

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    if (
      normalizedAliases.some(
        (alias) => normalizedKey === alias || normalizedKey.includes(alias),
      )
    ) {
      return row[key];
    }
  }

  return "";
}

function parseAmountField(rawAmount: string): number {
  if (!rawAmount) return 0;

  let cleaned = rawAmount
    .trim()
    .replace(/[\u00a0\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");

  if (cleaned.endsWith("-")) {
    cleaned = "-" + cleaned.slice(0, -1);
  } else if (cleaned.endsWith("+")) {
    cleaned = cleaned.slice(0, -1);
  }

  cleaned = cleaned.replace(/[^\d,.-]/g, "");

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    const commaParts = cleaned.split(",");
    if (commaParts.length === 2 && commaParts[1].length <= 2) {
      cleaned = cleaned.replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseDebitCreditAmount(row: Record<string, string>): {
  amount: number;
  originalAmount: number;
  hasValue: boolean;
} {
  const debitVal = pickFieldValue(row, DEBIT_FIELD_ALIASES);
  const creditVal = pickFieldValue(row, CREDIT_FIELD_ALIASES);

  if (debitVal || creditVal) {
    const debitAmount = debitVal ? parseFlexibleAmount(debitVal) : 0;
    const creditAmount = creditVal ? parseFlexibleAmount(creditVal) : 0;

    if (debitAmount !== 0 || creditAmount !== 0) {
      const amount = Math.abs(creditAmount) - Math.abs(debitAmount);
      const originalAmount = creditAmount !== 0 ? creditAmount : debitAmount;
      return { amount, originalAmount, hasValue: true };
    }
  }

  const rawAmount = pickFieldValue(row, AMOUNT_FIELD_ALIASES);
  const parsedAmount = parseFlexibleAmount(rawAmount);

  return {
    amount: parsedAmount,
    originalAmount: parsedAmount,
    hasValue: rawAmount.length > 0,
  };
}

function parseTextDate(rawDate: string): string | undefined {
  if (!rawDate) return undefined;

  const cleaned = rawDate.trim();
  const normalized = cleaned.replace(/\s+/g, " ");

  const isoCandidate = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T].*)?$/,
  );
  if (isoCandidate) {
    const year = Number.parseInt(isoCandidate[1], 10);
    const month = Number.parseInt(isoCandidate[2], 10);
    const day = Number.parseInt(isoCandidate[3], 10);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
  }

  const dotRegex = /^(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})(?:[ T].*)?$/;
  const dotMatch = normalized.match(dotRegex);
  if (dotMatch) {
    const day = Number.parseInt(dotMatch[1], 10);
    const month = Number.parseInt(dotMatch[2], 10);
    const year = Number.parseInt(dotMatch[3], 10);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
  }

  const delimiterRegex = /^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})(?:[ T].*)?$/;
  const delimiterMatch = normalized.match(delimiterRegex);
  if (delimiterMatch) {
    const first = delimiterMatch[1];
    const second = delimiterMatch[2];
    const third = delimiterMatch[3];

    let year = 0;
    let month = 0;
    let day = 0;

    if (first.length === 4) {
      year = Number.parseInt(first, 10);
      month = Number.parseInt(second, 10);
      day = Number.parseInt(third, 10);
    } else if (third.length === 4) {
      year = Number.parseInt(third, 10);
      const firstValue = Number.parseInt(first, 10);
      const secondValue = Number.parseInt(second, 10);

      if (firstValue > 12) {
        day = firstValue;
        month = secondValue;
      } else if (secondValue > 12) {
        day = secondValue;
        month = firstValue;
      } else {
        day = firstValue;
        month = secondValue;
      }
    }

    if (year > 0 && month > 0 && day > 0) {
      const dateObj = new Date(year, month - 1, day, 12, 0, 0);
      if (!Number.isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
  }

  const nativeParsed = new Date(normalized);
  if (!Number.isNaN(nativeParsed.getTime())) {
    return nativeParsed.toISOString();
  }

  return undefined;
}

function getTransactionTitle(row: Record<string, string>): string {
  const payee = pickFieldValue(row, PAYEE_FIELD_ALIASES).trim();
  const description = pickFieldValue(row, DESCRIPTION_FIELD_ALIASES).trim();
  const typeInfo = pickFieldValue(row, TYPE_FIELD_ALIASES).trim();

  const titleParts: string[] = [];
  if (payee) titleParts.push(payee);
  if (description && description !== payee) {
    titleParts.push(description);
  }

  const finalTitle = titleParts.join(" - ").replace(/\s+/g, " ").trim();
  if (finalTitle) {
    return finalTitle;
  }

  return typeInfo || "Neznámá platba";
}

function getOriginalCurrency(row: Record<string, string>): string {
  const currencyRaw = pickFieldValue(row, CURRENCY_FIELD_ALIASES).trim();

  if (!currencyRaw) {
    return "CZK";
  }

  const upper = currencyRaw.toUpperCase();
  const codeMatch = upper.match(/^[A-Z]{3,4}$/);
  if (codeMatch) {
    return upper;
  }

  const normalized = normalizeText(currencyRaw);
  if (normalized.includes("koruna") || normalized.includes("czk")) return "CZK";
  if (normalized.includes("euro") || normalized.includes("eur")) return "EUR";
  if (normalized.includes("usd") || normalized.includes("dolar")) return "USD";
  if (normalized.includes("gbp") || normalized.includes("libra")) return "GBP";
  if (normalized.includes("isk") || normalized.includes("krona")) return "ISK";
  if (normalized.includes("pln") || normalized.includes("zloty")) return "PLN";

  return upper.length <= 4 ? upper : "CZK";
}

/**
 * Parses dates in a variety of common formats:
 * - DD.MM.YYYY (Czech standard)
 * - YYYY-MM-DD (ISO standard)
 * - DD/MM/YYYY or MM/DD/YYYY (Slash formats)
 */
function parseFlexibleDate(rawDate: string): string | undefined {
  return parseTextDate(rawDate);
}

/**
 * Parses numbers with space thousands separators and commas as decimal separators.
 */
function parseFlexibleAmount(rawAmount: string): number {
  return parseAmountField(rawAmount);
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

      // 1. KROK: Najdeme reálnou hlavičku tabulky, oddělovač a odřízneme balast.
      const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const lines = normalizedText.split("\n");
      const delimiter = detectDelimiter(lines);
      const headerIndex = detectHeaderIndex(lines, delimiter);
      const cleanCsvText = lines.slice(headerIndex).join("\n");

      // 2. KROK: Pustíme PapaParse na vyčištěný text
      Papa.parse(cleanCsvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        delimiter,
        complete: (results) => {
          const parsed: ParsedTransaction[] = [];
          const data = results.data as Record<string, string>[];

          for (const row of data) {
            const normalizedRow = buildNormalizedRow(row);

            const rawDate = pickFieldValue(normalizedRow, DATE_FIELD_ALIASES);
            const amountInfo = parseDebitCreditAmount(normalizedRow);

            // Pokud řádek nemá datum nebo částku, přeskočíme ho (např. součty na konci)
            if (!rawDate || !amountInfo.hasValue || amountInfo.amount === 0)
              continue;

            // Zpracujeme flexibilní formát data
            const isoDate = parseFlexibleDate(rawDate);
            if (!isoDate) {
              console.warn("Could not parse date:", rawDate);
              continue;
            }

            const finalTitle = getTransactionTitle(normalizedRow);
            const originalCurrency = getOriginalCurrency(normalizedRow);

            parsed.push({
              id: crypto.randomUUID(),
              date: isoDate,
              title: finalTitle,
              amount: amountInfo.amount,
              originalAmount: amountInfo.originalAmount,
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
