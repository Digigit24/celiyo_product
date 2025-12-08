// src/components/opd-settings/GeneralSettingsTab.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

export const GeneralSettingsTab: React.FC = () => {
  // Basic Information
  const [hospitalName, setHospitalName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Header Configuration
  const [headerLayout, setHeaderLayout] = useState<'split' | 'centered'>('split');
  const [headerBgColor, setHeaderBgColor] = useState('#3b82f6');
  const [headerGradientStart, setHeaderGradientStart] = useState('#3b82f6');
  const [headerGradientEnd, setHeaderGradientEnd] = useState('#8b5cf6');
  const [headerUseGradient, setHeaderUseGradient] = useState(false);
  const [headerTextColor, setHeaderTextColor] = useState('#ffffff');

  // Footer Configuration
  const [footerAlignment, setFooterAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [useSeparateFooterColor, setUseSeparateFooterColor] = useState(false);
  const [footerBgColor, setFooterBgColor] = useState('#3b82f6');
  const [footerGradientStart, setFooterGradientStart] = useState('#3b82f6');
  const [footerGradientEnd, setFooterGradientEnd] = useState('#8b5cf6');
  const [footerUseGradient, setFooterUseGradient] = useState(false);
  const [footerTextColor, setFooterTextColor] = useState('#ffffff');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log({
      hospitalName,
      logo,
      address,
      contactEmail,
      contactNumber,
      websiteUrl,
      header: {
        layout: headerLayout,
        backgroundColor: headerUseGradient
          ? `linear-gradient(to right, ${headerGradientStart}, ${headerGradientEnd})`
          : headerBgColor,
        textColor: headerTextColor,
      },
      footer: {
        alignment: footerAlignment,
        backgroundColor: useSeparateFooterColor
          ? footerUseGradient
            ? `linear-gradient(to right, ${footerGradientStart}, ${footerGradientEnd})`
            : footerBgColor
          : headerUseGradient
            ? `linear-gradient(to right, ${headerGradientStart}, ${headerGradientEnd})`
            : headerBgColor,
        textColor: useSeparateFooterColor ? footerTextColor : headerTextColor,
      },
    });
    toast.success('Hospital settings saved successfully');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Hospital Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hospitalName">Hospital Name</Label>
              <Input
                id="hospitalName"
                placeholder="Enter hospital name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-start gap-3">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer flex-1"
                />
                {logoPreview && (
                  <div className="w-12 h-12 border rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter hospital address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@hospital.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Phone</Label>
              <Input
                id="contactNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://hospital.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Header Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Layout Selection - Visual */}
          <div className="space-y-3">
            <Label>Layout Style</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Split Layout */}
              <div
                onClick={() => setHeaderLayout('split')}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  headerLayout === 'split'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {headerLayout === 'split' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Split Layout</div>
                  <div className="border rounded p-3 bg-background">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-2 w-16 bg-muted rounded" />
                        <div className="h-2 w-16 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Logo & Name on left, Email & Website on right
                  </p>
                </div>
              </div>

              {/* Centered Layout */}
              <div
                onClick={() => setHeaderLayout('centered')}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  headerLayout === 'centered'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {headerLayout === 'centered' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Centered Layout</div>
                  <div className="border rounded p-3 bg-background">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-6 h-6 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-2 w-20 bg-muted rounded" />
                      <div className="h-2 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All content centered vertically
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Header Colors - Simplified */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Background</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="headerUseGradient"
                  checked={headerUseGradient}
                  onChange={(e) => setHeaderUseGradient(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="headerUseGradient" className="font-normal text-sm cursor-pointer">
                  Gradient
                </Label>
              </div>

              {headerUseGradient ? (
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={headerGradientStart}
                    onChange={(e) => setHeaderGradientStart(e.target.value)}
                    className="w-16 h-10 cursor-pointer p-1"
                  />
                  <Input
                    type="color"
                    value={headerGradientEnd}
                    onChange={(e) => setHeaderGradientEnd(e.target.value)}
                    className="w-16 h-10 cursor-pointer p-1"
                  />
                  <div
                    className="flex-1 h-10 rounded border"
                    style={{
                      background: `linear-gradient(to right, ${headerGradientStart}, ${headerGradientEnd})`,
                    }}
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={headerBgColor}
                    onChange={(e) => setHeaderBgColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer p-1"
                  />
                  <Input
                    type="text"
                    value={headerBgColor}
                    onChange={(e) => setHeaderBgColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Text Color</Label>
              <div className="flex gap-2 mt-8">
                <Input
                  type="color"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Footer Alignment - Visual */}
          <div className="space-y-3">
            <Label>Content Alignment</Label>
            <div className="grid grid-cols-3 gap-3">
              {/* Left */}
              <div
                onClick={() => setFooterAlignment('left')}
                className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  footerAlignment === 'left'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {footerAlignment === 'left' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="border rounded p-2 bg-background">
                    <div className="h-2 w-16 bg-muted rounded" />
                    <div className="h-2 w-12 bg-muted rounded mt-1" />
                  </div>
                  <p className="text-xs text-center">Left</p>
                </div>
              </div>

              {/* Center */}
              <div
                onClick={() => setFooterAlignment('center')}
                className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  footerAlignment === 'center'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {footerAlignment === 'center' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="border rounded p-2 bg-background flex flex-col items-center">
                    <div className="h-2 w-16 bg-muted rounded" />
                    <div className="h-2 w-12 bg-muted rounded mt-1" />
                  </div>
                  <p className="text-xs text-center">Center</p>
                </div>
              </div>

              {/* Right */}
              <div
                onClick={() => setFooterAlignment('right')}
                className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  footerAlignment === 'right'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {footerAlignment === 'right' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="border rounded p-2 bg-background flex flex-col items-end">
                    <div className="h-2 w-16 bg-muted rounded" />
                    <div className="h-2 w-12 bg-muted rounded mt-1" />
                  </div>
                  <p className="text-xs text-center">Right</p>
                </div>
              </div>
            </div>
          </div>

          {/* Separate Footer Colors */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="useSeparateFooterColor"
              checked={useSeparateFooterColor}
              onChange={(e) => setUseSeparateFooterColor(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="useSeparateFooterColor" className="font-normal cursor-pointer">
              Use different colors for footer
            </Label>
          </div>

          {useSeparateFooterColor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <Label>Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="footerUseGradient"
                    checked={footerUseGradient}
                    onChange={(e) => setFooterUseGradient(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <Label htmlFor="footerUseGradient" className="font-normal text-sm cursor-pointer">
                    Gradient
                  </Label>
                </div>

                {footerUseGradient ? (
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={footerGradientStart}
                      onChange={(e) => setFooterGradientStart(e.target.value)}
                      className="w-16 h-10 cursor-pointer p-1"
                    />
                    <Input
                      type="color"
                      value={footerGradientEnd}
                      onChange={(e) => setFooterGradientEnd(e.target.value)}
                      className="w-16 h-10 cursor-pointer p-1"
                    />
                    <div
                      className="flex-1 h-10 rounded border"
                      style={{
                        background: `linear-gradient(to right, ${footerGradientStart}, ${footerGradientEnd})`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={footerBgColor}
                      onChange={(e) => setFooterBgColor(e.target.value)}
                      className="w-16 h-10 cursor-pointer p-1"
                    />
                    <Input
                      type="text"
                      value={footerBgColor}
                      onChange={(e) => setFooterBgColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Text Color</Label>
                <div className="flex gap-2 mt-8">
                  <Input
                    type="color"
                    value={footerTextColor}
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer p-1"
                  />
                  <Input
                    type="text"
                    value={footerTextColor}
                    onChange={(e) => setFooterTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {!useSeparateFooterColor && (
            <p className="text-sm text-muted-foreground">
              Footer will use the same colors as header
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-4 z-10">
        <Button onClick={handleSave} size="lg" className="shadow-lg">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};
