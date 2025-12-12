# Dashboard Custom Icons Setup Guide

This guide explains how to add custom PNG icons for the dashboard stat cards.

## File Structure

Create the following folder structure for your icons:

```
src/
├── assets/
│   └── icons/
│       ├── total-patients.png
│       ├── todays-visits.png
│       ├── total-revenue.png
│       └── pending-bills.png
└── pages/
    └── Dashboard.tsx
```

## Step-by-Step Instructions

### Step 1: Add Your PNG Icon Files

1. Create the folder structure:
   - Create `src/assets/` folder (if it doesn't exist)
   - Create `src/assets/icons/` folder inside assets

2. Place your PNG icon files in `src/assets/icons/`:
   - `total-patients.png` - Icon for Total Patients card
   - `todays-visits.png` - Icon for Today's Visits card
   - `total-revenue.png` - Icon for Total Revenue card
   - `pending-bills.png` - Icon for Pending Bills card

**Recommended icon size:** 48x48 pixels or 64x64 pixels for best quality

### Step 2: Import Icons in Dashboard.tsx

Open `src/pages/Dashboard.tsx` and find the "CUSTOM ICONS IMPORT" section (lines 19-34).

Uncomment and update the import statements:

```typescript
// ==================== CUSTOM ICONS IMPORT ====================
// Import your custom PNG icons here
import TotalPatientsIcon from '@/assets/icons/total-patients.png';
import TodaysVisitsIcon from '@/assets/icons/todays-visits.png';
import TotalRevenueIcon from '@/assets/icons/total-revenue.png';
import PendingBillsIcon from '@/assets/icons/pending-bills.png';

// After importing, uncomment and use them in the customIcons object below:
const customIcons = {
  totalPatients: TotalPatientsIcon,
  todaysVisits: TodaysVisitsIcon,
  totalRevenue: TotalRevenueIcon,
  pendingBills: PendingBillsIcon,
};
// ============================================================
```

### Step 3: Update StatCard Components

Find each StatCard component (around lines 573-624) and update the icon prop:

**Total Patients Card:**
```typescript
<StatCard
  title="Total Patients"
  value={patientStats?.total_patients?.toLocaleString() || '0'}
  icon={customIcons.totalPatients || <Users className="w-7 h-7 text-indigo-600" />}
  // ... rest of props
/>
```

**Today's Visits Card:**
```typescript
<StatCard
  title="Today's Visits"
  value={visitStats?.today_visits?.toLocaleString() || '0'}
  icon={customIcons.todaysVisits || <Calendar className="w-7 h-7 text-emerald-600" />}
  // ... rest of props
/>
```

**Total Revenue Card:**
```typescript
<StatCard
  title="Total Revenue"
  value={`₹${parseFloat(billStats?.received_amount || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
  icon={customIcons.totalRevenue || <DollarSign className="w-7 h-7 text-amber-600" />}
  // ... rest of props
/>
```

**Pending Bills Card:**
```typescript
<StatCard
  title="Pending Bills"
  value={(billStats?.unpaid_bills || 0) + (billStats?.partial_bills || 0)}
  icon={customIcons.pendingBills || <FileText className="w-7 h-7 text-rose-600" />}
  // ... rest of props
/>
```

## Icon Display Settings

The icons will be displayed with the following settings:
- **Size:** 48x48 pixels (w-12 h-12)
- **Object fit:** Contain (preserves aspect ratio)
- **Background:** Rounded container with backdrop blur
- **Shadow:** Soft shadow for depth

## Fallback Behavior

If you haven't added custom icons yet or if an icon fails to load, the system will automatically fall back to the default Lucide icons:
- Total Patients: Users icon (indigo)
- Today's Visits: Calendar icon (emerald)
- Total Revenue: DollarSign icon (amber)
- Pending Bills: FileText icon (rose)

## Troubleshooting

### Icons not showing?
1. Check that the file paths are correct
2. Verify the PNG files exist in `src/assets/icons/`
3. Make sure the import statements don't have typos
4. Check browser console for any import errors

### Icons look blurry?
- Use higher resolution PNG files (64x64 or 128x128 pixels)
- Ensure PNG files have transparent backgrounds for best results

### Want different icon sizes?
Edit line 150 in Dashboard.tsx:
```typescript
<img src={icon} alt={title} className="w-12 h-12 object-contain" />
```
Change `w-12 h-12` to your preferred Tailwind size classes (e.g., `w-16 h-16` for larger icons)

## Example Complete Setup

```typescript
// At the top of Dashboard.tsx (lines 19-34)
import TotalPatientsIcon from '@/assets/icons/total-patients.png';
import TodaysVisitsIcon from '@/assets/icons/todays-visits.png';
import TotalRevenueIcon from '@/assets/icons/total-revenue.png';
import PendingBillsIcon from '@/assets/icons/pending-bills.png';

const customIcons = {
  totalPatients: TotalPatientsIcon,
  todaysVisits: TodaysVisitsIcon,
  totalRevenue: TotalRevenueIcon,
  pendingBills: PendingBillsIcon,
};

// In the Stats Cards section (around line 576)
icon={customIcons.totalPatients || <Users className="w-7 h-7 text-indigo-600" />}
```

That's it! Your custom icons should now be displaying in the dashboard stat cards.
