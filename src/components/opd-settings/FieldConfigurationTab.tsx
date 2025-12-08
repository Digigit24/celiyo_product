// src/components/opd-settings/FieldConfigurationTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, GripVertical, Eye, EyeOff, Pencil } from 'lucide-react';

export const FieldConfigurationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OPD Field Configuration</CardTitle>
              <CardDescription>
                Customize fields for OPD visits, consultations, and billing
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-4 p-3 border-b font-medium text-sm">
              <div className="col-span-1"></div>
              <div className="col-span-3">Field Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Section</div>
              <div className="col-span-1 text-center">Required</div>
              <div className="col-span-1 text-center">Visible</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Visit Fields */}
            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Patient Name</div>
                <div className="text-sm text-muted-foreground">Standard field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Text</Badge>
              </div>
              <div className="col-span-2">
                <Badge>Visit</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked disabled />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked disabled />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Visit Date</div>
                <div className="text-sm text-muted-foreground">Standard field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Date</Badge>
              </div>
              <div className="col-span-2">
                <Badge>Visit</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked disabled />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked disabled />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Doctor</div>
                <div className="text-sm text-muted-foreground">Standard field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Dropdown</Badge>
              </div>
              <div className="col-span-2">
                <Badge>Visit</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked disabled />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Visit Type</div>
                <div className="text-sm text-muted-foreground">Standard field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Dropdown</Badge>
              </div>
              <div className="col-span-2">
                <Badge>Visit</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Referral Source</div>
                <div className="text-sm text-muted-foreground">Custom field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Text</Badge>
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">Visit</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Insurance Provider</div>
                <div className="text-sm text-muted-foreground">Custom field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Dropdown</Badge>
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">Billing</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 p-3 border-b items-center hover:bg-muted/50 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="col-span-1 flex items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              <div className="col-span-3">
                <div className="font-medium">Follow-up Notes</div>
                <div className="text-sm text-muted-foreground">Custom field</div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline">Long Text</Badge>
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">Clinical</Badge>
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch />
              </div>
              <div className="col-span-1 flex justify-center">
                <Switch defaultChecked />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field Sections</CardTitle>
          <CardDescription>
            Organize fields into logical sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge>Visit</Badge>
                <span>Visit Information</span>
              </div>
              <span className="text-sm text-muted-foreground">4 fields</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Billing</Badge>
                <span>Billing Details</span>
              </div>
              <span className="text-sm text-muted-foreground">1 field</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Clinical</Badge>
                <span>Clinical Information</span>
              </div>
              <span className="text-sm text-muted-foreground">1 field</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
