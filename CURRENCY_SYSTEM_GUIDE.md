# Currency System Guide

## Overview

The Celiyo application now supports dynamic, tenant-based currency configuration. Each tenant can configure their preferred currency settings through the Admin Settings page, and all currency displays throughout the application will automatically use those settings.

## Features

✅ **Multi-currency Support** - Support for INR, USD, EUR, GBP, AUD, CAD, SGD, AED, SAR, JPY, CNY, and more
✅ **Tenant-Level Configuration** - Each tenant can set their own currency preferences
✅ **Indian Numbering System** - Optional support for Indian numbering format (1,00,000 vs 100,000)
✅ **Customizable Formatting** - Control decimal places, separators, symbol position
✅ **Real-time Preview** - Preview how amounts will be displayed before saving
✅ **Backward Compatible** - Existing code continues to work with default INR settings

## Configuration

### Admin Settings

Tenants can configure currency settings at `/admin/settings` in the **Currency** tab:

1. **Select Currency** - Choose from predefined currencies or configure custom
2. **Currency Code** - ISO 4217 code (e.g., INR, USD, EUR)
3. **Currency Symbol** - Symbol to display (e.g., ₹, $, €)
4. **Currency Name** - Full name (e.g., Indian Rupee)
5. **Decimal Places** - Number of decimal places (0, 2, or 3)
6. **Thousand Separator** - Separator for thousands (comma, period, space, or none)
7. **Decimal Separator** - Separator for decimals (period or comma)
8. **Symbol Position** - Before or after the amount
9. **Indian Numbering** - Use Indian numbering system (1,00,000) or standard (100,000)

### Currency Settings Storage

Currency settings are stored in the tenant's `settings` JSON field:

```json
{
  "currency_code": "INR",
  "currency_symbol": "₹",
  "currency_name": "Indian Rupee",
  "currency_decimals": 2,
  "currency_thousand_separator": ",",
  "currency_decimal_separator": ".",
  "currency_symbol_position": "before",
  "currency_use_indian_numbering": true
}
```

## Usage for Developers

### Method 1: Using the `useCurrency` Hook (Recommended)

For React components, use the `useCurrency` hook which automatically reads from tenant settings:

```tsx
import { useCurrency } from '@/hooks/useCurrency';

function MyComponent() {
  const { formatCurrency, getCurrencySymbol, config } = useCurrency();

  const price = 123456.78;

  return (
    <div>
      <p>Price: {formatCurrency(price)}</p>
      {/* Output: ₹1,23,456.78 (with Indian numbering) */}

      <p>Amount: {formatCurrency(price, true, 0)}</p>
      {/* Output: ₹123,457 (no decimals) */}

      <p>Symbol: {getCurrencySymbol()}</p>
      {/* Output: ₹ */}
    </div>
  );
}
```

### Method 2: Using the Static Config (Legacy/Non-React)

For utility functions or non-React code:

```typescript
import { formatCurrency, getCurrencyConfig } from '@/lib/currencyConfig';
import { useAuth } from '@/hooks/useAuth';

// In a utility function
function calculateTotal(items: Item[]) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  // Uses default INR configuration
  return formatCurrency(total);
}

// With tenant settings
function calculateTotalWithTenant(items: Item[], tenantSettings: any) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const config = getCurrencyConfig(tenantSettings);

  return formatCurrency(total, true, undefined, config);
}
```

## API Reference

### `useCurrency` Hook

Returns an object with:

- **`config`** - Current currency configuration object
- **`formatCurrency(amount, showSymbol?, decimals?)`** - Format amount as currency
- **`formatIndianCurrency(amount, showSymbol?)`** - Format with Indian numbering
- **`getCurrencySymbol()`** - Get currency symbol
- **`getCurrencyCode()`** - Get currency code
- **`parseCurrency(currencyString)`** - Parse formatted currency string to number

### Static Functions

```typescript
// Format functions
formatCurrency(amount, showSymbol?, decimals?, config?)
formatIndianCurrency(amount, showSymbol?, config?)

// Getters
getCurrencySymbol(config?)
getCurrencyCode(config?)
getCurrencyConfig(tenantSettings?)

// Parser
parseCurrency(currencyString, config?)
```

## Examples

### Example 1: Display Invoice Total

```tsx
function InvoiceTotal({ total }: { total: number }) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="text-2xl font-bold">
      Total: {formatCurrency(total)}
    </div>
  );
}
```

### Example 2: Input Field with Currency

```tsx
function PriceInput({ value, onChange }: PriceInputProps) {
  const { getCurrencySymbol, parseCurrency, formatCurrency } = useCurrency();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrency(e.target.value);
    onChange(parsed);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-2">{getCurrencySymbol()}</span>
      <input
        type="text"
        value={formatCurrency(value, false)}
        onChange={handleChange}
        className="pl-8"
      />
    </div>
  );
}
```

### Example 3: Different Currencies Side-by-Side

