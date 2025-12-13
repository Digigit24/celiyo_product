// src/components/payment-category-drawer/PaymentCategoryBasicInfo.tsx
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaymentCategory, PaymentCategoryCreateData, PaymentCategoryUpdateData } from '@/types/payment.types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category_type: z.enum(['income', 'expense', 'refund', 'adjustment']),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface PaymentCategoryBasicInfoHandle {
  getFormValues: () => Promise<PaymentCategoryCreateData | PaymentCategoryUpdateData | null>;
}

interface PaymentCategoryBasicInfoProps {
  category?: PaymentCategory;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const PaymentCategoryBasicInfo = forwardRef<PaymentCategoryBasicInfoHandle, PaymentCategoryBasicInfoProps>(
  ({ category, mode, onSuccess }, ref) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: category?.name || '',
        category_type: category?.category_type || 'expense',
        description: category?.description || '',
      },
    });

    useEffect(() => {
      if (category && mode !== 'create') {
        form.reset({
          name: category.name,
          category_type: category.category_type,
          description: category.description || '',
        });
      }
    }, [category, mode, form]);

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
                <FormLabel>Category Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Consultation Fees, Medical Supplies"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>Enter a descriptive name for this category</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isReadOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select whether this category is for income or expenses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter category description..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>Optional notes about this category</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'view' && category && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category ID</p>
                  <p className="font-medium">{category.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{category.category_type}</p>
                </div>
                {category.created_at && (
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {new Date(category.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {category.updated_at && (
                  <div>
                    <p className="text-muted-foreground">Updated At</p>
                    <p className="font-medium">
                      {new Date(category.updated_at).toLocaleString()}
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

PaymentCategoryBasicInfo.displayName = 'PaymentCategoryBasicInfo';

export default PaymentCategoryBasicInfo;
