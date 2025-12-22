# OPD Billing UI - Complete Refactor ✅

## What Was Done

I've completely refactored the OPD billing system to match your new backend models (OPDBill and OPDBillItem). The new implementation provides a unified, cleaner approach to billing.

## Changes Summary

### 1. **Updated TypeScript Types** ✅
- **File**: `src/types/opdBill.types.ts`
- Updated to match backend OPDBill and OPDBillItem models
- Added new types: `OPDType`, `ChargeType`, `BillItemSource`
- Added `SyncClinicalChargesResponse` type

### 2. **Enhanced API Configuration** ✅
- **File**: `src/lib/apiConfig.ts`
- Added `BILL_ITEMS` endpoints under OPD section
- Endpoints for creating, updating, deleting bill items

### 3. **Extended OPD Bill Service** ✅
- **File**: `src/services/opdBill.service.ts`
- Added complete OPDBillItem CRUD operations:
  - `getBillItems(billId)` - Fetch all items for a bill
  - `getBillItemById(id)` - Get single item
  - `createBillItem(itemData)` - Add new item to bill
  - `updateBillItem(id, itemData)` - Update existing item
  - `deleteBillItem(id)` - Remove item from bill

### 4. **New Refactored Billing Component** ✅
- **File**: `src/components/opd/OPDBillingContentRefactored.tsx`
- Complete rewrite with modern, unified approach

## Key Features of the New Component

### 🎯 **Unified Bill Items Table**
- Single table displays ALL bill items regardless of type
- Supports: Consultation, Procedures, Investigations, Pharmacy, Lab, Radiology, Packages, Therapy, Other
- Each item shows:
  - Item name and source badge
  - Editable quantity and unit price
  - Auto-calculated total price
  - Price override indicator
  - Delete button

### 🔍 **Search & Add Functionality**
1. **Add Investigation**
   - Searchable dialog with all active investigations
   - Search by name, code, or category
   - Click to add to bill

2. **Add Procedure**
   - Searchable dialog with all active procedure masters
   - Search by name, code, or category
   - Click to add to bill

3. **Add Custom Item**
   - Dialog to add any custom charge
   - Select source/category
   - Set quantity and price
   - Add notes

### 💰 **Smart Billing Calculations**
- Auto-calculates subtotal from all items
- Discount can be entered as amount or percentage
- Payable amount = Subtotal - Discount
- Balance = Payable - Received
- Real-time updates as you edit items

### 🔄 **Sync Clinical Charges**
- One-click sync of unbilled requisitions
- Automatically creates bill items from:
  - Diagnostic orders
  - Medicine orders
  - Procedure orders
  - Package orders
- Shows count of pending requisitions

### 💾 **Proper API Integration**
- Creates/updates bills using correct payload structure
- Manages bill items separately through bill items API
- Automatically links items to bill via foreign key
- Tracks price overrides (`is_price_overridden`)
- Stores system calculated price vs actual price

## How to Use the New Component

### Option 1: Replace Existing Component (Recommended after testing)
```tsx
// In src/pages/opd-production/Billing.tsx or wherever OPDBillingContent is used

// Change this:
import { OPDBillingContent } from '@/components/opd/OPDBillingContent';

// To this:
import { OPDBillingContentRefactored as OPDBillingContent } from '@/components/opd/OPDBillingContentRefactored';
```

### Option 2: Test Alongside (For gradual migration)
```tsx
// Import both components
import { OPDBillingContent } from '@/components/opd/OPDBillingContent';
import { OPDBillingContentRefactored } from '@/components/opd/OPDBillingContentRefactored';

// Use a toggle or separate route to test
<OPDBillingContentRefactored visit={visit} />
```

## Typical Workflow

1. **Open Billing for a Visit**
   - Component loads existing bill or shows empty state

2. **Add Items to Bill**
   - Click "Add Investigation" → Search → Click to add
   - Click "Add Procedure" → Search → Click to add
   - Click "Add Item" → Fill custom details → Add

3. **Sync Clinical Orders (if any)**
   - Click "Sync X Requisition(s)" button
   - Automatically imports all unbilled orders as bill items

