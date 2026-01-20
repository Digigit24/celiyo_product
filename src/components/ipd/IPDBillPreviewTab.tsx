// src/components/ipd/IPDBillPreviewTab.tsx
import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, FileText } from 'lucide-react';
import type { Admission, IPDBilling, IPDBillItem } from '@/types/ipdBilling.types';

interface IPDFormData {
  billNumber: string;
  billDate: string;
  diagnosis: string;
  remarks: string;
}

interface BillingData {
  subtotal: string;
  discount: string;
  discountPercent: string;
  totalAmount: string;
  paymentMode: string;
  receivedAmount: string;
  balanceAmount: string;
}

interface IPDBillPreviewTabProps {
  admission: Admission;
  billingFormData: IPDFormData;
  billItems: IPDBillItem[];
  billingData: BillingData;
  tenantData?: any;
  tenantSettings?: any;
  onPrint: () => void;
  onDownloadPDF: () => void;
}

export const IPDBillPreviewTab = forwardRef<HTMLDivElement, IPDBillPreviewTabProps>(
  (
    {
      admission,
      billingFormData,
      billItems,
      billingData,
      tenantData,
      tenantSettings,
      onPrint,
      onDownloadPDF,
    },
    printAreaRef
  ) => {
    return (
      <div className="space-y-6">
        {/* Preview Card */}
        <Card className="lg:col-span-2">
          <div
            id="bill-preview-area"
            ref={printAreaRef}
            className="p-8 space-y-6"
            style={{
              maxWidth: '210mm',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              color: '#000000',
            }}
          >
            {/* Hospital Header */}
            <div className="text-center border-b-2 pb-4" style={{ borderColor: '#374151' }}>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
                {tenantData?.name || 'HOSPITAL'}
              </h1>

              {/* Address and Contact Info */}
              <div className="text-sm mt-2 space-y-1">
                <p style={{ color: '#6b7280' }}>
                  {tenantSettings?.address || 'Address not available'}
                </p>
                <p style={{ color: '#6b7280' }}>
                  mail id : {tenantSettings?.contact_email || 'N/A'} , Contact:{' '}
                  {tenantSettings?.contact_phone || 'N/A'}
                </p>
              </div>
            </div>

            {/* Bill Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: '#374151' }}>
                IPD INVOICE
              </h2>
            </div>

            {/* Top meta */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                <span className="font-semibold" style={{ color: '#374151' }}>
                  Patient Name
                </span>
                <span style={{ color: '#000000' }}>{admission.patient_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                <span className="font-semibold" style={{ color: '#374151' }}>
                  Admission ID
                </span>
                <span style={{ color: '#000000' }}>{admission.admission_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                <span className="font-semibold" style={{ color: '#374151' }}>
                  Ward / Bed
                </span>
                <span style={{ color: '#000000' }}>
                  {admission.ward || 'N/A'} / {admission.bed || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                <span className="font-semibold" style={{ color: '#374151' }}>
                  Admission Date
                </span>
                <span style={{ color: '#000000' }}>
                  {admission.admission_date ? format(new Date(admission.admission_date), 'dd/MM/yyyy') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                <span className="font-semibold" style={{ color: '#374151' }}>
                  Doctor
                </span>
                <span style={{ color: '#000000' }}>{admission.doctor_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                <span className="font-semibold" style={{ color: '#374151' }}>
                  Bill No / Date
                </span>
                <span style={{ color: '#000000' }}>
                  {billingFormData.billNumber || 'N/A'} • {billingFormData.billDate ? format(new Date(billingFormData.billDate), 'dd/MM/yyyy') : 'N/A'}
                </span>
              </div>
            </div>

            {/* Charges table */}
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    borderTop: '2px solid #9ca3af',
                    borderBottom: '2px solid #9ca3af',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <th className="text-left py-3 px-2 font-semibold" style={{ color: '#374151' }}>
                    Description
                  </th>
                  <th
                    className="text-center py-3 px-2 font-semibold w-16"
                    style={{ color: '#374151' }}
                  >
                    Qty
                  </th>
                  <th
                    className="text-right py-3 px-2 font-semibold w-24"
                    style={{ color: '#374151' }}
                  >
                    Rate
                  </th>
                  <th
                    className="text-right py-3 px-2 font-semibold w-28"
                    style={{ color: '#374151' }}
                  >
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {billItems && billItems.length > 0 ? (
                  billItems.map((item, index) => (
                    <tr key={item.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="py-3 px-2" style={{ color: '#000000' }}>
                        <div>{item.item_name}</div>
                        {item.notes && (
                          <div className="text-xs" style={{ color: '#6b7280' }}>
                            {item.notes}
                          </div>
                        )}
                        <div className="text-xs capitalize" style={{ color: '#6b7280' }}>
                          {item.source}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center" style={{ color: '#000000' }}>
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right" style={{ color: '#000000' }}>
                        {Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold" style={{ color: '#000000' }}>
                        {Number(item.total_price).toFixed(2)}
                        {item.is_price_overridden && (
                          <span className="text-xs text-orange-600 ml-1">*</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="py-8 px-2 text-center text-muted-foreground" colSpan={4}>
                      No items in bill
                    </td>
                  </tr>
                )}
                {billingFormData.diagnosis && (
                  <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <td className="py-2 px-2 text-xs" colSpan={4} style={{ color: '#374151' }}>
                      <span className="font-semibold">Diagnosis:</span> {billingFormData.diagnosis}
                    </td>
                  </tr>
                )}
                {billingFormData.remarks && (
                  <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <td className="py-2 px-2 text-xs" colSpan={4} style={{ color: '#374151' }}>
                      <span className="font-semibold">Remarks:</span> {billingFormData.remarks}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Price override notice */}
            {billItems && billItems.some(item => item.is_price_overridden) && (
              <div className="text-xs" style={{ color: '#6b7280', marginTop: '8px' }}>
                * Price has been manually adjusted
              </div>
            )}

            {/* Amounts */}
            <div
              className="mt-6 space-y-3 text-sm p-4 rounded-lg"
              style={{ backgroundColor: '#f9fafb' }}
            >
              <div className="flex justify-between">
                <span style={{ color: '#4b5563' }}>Subtotal</span>
                <span className="font-semibold" style={{ color: '#000000' }}>
                  ₹ {billingData.subtotal}
                </span>
              </div>
              {parseFloat(billingData.discount) > 0 && (
                <div className="flex justify-between" style={{ color: '#15803d' }}>
                  <span>
                    Discount ({billingData.discountPercent}%)
                  </span>
                  <span className="font-semibold">- ₹ {billingData.discount}</span>
                </div>
              )}
              <div
                className="pt-3 flex justify-between text-base font-bold"
                style={{ borderTop: '2px solid #9ca3af', color: '#000000' }}
              >
                <span>Total Amount</span>
                <span>₹ {billingData.totalAmount}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#15803d' }}>
                <span>Amount Received ({billingData.paymentMode.toUpperCase()})</span>
                <span className="font-semibold">₹ {billingData.receivedAmount}</span>
              </div>
              <div className="flex justify-between text-base font-bold" style={{ color: '#c2410c' }}>
                <span>Balance Due</span>
                <span>₹ {billingData.balanceAmount}</span>
              </div>
            </div>

            {/* Signatures & Terms */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs mb-2" style={{ color: '#4b5563' }}>
                  Patient Signature
                </p>
                <div className="h-12" style={{ borderBottom: '2px solid #9ca3af' }} />
              </div>
              <div>
                <p className="text-xs mb-2" style={{ color: '#4b5563' }}>
                  Authorized Signatory
                </p>
                <div className="h-12" style={{ borderBottom: '2px solid #9ca3af' }} />
              </div>
            </div>

            <div className="mt-6 text-xs" style={{ color: '#4b5563' }}>
              <p className="font-semibold mb-2">Terms & Conditions</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This is a computer generated bill; signature not required.</li>
                <li>Please retain this copy for future reference.</li>
                <li>Bills are non-transferable.</li>
              </ul>
            </div>

            <div
              className="mt-4 text-center text-xs pt-4"
              style={{ borderTop: '1px solid #d1d5db', color: '#6b7280' }}
            >
              Generated on: {format(new Date(), 'dd/MM/yyyy hh:mm a')}
            </div>
          </div>
        </Card>

        {/* Print / Download Actions */}
        <Card className="no-print">
          <CardContent className="pt-6">
            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="lg" onClick={onDownloadPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="default" size="lg" onClick={onPrint}>
                <Receipt className="mr-2 h-4 w-4" />
                Print Bill
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

IPDBillPreviewTab.displayName = 'IPDBillPreviewTab';
