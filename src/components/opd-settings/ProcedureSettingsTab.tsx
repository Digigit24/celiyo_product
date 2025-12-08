// src/components/opd-settings/ProcedureSettingsTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, RefreshCw, Plus } from 'lucide-react';

export const ProcedureSettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Procedure Configuration</CardTitle>
          <CardDescription>
            Configure settings for OPD procedures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="procedure-code-prefix">Procedure Code Prefix</Label>
              <Input
                id="procedure-code-prefix"
                placeholder="e.g., PROC-"
                defaultValue="PROC-"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="default-duration">Default Procedure Duration (minutes)</Label>
              <Input
                id="default-duration"
                type="number"
                placeholder="15"
                defaultValue="15"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-consent">Require Consent Form</Label>
                <p className="text-sm text-muted-foreground">
                  Require patient consent before procedures
                </p>
              </div>
              <Switch id="require-consent" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-billing">Auto-generate Procedure Bill</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create bill after procedure completion
                </p>
              </div>
              <Switch id="auto-billing" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="track-inventory">Track Inventory for Procedures</Label>
                <p className="text-sm text-muted-foreground">
                  Monitor and deduct inventory items used in procedures
                </p>
              </div>
              <Switch id="track-inventory" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-packages">Enable Procedure Packages</Label>
                <p className="text-sm text-muted-foreground">
                  Allow bundling multiple procedures into packages
                </p>
              </div>
              <Switch id="enable-packages" defaultChecked />
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
          <CardTitle>Procedure Categories</CardTitle>
          <CardDescription>
            Manage procedure categories for organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Diagnostic Procedures</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Therapeutic Procedures</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Minor Surgery</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Laboratory Tests</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Category
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent Form Template</CardTitle>
          <CardDescription>
            Default consent form content for procedures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter default consent form content..."
            className="min-h-[200px]"
            defaultValue="I hereby give consent for the procedure(s) as explained to me by the medical practitioner. I understand the nature and purpose of the procedure, potential risks, and alternative treatments."
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
