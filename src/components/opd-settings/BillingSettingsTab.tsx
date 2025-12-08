// src/components/opd-settings/BillingSettingsTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw } from 'lucide-react';

export const BillingSettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Configuration</CardTitle>
          <CardDescription>
            Configure billing settings for OPD visits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
              <Input
                id="invoice-prefix"
                placeholder="e.g., INV-OPD-"
                defaultValue="INV-OPD-"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                placeholder="0"
                defaultValue="0"
                step="0.1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="INR">
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-terms">Default Payment Terms (days)</Label>
              <Input
                id="payment-terms"
                type="number"
                placeholder="0"
                defaultValue="0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-generate-invoice">Auto-generate Invoice</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically generate invoice after visit completion
                </p>
              </div>
              <Switch id="auto-generate-invoice" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-payment">Require Payment Before Discharge</Label>
                <p className="text-sm text-muted-foreground">
                  Patient must clear bills before discharge
                </p>
              </div>
              <Switch id="require-payment" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-discount">Enable Discounts</Label>
                <p className="text-sm text-muted-foreground">
                  Allow staff to apply discounts to bills
                </p>
              </div>
              <Switch id="enable-discount" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-insurance">Enable Insurance Billing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow insurance-based billing for patients
                </p>
              </div>
              <Switch id="enable-insurance" defaultChecked />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Configure accepted payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cash">Cash</Label>
              <Switch id="cash" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="card">Credit/Debit Card</Label>
              <Switch id="card" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="upi">UPI</Label>
              <Switch id="upi" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cheque">Cheque</Label>
              <Switch id="cheque" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="online">Online Banking</Label>
              <Switch id="online" defaultChecked />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
