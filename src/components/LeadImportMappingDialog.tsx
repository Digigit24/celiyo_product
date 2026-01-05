// src/components/LeadImportMappingDialog.tsx
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface LeadImportMappingDialogProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  onConfirm: (mappedData: any[]) => void;
}

interface ColumnMapping {
  [systemField: string]: string; // systemField -> excelColumn
}

export const LeadImportMappingDialog = ({
  open,
  onClose,
  file,
  onConfirm,
}: LeadImportMappingDialogProps) => {
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]); // Store all data for transformation
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [loading, setLoading] = useState(false);

  const systemFields = [
    { key: 'name', label: 'Name *', required: true },
    { key: 'phone', label: 'Phone *', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'title', label: 'Title', required: false },
    { key: 'services', label: 'Services', required: false },
    { key: 'date', label: 'Date', required: false },
  ];

  useEffect(() => {
    if (file && open) {
      parseFile();
    }
  }, [file, open]);

  const parseFile = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (jsonData.length > 0) {
        const columns = Object.keys(jsonData[0]);
        setExcelColumns(columns);
        setAllData(jsonData); // Store all data
        setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows

        // Auto-map columns with similar names
        const autoMapping: ColumnMapping = {};
        systemFields.forEach(({ key }) => {
          const found = columns.find(
            (col) =>
              col.toLowerCase().includes(key.toLowerCase()) ||
              key.toLowerCase().includes(col.toLowerCase())
          );
          if (found) {
            autoMapping[key] = found;
          }
        });

        // Special handling for name field - check for first_name, last_name
        if (!autoMapping.name) {
          const firstName = columns.find((col) =>
            col.toLowerCase().includes('first') && col.toLowerCase().includes('name')
          );
          const lastName = columns.find((col) =>
            col.toLowerCase().includes('last') && col.toLowerCase().includes('name')
          );
          if (firstName && lastName) {
            autoMapping.name = `${firstName}+${lastName}`; // Combined mapping
          } else if (firstName) {
            autoMapping.name = firstName;
          }
        }

        setMapping(autoMapping);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (systemField: string, excelColumn: string) => {
    setMapping((prev) => ({
      ...prev,
      [systemField]: excelColumn,
    }));
  };

  const handleConfirm = () => {
    // Check if required fields are mapped
    const requiredFields = systemFields.filter((f) => f.required);
    const missingFields = requiredFields.filter((f) => !mapping[f.key]);

    if (missingFields.length > 0) {
      alert(`Please map required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    // Transform ALL data based on mapping
    const mappedData = allData.map((row) => {
      const newRow: any = {};
      Object.entries(mapping).forEach(([systemField, excelColumn]) => {
        if (excelColumn.includes('+')) {
          // Combined fields (e.g., first_name + last_name)
          const parts = excelColumn.split('+');
          newRow[systemField] = parts.map((p) => row[p.trim()]).filter(Boolean).join(' ').trim();
        } else {
          newRow[systemField] = row[excelColumn];
        }
      });
      return newRow;
    });

    onConfirm(mappedData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Columns for Import</DialogTitle>
          <DialogDescription>
            Map the columns from your file to the system fields. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Column Mapping */}
            <div className="space-y-4">
              <h3 className="font-semibold">Column Mapping</h3>
              <div className="grid grid-cols-2 gap-4">
                {systemFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Select
                      value={mapping[field.key] || ''}
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger id={field.key}>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Skip --</SelectItem>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                        {/* Option to combine first and last name */}
                        {field.key === 'name' && excelColumns.some(c => c.toLowerCase().includes('first')) && excelColumns.some(c => c.toLowerCase().includes('last')) && (
                          <SelectItem
                            value={`${excelColumns.find(c => c.toLowerCase().includes('first'))}+${excelColumns.find(c => c.toLowerCase().includes('last'))}`}
                          >
                            Combine First + Last Name
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Preview (first {previewData.length} rows)</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {systemFields
                          .filter((f) => mapping[f.key])
                          .map((field) => (
                            <th key={field.key} className="px-4 py-2 text-left font-medium">
                              {field.label}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {systemFields
                            .filter((f) => mapping[f.key])
                            .map((field) => {
                              const excelCol = mapping[field.key];
                              let value = '';
                              if (excelCol.includes('+')) {
                                // Combined value
                                const parts = excelCol.split('+');
                                value = parts.map((p) => row[p.trim()]).filter(Boolean).join(' ');
                              } else {
                                value = row[excelCol];
                              }
                              return (
                                <td key={field.key} className="px-4 py-2">
                                  {value || '-'}
                                </td>
                              );
                            })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            Import {allData.length > 0 && `(${allData.length} rows)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
