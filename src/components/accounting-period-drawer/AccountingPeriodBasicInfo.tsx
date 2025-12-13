// src/components/accounting-period-drawer/AccountingPeriodBasicInfo.tsx
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AccountingPeriod, AccountingPeriodCreateData, AccountingPeriodUpdateData } from '@/types/payment.types';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  period_type: z.enum(['monthly', 'quarterly', 'annual']),
});

type FormValues = z.infer<typeof formSchema>;

export interface AccountingPeriodBasicInfoHandle {
  getFormValues: () => Promise<AccountingPeriodCreateData | AccountingPeriodUpdateData | null>;
}

interface AccountingPeriodBasicInfoProps {
  period?: AccountingPeriod;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const AccountingPeriodBasicInfo = forwardRef<AccountingPeriodBasicInfoHandle, AccountingPeriodBasicInfoProps>(
  ({ period, mode, onSuccess }, ref) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: period?.name || '',
        start_date: period?.start_date || '',
        end_date: period?.end_date || '',
        period_type: period?.period_type || 'monthly',
      },
    });

    useEffect(() => {
      if (period && mode !== 'create') {
        form.reset({
          name: period.name,
          start_date: period.start_date,
          end_date: period.end_date,
          period_type: period.period_type,
        });
      }
    }, [period, mode, form]);

    useImperativeHandle(ref, () => ({
      getFormValues: async () => {
        const isValid = await form.trigger();
        if (!isValid) {
          return null;
        }
        return form.getValues();
      },
    }));

    const isReadOnly = mode === 'view';

    return (
      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., January 2024, Q1 2024"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>Enter a descriptive name for this period</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isReadOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of accounting period
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {mode === 'view' && period && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h3 className="font-semibold text-sm mb-3">Financial Summary</h3>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{parseFloat(period.total_income).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-lg font-semibold text-red-600">
                    ₹{parseFloat(period.total_expenses).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-lg font-semibold ${parseFloat(period.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{parseFloat(period.net_profit).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">
                    {period.is_closed ? '🔒 Closed' : '🔓 Open'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                {period.created_at && (
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {new Date(period.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {period.updated_at && (
                  <div>
                    <p className="text-muted-foreground">Updated At</p>
                    <p className="font-medium">
                      {new Date(period.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {period.closed_at && (
                  <div>
                    <p className="text-muted-foreground">Closed At</p>
                    <p className="font-medium">
                      {new Date(period.closed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

AccountingPeriodBasicInfo.displayName = 'AccountingPeriodBasicInfo';

export default AccountingPeriodBasicInfo;