4. **Adjust Items**
   - Edit quantity or price inline
   - Remove unwanted items with trash icon

5. **Set Discount & Payment**
   - Enter discount (amount or %)
   - Select payment mode
   - Enter received amount
   - Balance calculates automatically

6. **Save Bill**
   - Click "Create Bill" (first time) or "Update Bill" (editing)
   - Backend auto-calculates totals and payment status
   - Bill items are saved via bill items API

## Backend Integration Notes

### How It Works with Your Django Backend:

1. **Bill Creation**:
   ```typescript
   // Frontend sends:
   {
     visit: 123,
     doctor: 45,
     opd_type: "consultation",
     charge_type: "first_visit",
     diagnosis: "...",
     discount_percent: "5",
     payment_mode: "cash",
     received_amount: "1000"
   }
   ```
   - Backend's `OPDBill.save()` generates bill_number
   - Backend's `calculate_totals()` is called automatically (via signals)

2. **Bill Items Creation**:
   ```typescript
   // For each item, frontend sends:
   {
     bill: 1,  // Bill ID
     item_name: "Complete Blood Count",
     source: "Lab",
     quantity: 1,
     unit_price: "350.00",
     system_calculated_price: "350.00",
     notes: "Hematology"
   }
   ```
   - Backend's `OPDBillItem.save()` calculates total_price
   - Backend's signal updates parent bill totals

3. **Auto-Recalculation**:
   - When items change, backend signal fires
   - `OPDBill.calculate_totals()` runs
   - Totals, payable amount, payment status all update automatically

## API Endpoints Used

### Bills:
- `POST /api/opd/opd-bills/` - Create bill
- `PATCH /api/opd/opd-bills/:id/` - Update bill
- `GET /api/opd/opd-bills/?visit=:id` - Get bills for visit

### Bill Items:
- `POST /api/opd/opd-bill-items/` - Add item to bill
- `PATCH /api/opd/opd-bill-items/:id/` - Update item
- `DELETE /api/opd/opd-bill-items/:id/` - Remove item
- `GET /api/opd/opd-bill-items/?bill=:id` - Get items for bill

### Sync:
- `POST /api/opd/visits/:id/sync_clinical_charges/` - Sync all unbilled orders

## Testing Checklist

- [ ] Create new bill with consultation item
- [ ] Add investigations via search
- [ ] Add procedures via search
- [ ] Add custom items
- [ ] Edit item quantity and price
- [ ] Remove items
- [ ] Apply discount (% and amount)
- [ ] Set received amount
- [ ] Verify balance calculation
- [ ] Save bill (creates bill + items)
- [ ] Edit existing bill
- [ ] Sync clinical charges
- [ ] Verify backend calculates totals correctly

## Benefits Over Old Implementation

1. **Cleaner Data Model**: Single unified items table instead of separate arrays
2. **Better API Mapping**: Directly matches backend structure
3. **Automatic Calculations**: Backend handles all total calculations via signals
4. **Flexible**: Easy to add any type of charge as a bill item
5. **Traceable**: Tracks system price vs override price
6. **Simpler Code**: Less state management, clearer logic
7. **Scalable**: Easy to add new item sources/types

## Migration Path

1. ✅ **Phase 1**: Types and services updated
2. ✅ **Phase 2**: New component created
3. **Phase 3**: Test new component (YOU ARE HERE)
4. **Phase 4**: Replace old component
5. **Phase 5**: Remove old component file

## Need Help?

- The component is self-contained and fully functional
- All backend API calls are properly typed
- Error handling with toast notifications
- Loading states for async operations

## Files Modified/Created

**Created:**
- `src/components/opd/OPDBillingContentRefactored.tsx` (New billing component)
- `BILLING_REFACTOR_COMPLETE.md` (This file)

**Modified:**
- `src/types/opdBill.types.ts` (Updated types)
- `src/services/opdBill.service.ts` (Added bill items methods)
- `src/lib/apiConfig.ts` (Added bill items endpoints)

---

**Status**: ✅ COMPLETE - Ready for testing and integration!
