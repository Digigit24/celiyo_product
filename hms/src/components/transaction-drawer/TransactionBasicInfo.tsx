// src/components/transaction-drawer/TransactionBasicInfo.tsx
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
import { Checkbox } from '@/components/ui/checkbox';
import type { Transaction, TransactionCreateData, TransactionUpdateData } from '@/types/payment.types';
import { usePayment } from '@/hooks/usePayment';

const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  category_id: z.number({ required_error: 'Category is required' }),
  transaction_type: z.enum(['payment', 'refund', 'expense', 'adjustment']),
  payment_method: z.enum(['cash', 'card', 'upi', 'net_banking', 'online', 'cheque', 'insurance', 'other']).optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface TransactionBasicInfoHandle {
  getFormValues: () => Promise<TransactionCreateData | TransactionUpdateData | null>;
}

interface TransactionBasicInfoProps {
  transaction?: Transaction;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const TransactionBasicInfo = forwardRef<TransactionBasicInfoHandle, TransactionBasicInfoProps>(
  ({ transaction, mode, onSuccess }, ref) => {
    const { usePaymentCategories } = usePayment();
    const { data: categoriesData } = usePaymentCategories({ page_size: 100 });
    const categories = categoriesData?.results || [];

    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        amount: transaction?.amount || '',
        category_id: transaction?.category?.id || undefined,
        transaction_type: transaction?.transaction_type || 'payment',
        payment_method: transaction?.payment_method || undefined,
        description: transaction?.description || '',
      },
    });

    useEffect(() => {
      if (transaction && mode !== 'create') {
        form.reset({
          amount: transaction.amount,
          category_id: transaction.category.id,
          transaction_type: transaction.transaction_type,
          payment_method: transaction.payment_method,
          description: transaction.description || '',
        });
      }
    }, [transaction, mode, form]);

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
            name="transaction_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isReadOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  disabled={isReadOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name} ({category.category_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>Enter the transaction amount</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isReadOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="net_banking">Net Banking</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    placeholder="Enter transaction description..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>Optional notes about this transaction</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'view' && transaction && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transaction Number</p>
                  <p className="font-medium">{transaction.transaction_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reconciled</p>
                  <p className="font-medium">
                    {transaction.is_reconciled ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated At</p>
                  <p className="font-medium">
                    {new Date(transaction.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

TransactionBasicInfo.displayName = 'TransactionBasicInfo';

export default TransactionBasicInfo;