```tsx
function MultiCurrencyDisplay({ amountINR }: { amountINR: number }) {
  const { formatCurrency } = useCurrency();

  // Tenant's configured currency
  const tenantAmount = formatCurrency(amountINR);

  // USD conversion (example)
  const usdConfig = {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before' as const,
    useIndianNumbering: false,
  };

  const amountUSD = amountINR / 83; // Example conversion rate
  const usdAmount = formatCurrency(amountUSD, true, 2, usdConfig);

  return (
    <div>
      <p>Local: {tenantAmount}</p>
      <p>USD: {usdAmount}</p>
    </div>
  );
}
```

## Migration Guide

### Updating Existing Components

If you have existing components using hardcoded currency formatting:

**Before:**
```tsx
function OldComponent({ amount }: { amount: number }) {
  return <div>₹{amount.toFixed(2)}</div>;
}
```

**After:**
```tsx
import { useCurrency } from '@/hooks/useCurrency';

function NewComponent({ amount }: { amount: number }) {
  const { formatCurrency } = useCurrency();
  return <div>{formatCurrency(amount)}</div>;
}
```

### Components Already Using `formatCurrency`

If your components already import from `@/lib/currencyConfig`:

**Before:**
```tsx
import { formatCurrency } from '@/lib/currencyConfig';

function Component({ amount }: { amount: number }) {
  return <div>{formatCurrency(amount)}</div>;
}
```

**After (Option 1 - Recommended):**
```tsx
import { useCurrency } from '@/hooks/useCurrency';

function Component({ amount }: { amount: number }) {
  const { formatCurrency } = useCurrency();
  return <div>{formatCurrency(amount)}</div>;
}
```

**After (Option 2 - Quick Fix):**
```tsx
import { formatCurrency, getCurrencyConfig } from '@/lib/currencyConfig';
import { useAuth } from '@/hooks/useAuth';

function Component({ amount }: { amount: number }) {
  const { getTenant } = useAuth();
  const tenant = getTenant();
  const config = getCurrencyConfig(tenant?.settings);

  return <div>{formatCurrency(amount, true, undefined, config)}</div>;
}
```

## Testing

To test the currency system:

1. **Login as Admin** - Navigate to `/admin/settings`
2. **Go to Currency Tab** - Click on the "Currency" tab
3. **Change Currency** - Select a different currency (e.g., USD)
4. **Save Settings** - Click "Save Currency Settings"
5. **Verify Display** - Check that amounts throughout the app now show in USD

### Test Cases

- ✅ INR with Indian numbering: `₹1,23,456.78`
- ✅ INR with standard numbering: `₹123,456.78`
- ✅ USD with standard numbering: `$123,456.78`
- ✅ EUR with period separator: `€123.456,78`
- ✅ Symbol after amount: `123,456.78₹`
- ✅ No decimals: `₹123,457`

## Troubleshooting

### Currency not updating after saving

- **Check browser console** for errors
- **Refresh the page** - Settings are loaded on page load
- **Clear local storage** - Old cached data might be causing issues

### Wrong currency symbol showing

- **Verify tenant settings** - Check that currency settings were saved correctly
- **Check component** - Make sure it's using `useCurrency` hook or passing tenant config

### Indian numbering not working

- **Check settings** - Ensure "Indian Numbering" toggle is enabled
- **Use correct function** - Use `formatIndianCurrency` or set `useIndianNumbering: true`

## Database Schema

The currency settings are stored in the `tenants` table, `settings` JSON field. No database migration is required as the `settings` field is already a flexible JSON field.

```sql
-- Example query to view tenant currency settings
SELECT
  id,
  name,
  settings->>'currency_code' as currency_code,
  settings->>'currency_symbol' as currency_symbol,
  settings->>'currency_name' as currency_name
FROM tenants;
```

## Future Enhancements

Potential future improvements:

- [ ] User-level currency preferences (override tenant default)
- [ ] Multi-currency support (display in multiple currencies)
- [ ] Currency conversion API integration
- [ ] Historical exchange rates
- [ ] Currency format presets (regional templates)
- [ ] Accounting format (negative numbers in parentheses)

## Support

For issues or questions:
- Check the console for error messages
- Review this documentation
- Contact the development team
- File an issue in the project repository

## Files Modified/Created

### New Files
- `/src/components/admin-settings/CurrencySettingsTab.tsx` - Currency settings UI
- `/src/hooks/useCurrency.ts` - Currency hook for React components
- `/CURRENCY_SYSTEM_GUIDE.md` - This documentation file

### Modified Files
- `/src/types/tenant.types.ts` - Added CurrencySettings interface
- `/src/pages/AdminSettings.tsx` - Added currency tab and state management
- `/src/lib/currencyConfig.ts` - Updated to support dynamic configuration

### Files to Update (Recommended)
Components currently using currency that should migrate to `useCurrency`:
- `/src/pages/opd-production/Billing.tsx`
- `/src/pages/opd-production/OPDBills.tsx`
- `/src/pages/opd-production/ProcedureBills.tsx`
- `/src/pages/Transactions.tsx`
- `/src/pages/Pharmacy.tsx`
- `/src/pages/Dashboard.tsx`
- And other components displaying currency amounts

---

**Last Updated:** 2025-12-15
**Version:** 1.0.0
