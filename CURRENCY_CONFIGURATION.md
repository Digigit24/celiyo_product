# Currency Configuration Guide

## Overview

The application now uses a centralized currency configuration system that allows easy management of currency formatting across the entire application.

**Current Configuration:** Indian Rupee (INR) with symbol ₹

---

## Configuration File

**Location:** `src/lib/currencyConfig.ts`

### Current Settings

```typescript
export const CURRENCY_CONFIG = {
  code: 'INR',              // ISO 4217 currency code
  symbol: '₹',               // Currency symbol
  name: 'Indian Rupee',      // Full currency name
  decimals: 2,               // Number of decimal places
  thousandSeparator: ',',    // Thousand separator
  decimalSeparator: '.',     // Decimal separator
  symbolPosition: 'before',  // Symbol position: 'before' or 'after'
}
```

---

## Usage

### 1. Import the Functions

```typescript
import { formatCurrency, formatIndianCurrency, getCurrencySymbol } from '@/lib/currencyConfig';
```

### 2. Format Currency

#### Basic Formatting

```typescript
// With symbol (default)
formatCurrency(1000)        // Returns: "₹1,000.00"
formatCurrency(5000.50)     // Returns: "₹5,000.50"

// Without symbol
formatCurrency(1000, false) // Returns: "1,000.00"

// Custom decimals
formatCurrency(1000, true, 0) // Returns: "₹1,000"
```

#### Indian Numbering System

For amounts that need Indian numbering (1,00,000 instead of 100,000):

```typescript
formatIndianCurrency(100000)    // Returns: "₹1,00,000.00"
formatIndianCurrency(1000000)   // Returns: "₹10,00,000.00"
formatIndianCurrency(50000.75)  // Returns: "₹50,000.75"
```

### 3. Get Symbol Only

```typescript
const symbol = getCurrencySymbol(); // Returns: "₹"
```

### 4. Parse Currency String

```typescript
import { parseCurrency } from '@/lib/currencyConfig';

parseCurrency("₹1,000.00")    // Returns: 1000
parseCurrency("₹50,000.50")   // Returns: 50000.50
```

---

## Implementation Examples

### In Table Columns

```typescript
const columns = [
  {
    header: 'Amount',
    key: 'amount',
    cell: (row) => formatCurrency(row.amount)
  },
  {
    header: 'Total',
    key: 'total',
    cell: (row) => formatIndianCurrency(row.total)
  }
];
```

### In Components

```tsx
// Display fee amount
<span className="font-medium">{formatCurrency(appointment.fee_amount ?? 0)}</span>

// Display total bill
<div className="text-lg">
  Total: {formatIndianCurrency(billTotal)}
</div>

// Input placeholder
<Input placeholder={`Amount in ${getCurrencySymbol()}`} />
```

### In Forms

```tsx
<Label>Fee Amount ({getCurrencySymbol()})</Label>
<Input
  type="number"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  placeholder="0.00"
/>
<p className="text-xs text-muted-foreground">
  Preview: {formatCurrency(amount || 0)}
</p>
```

---

## Files Already Updated

### ✅ Updated Files

1. **src/pages/Appointments.tsx** - Fee amounts now display with ₹ symbol

### 📝 Files That Need Update

Search for these patterns and replace with currency functions:

1. **Direct Dollar Signs:** Search for `$` in amount displays
2. **Hardcoded Formatting:** Search for amount formatting without currency config
3. **Payment Pages:**
   - `src/pages/opd-production/OPDBills.tsx`
   - `src/pages/opd-production/ProcedureBills.tsx`
   - `src/pages/Transactions.tsx`
   - `src/components/consultation/BillingTab.tsx`

---

## Migration Guide

### Step 1: Import Currency Functions

```typescript
import { formatCurrency } from '@/lib/currencyConfig';
```

### Step 2: Replace Dollar Signs

**Before:**
```tsx
<span>${amount}</span>
<div>Total: ${total}</div>
<Badge>$500</Badge>
```

**After:**
```tsx
<span>{formatCurrency(amount)}</span>
<div>Total: {formatCurrency(total)}</div>
<Badge>{formatCurrency(500)}</Badge>
```

### Step 3: Update Manual Formatting

**Before:**
```typescript
const formatted = `$${amount.toFixed(2)}`;
const display = `$${amount.toLocaleString()}`;
```

**After:**
```typescript
const formatted = formatCurrency(amount);
const display = formatCurrency(amount);
```

---

## Changing Currency

To change to a different currency (e.g., USD):

1. Open `src/lib/currencyConfig.ts`
2. Update the `CURRENCY_CONFIG` object:

```typescript
export const CURRENCY_CONFIG = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  decimals: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  symbolPosition: 'before',
} as const;
```

3. The entire app will automatically use the new currency!

---

## Benefits

✅ **Centralized Configuration** - Change currency in one place
✅ **Consistent Formatting** - Same format throughout the app
✅ **Easy Maintenance** - No need to search and replace symbols
✅ **Localization Ready** - Easy to add multi-currency support
✅ **Type Safe** - Full TypeScript support
✅ **Flexible** - Support for different numbering systems

---

## Best Practices

1. **Always use `formatCurrency()`** instead of hardcoding currency symbols
2. **For Indian users**, use `formatIndianCurrency()` for large amounts
3. **Store amounts as numbers** in database, not formatted strings
4. **Parse user input** with `parseCurrency()` before saving
5. **Use `getCurrencySymbol()`** for labels and placeholders

---

## Examples in Different Contexts

### Dashboard Stats

```tsx
<Card>
  <CardTitle>Total Revenue</CardTitle>
  <CardContent>
    <div className="text-3xl font-bold">
      {formatIndianCurrency(totalRevenue)}
    </div>
  </CardContent>
</Card>
```

### Data Tables

```tsx
{
  header: 'Bill Amount',
  cell: (bill) => (
    <span className="font-semibold">
      {formatCurrency(bill.total_amount)}
    </span>
  )
}
```

### Forms with Validation

```tsx
<FormField
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Amount ({getCurrencySymbol()})</FormLabel>
      <FormControl>
        <Input {...field} type="number" min="0" step="0.01" />
      </FormControl>
      <FormDescription>
        {field.value && `Preview: ${formatCurrency(field.value)}`}
      </FormDescription>
    </FormItem>
  )}
/>
```

### Badges and Pills

```tsx
<Badge variant="success">
  {formatCurrency(payment.amount)} Paid
</Badge>
```

---

## Testing

To verify currency formatting is working:

1. Check Appointments page - fee amounts should show ₹
2. Check any bill/payment pages - amounts should show ₹
3. Try formatting large numbers - should use commas correctly
4. Check mobile view - formatting should remain consistent

---

## Support

For questions or issues with currency configuration:
1. Check this guide first
2. Review `src/lib/currencyConfig.ts`
3. Check console for any formatting errors
4. Verify import statements are correct

---

**Last Updated:** 2025-12-09
**Current Currency:** INR (₹)
**Format Example:** ₹1,00,000.00
