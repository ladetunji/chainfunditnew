/**
 * Formats a currency amount with the appropriate symbol
 * @param amount - The amount to format
 * @param currency - The currency code or symbol
 * @returns Formatted currency string with symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencyMap: Record<string, string> = {
    // ISO Codes
    USD: "USD",
    GBP: "GBP", 
    NGN: "NGN",
    EUR: "EUR",
    CAD: "CAD",

    // Common variations
    "US DOLLAR": "USD",
    "US DOLLARS": "USD",
    "BRITISH POUND": "GBP",
    "BRITISH POUNDS": "GBP",
    "NAIRA": "NGN",
    "NAIRAS": "NGN",
    "EURO": "EUR",
    "EUROS": "EUR",
    "CANADIAN DOLLAR": "CAD",
    "CANADIAN DOLLARS": "CAD",
    "POUND": "GBP",
    "POUNDS": "GBP",
    "DOLLAR": "USD",
    "DOLLARS": "USD",

    // Symbols
    "£": "GBP",
    $: "USD",
    "₦": "NGN",
    "€": "EUR",
    C$: "CAD",
  };

  const normalizedCurrency = (currency || "").trim().toUpperCase();
  const code = currencyMap[normalizedCurrency] || "USD";
  
  console.log('formatCurrency input:', { amount, currency, normalizedCurrency, code });

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
  }).format(amount);
}

/**
 * Gets just the currency symbol for a given currency code
 * @param currency - The currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbolMap: Record<string, string> = {
    USD: "$",
    GBP: "£",
    NGN: "₦", 
    EUR: "€",
    CAD: "C$",
  };

  const normalizedCurrency = (currency || "").trim().toUpperCase();
  return symbolMap[normalizedCurrency] || "$";
}
