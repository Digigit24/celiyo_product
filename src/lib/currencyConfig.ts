// src/lib/currencyConfig.ts

/**
 * Currency Configuration for the Application
 * Centralized currency settings to be used across the entire app
 */

export const CURRENCY_CONFIG = {
  // Currency code (ISO 4217)
  code: 'INR',

  // Currency symbol
  symbol: '₹',

  // Currency name
  name: 'Indian Rupee',

  // Decimal places
  decimals: 2,

  // Thousand separator
  thousandSeparator: ',',

  // Decimal separator
  decimalSeparator: '.',

  // Symbol position: 'before' or 'after'
  symbolPosition: 'before',
} as const;

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @param decimals - Number of decimal places (default: from config)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string,
  showSymbol: boolean = true,
  decimals: number = CURRENCY_CONFIG.decimals
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return showSymbol ? `${CURRENCY_CONFIG.symbol}0.00` : '0.00';
  }

  // Format number with decimals
  const formatted = numAmount.toFixed(decimals);

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = formatted.split('.');

  // Add thousand separators (Indian numbering system: 1,00,000)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, CURRENCY_CONFIG.thousandSeparator);

  // Combine parts
  const finalAmount = decimalPart ? `${formattedInteger}${CURRENCY_CONFIG.decimalSeparator}${decimalPart}` : formattedInteger;

  // Add symbol based on position
  if (!showSymbol) {
    return finalAmount;
  }

  return CURRENCY_CONFIG.symbolPosition === 'before'
    ? `${CURRENCY_CONFIG.symbol}${finalAmount}`
    : `${finalAmount}${CURRENCY_CONFIG.symbol}`;
};

/**
 * Format a number as currency with Indian numbering system
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string with Indian numbering
 */
export const formatIndianCurrency = (
  amount: number | string,
  showSymbol: boolean = true
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return showSymbol ? `${CURRENCY_CONFIG.symbol}0.00` : '0.00';
  }

  const formatted = numAmount.toFixed(CURRENCY_CONFIG.decimals);
  const [integerPart, decimalPart] = formatted.split('.');

  // Indian numbering system: last 3 digits, then groups of 2
  let formattedInteger = '';
  const length = integerPart.length;

  if (length <= 3) {
    formattedInteger = integerPart;
  } else {
    const lastThree = integerPart.substring(length - 3);
    const remaining = integerPart.substring(0, length - 3);

    formattedInteger = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const finalAmount = `${formattedInteger}.${decimalPart}`;

  return showSymbol
    ? `${CURRENCY_CONFIG.symbol}${finalAmount}`
    : finalAmount;
};

/**
 * Get currency symbol
 * @returns Currency symbol
 */
export const getCurrencySymbol = (): string => {
  return CURRENCY_CONFIG.symbol;
};

/**
 * Get currency code
 * @returns Currency code
 */
export const getCurrencyCode = (): string => {
  return CURRENCY_CONFIG.code;
};

/**
 * Parse currency string to number
 * @param currencyString - String with currency symbol and separators
 * @returns Parsed number
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;

  // Remove currency symbol and separators
  const cleaned = currencyString
    .replace(CURRENCY_CONFIG.symbol, '')
    .replace(new RegExp(`\\${CURRENCY_CONFIG.thousandSeparator}`, 'g'), '')
    .replace(CURRENCY_CONFIG.decimalSeparator, '.')
    .trim();

  return parseFloat(cleaned) || 0;
};
