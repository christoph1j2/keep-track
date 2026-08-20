export function normaliseTitle(title: string): string {
    let normalized = title
          .toLowerCase()
          .replace(/s\.r\.o\.?|a\.s\.?|z\.s\.?|spol\. s r\.o\.?/gi, '')
          .replace(/[0-9]+/g, '') // remove all numbers
          .replace(/[^\w\sěščřžýáíéůúťďň]/gi, ' ') // remove special chars
          .replace(/\s+/g, ' ')
          .trim();

    // Fallback if we accidentally stripped the entire string (e.g. if the title was just numbers)
    if (normalized.length < 3) {
        normalized = title.trim();
    }

    return normalized;
}