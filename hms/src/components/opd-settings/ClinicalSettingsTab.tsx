// src/components/opd-settings/ClinicalSettingsTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, RefreshCw, Plus } from 'lucide-react';

export const ClinicalSettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clinical Notes Configuration</CardTitle>
          <CardDescription>
            Configure settings for clinical documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-soap">Enable SOAP Notes Format</Label>
                <p className="text-sm text-muted-foreground">
                  Use Subjective, Objective, Assessment, Plan format
                </p>
              </div>
              <Switch id="enable-soap" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-diagnosis">Require Diagnosis</Label>
                <p className="text-sm text-muted-foreground">
                  Make diagnosis mandatory for visit completion
                </p>
              </div>
              <Switch id="require-diagnosis" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-templates">Enable Clinical Templates</Label>
                <p className="text-sm text-muted-foreground">
                  Allow doctors to use pre-defined templates
                </p>
              </div>
              <Switch id="enable-templates" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-voice">Enable Voice Notes</Label>
                <p className="text-sm text-muted-foreground">
                  Allow recording voice notes during consultation
                </p>
              </div>
              <Switch id="enable-voice" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Auto-save Clinical Notes</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save notes every few minutes
                </p>
              </div>
              <Switch id="auto-save" defaultChecked />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="auto-save-interval">Auto-save Interval (seconds)</Label>
              <Input
                id="auto-save-interval"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
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
          <CardTitle>Vital Signs Configuration</CardTitle>
          <CardDescription>
            Configure which vital signs to track
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-bp">Blood Pressure</Label>
              <Switch id="vital-bp" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-pulse">Pulse Rate</Label>
              <Switch id="vital-pulse" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-temp">Temperature</Label>
              <Switch id="vital-temp" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-resp">Respiratory Rate</Label>
              <Switch id="vital-resp" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-spo2">SpO2 (Oxygen Saturation)</Label>
              <Switch id="vital-spo2" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-weight">Weight</Label>
              <Switch id="vital-weight" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-height">Height</Label>
              <Switch id="vital-height" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vital-bmi">BMI (Auto-calculated)</Label>
              <Switch id="vital-bmi" />
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
          <CardTitle>Clinical Templates</CardTitle>
          <CardDescription>
            Manage pre-defined clinical note templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">General Consultation</p>
                <p className="text-sm text-muted-foreground">Standard consultation template</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Follow-up Visit</p>
                <p className="text-sm text-muted-foreground">Template for follow-up consultations</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Emergency Visit</p>
                <p className="text-sm text-muted-foreground">Quick assessment template</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
