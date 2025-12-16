# Dashboard Statistics Components

A comprehensive set of reusable dashboard components with beautiful visualizations and asymmetric layouts.

## Components

### 1. StatCard
A versatile card component for displaying statistics with optional illustrations and trends.

**Variants:**
- `default` - Standard card with white background
- `gradient` - Gradient blue-purple background with white text
- `outlined` - Border with primary color accent

**Props:**
```typescript
{
  title: string;              // Main title
  subtitle?: string;          // Optional subtitle
  value: string | number;     // Main value to display
  previousValue?: string;     // Additional context text
  trend?: {                   // Optional trend indicator
    value: number;
    isPositive: boolean;
  };
  illustration?: ReactNode;   // SVG or image
  action?: {                  // Optional button
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'gradient' | 'outlined';
}
```

**Example:**
```tsx
<StatCard
  title="Total Revenue"
  value="$62,489.50"
  trend={{ value: 12, isPositive: true }}
  illustration={<MoneyIllustration />}
  variant="gradient"
/>
```

### 2. RevenueChart
Line or area chart for displaying revenue/analytics data.

**Props:**
```typescript
{
  title?: string;
  data: Array<{
    name: string;
    value1: number;
    value2?: number;    // Optional second dataset
  }>;
  dataKey1?: string;    // Label for first dataset
  dataKey2?: string;    // Label for second dataset
  variant?: 'line' | 'area';
}
```

**Example:**
```tsx
<RevenueChart
  title="Monthly Revenue"
  data={[
    { name: 'Jan', value1: 4000, value2: 2400 },
    { name: 'Feb', value1: 3000, value2: 1398 },
  ]}
  dataKey1="Sales"
  dataKey2="Expenses"
  variant="area"
/>
```

### 3. CircularProgress
Donut/pie chart for showing progress or percentage completion.

**Props:**
```typescript
{
  title: string;
  value: number;        // Current value
  maxValue?: number;    // Maximum value (default 100)
  label?: string;       // Text in center
  sublabel?: string;    // Text below chart
  color?: string;       // Primary color
}
```

**Example:**
```tsx
<CircularProgress
  title="Goal Completion"
  value={75}
  maxValue={100}
  label="75%"
  sublabel="Of target achieved"
  color="#10B981"
/>
```

### 4. BarChart
Vertical bar chart for displaying categorical data.

**Props:**
```typescript
{
  title: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;       // Bar color
}
```

**Example:**
```tsx
<BarChart
  title="Weekly Sales"
  data={[
    { name: 'Mon', value: 3200 },
    { name: 'Tue', value: 4500 },
  ]}
  color="#3b82f6"
/>
```

### 5. SVG Illustrations
Pre-built SVG illustrations for dashboard cards.

**Available:**
- `WorkingIllustration` - Person working at desk
- `GoalIllustration` - Target/bullseye
- `MoneyIllustration` - Rupee symbol
- `ChartUpIllustration` - Rising bar chart
- `CalendarIllustration` - Calendar icon

**Example:**
```tsx
<WorkingIllustration className="w-32 h-32" />
```

## Asymmetric Grid Layout

The dashboard uses CSS Grid with 12 columns for flexible, asymmetric layouts:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
  {/* Large card - 8 columns */}
  <div className="lg:col-span-8">
    <StatCard ... />
  </div>

  {/* Small card - 4 columns */}
  <div className="lg:col-span-4">
    <CircularProgress ... />
  </div>

  {/* Medium card - 5 columns */}
  <div className="lg:col-span-5">
    <BarChart ... />
  </div>

  {/* Small card - 3 columns */}
  <div className="lg:col-span-3">
    <StatCard ... />
  </div>
</div>
```

## Usage in Your Project

### Import Components:
```tsx
import {
  StatCard,
  RevenueChart,
  CircularProgress,
  BarChart,
  WorkingIllustration,
  MoneyIllustration,
} from '@/components/dashboard';
```

### Create Custom Dashboard:
```tsx
export const MyDashboard = () => {
  const salesData = [
    { name: 'Jan', value1: 4000, value2: 2400 },
    { name: 'Feb', value1: 3000, value2: 1398 },
    // ... more data
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <StatCard
            title="Welcome!"
            value="$50,000"
            illustration={<WorkingIllustration />}
          />
        </div>

        <div className="col-span-4">
          <RevenueChart data={salesData} />
        </div>
      </div>
    </div>
  );
};
```

## Customization

### Colors
All components use Tailwind CSS classes and can be customized:
- Modify `color` prop for charts
- Use `variant` prop for StatCard
- Override with `className` prop

### Custom SVG Illustrations
You can add your own SVGs:
```tsx
const CustomIllustration = () => (
  <svg viewBox="0 0 100 100">
    {/* Your SVG content */}
  </svg>
);

<StatCard illustration={<CustomIllustration />} />
```

### Responsive Design
Components are mobile-first and responsive:
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 12-column grid with custom spans

## Example Page

See `src/pages/DashboardStats.tsx` for a complete example with:
- Multiple card variants
- Different chart types
- Asymmetric layout
- Responsive design
- Trend indicators
- Custom illustrations

## Dependencies

- `recharts` - For charts
- `lucide-react` - For icons
- `@/components/ui/card` - shadcn/ui Card
- `@/components/ui/button` - shadcn/ui Button
