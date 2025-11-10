/**
 * Formats a currency amount with the appropriate symbol
 * @param amount - The amount to format
 * @param currency - The currency code or symbol
 * @returns Formatted currency string with symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  // Handle NaN, null, undefined, or invalid numbers
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    amount = 0;
  }
  
  const symbol = getCurrencySymbol(currency);
  
  // Format the number with commas and add the currency symbol
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formattedAmount}`;
}

/**
 * Gets just the currency symbol for a given currency code
 * @param currency - The currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbolMap: Record<string, string> = {
    // ISO Codes
    USD: "$",
    GBP: "£",
    NGN: "₦", 
    EUR: "€",
    CAD: "C$",

    // Common variations
    "US DOLLAR": "$",
    "US DOLLARS": "$",
    "BRITISH POUND": "£",
    "BRITISH POUNDS": "£",
    "NAIRA": "₦",
    "NAIRAS": "₦",
    "EURO": "€",
    "EUROS": "€",
    "CANADIAN DOLLAR": "C$",
    "CANADIAN DOLLARS": "C$",
    "POUND": "£",
    "POUNDS": "£",
    "DOLLAR": "$",
    "DOLLARS": "$",

    // Symbols (return as-is)
    "£": "£",
    $: "$",
    "₦": "₦",
    "€": "€",
    C$: "C$",
  };

  const normalizedCurrency = (currency || "").trim().toUpperCase();
  return symbolMap[normalizedCurrency] || "$";
}

/**
 * Gets the currency code from a currency symbol or name
 * @param currency - The currency symbol or name
 * @returns Currency code (e.g., "NGN", "USD")
 */
export function getCurrencyCode(currency: string): string {
  const codeMap: Record<string, string> = {
    // Symbols to codes
    "₦": "NGN",
    "$": "USD", 
    "£": "GBP",
    "€": "EUR",
    "C$": "CAD",

    // Names to codes
    "NAIRA": "NGN",
    "NAIRAS": "NGN",
    "US DOLLAR": "USD",
    "US DOLLARS": "USD",
    "BRITISH POUND": "GBP",
    "BRITISH POUNDS": "GBP",
    "EURO": "EUR",
    "EUROS": "EUR",
    "CANADIAN DOLLAR": "CAD",
    "CANADIAN DOLLARS": "CAD",
    "POUND": "GBP",
    "POUNDS": "GBP",
    "DOLLAR": "USD",
    "DOLLARS": "USD",

    // Codes (return as-is)
    "NGN": "NGN",
    "USD": "USD",
    "GBP": "GBP",
    "EUR": "EUR",
    "CAD": "CAD",
  };

  const normalizedCurrency = (currency || "").trim().toUpperCase();
  return codeMap[normalizedCurrency] || "USD";
}

/**
 * Formats currency with conversion information
 * @param amount - The amount to format
 * @param currency - The currency code
 * @param originalAmount - Original amount before conversion
 * @param originalCurrency - Original currency before conversion
 * @returns Formatted currency string with conversion info
 */
export function formatCurrencyWithConversion(
  amount: number,
  currency: string,
  originalAmount?: number,
  originalCurrency?: string
): string {
  const formattedAmount = formatCurrency(amount, currency);
  
  // If there's original amount info, show it
  if (originalAmount && originalCurrency && originalCurrency !== currency) {
    const originalFormatted = formatCurrency(originalAmount, originalCurrency);
    return `${formattedAmount} (${originalFormatted})`;
  }
  
  return formattedAmount;
}
