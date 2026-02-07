// src/components/consultation/TemplateSelectionDrawer.tsx
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Plus, Sparkles, Copy, BookTemplate } from 'lucide-react';
import { Template, ResponseTemplate } from '@/types/opdTemplate.types';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { toast } from 'sonner';

interface TemplateSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  isLoading: boolean;
  onSelectTemplate: (templateId: number) => void;
}

export const TemplateSelectionDrawer: React.FC<TemplateSelectionDrawerProps> = ({
  open,
  onOpenChange,
  templates,
  isLoading,
  onSelectTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'response-templates'>('templates');

  // Fetch response templates
  const { useResponseTemplates } = useOPDTemplate();
  const { data: responseTemplatesData, isLoading: isLoadingResponseTemplates } = useResponseTemplates();

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const responseTemplates = responseTemplatesData?.results || [];
  const filteredResponseTemplates = responseTemplates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTemplateIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('opd')) return '🏥';
    if (nameLower.includes('ipd') || nameLower.includes('admission')) return '🛏️';
    if (nameLower.includes('discharge')) return '📋';
    if (nameLower.includes('emergency')) return '🚑';
    if (nameLower.includes('surgery') || nameLower.includes('operation')) return '🔬';
    if (nameLower.includes('lab') || nameLower.includes('test')) return '🧪';
    return '📝';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add Clinical Notes
          </SheetTitle>
          <SheetDescription>
            Choose a template or use a saved response template
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <div className="px-4 pt-4 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="response-templates" className="gap-2">
                <BookTemplate className="h-4 w-4" />
                Saved
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Clinical Note Templates Tab */}
          <TabsContent value="templates" className="mt-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-4 space-y-2">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : filteredTemplates.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'No templates available. Please create one first.'}
                </p>
              </div>
            ) : (
              // Template Cards
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template.id);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {getTemplateIcon(template.name)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors truncate">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {template.group_name && (
                          <Badge variant="secondary" className="text-xs">
                            {template.group_name}
                          </Badge>
                        )}
                        {template.fields && template.fields.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {template.fields.length} fields
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
            </ScrollArea>
          </TabsContent>

          {/* Response Templates Tab */}
          <TabsContent value="response-templates" className="mt-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-4 space-y-2">
                {isLoadingResponseTemplates ? (
                  // Loading Skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2 p-4 border rounded-lg">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                ) : filteredResponseTemplates.length === 0 ? (
                  // Empty State
                  <div className="text-center py-12">
                    <BookTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No saved templates</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Save frequently used responses as templates for quick reuse.'}
                    </p>
                  </div>
                ) : (
                  // Response Template Cards
                  filteredResponseTemplates.map((responseTemplate) => (
                    <button
                      key={responseTemplate.id}
                      onClick={() => {
                        // TODO: Handle response template selection
                        toast.info('Response template functionality coming soon');
                        onOpenChange(false);
                      }}
                      className="w-full text-left p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          <Copy className="h-5 w-5 text-purple-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors truncate">
                            {responseTemplate.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={responseTemplate.is_public ? 'default' : 'secondary'} className="text-xs">
                              {responseTemplate.is_public ? 'Public' : 'Private'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Used {responseTemplate.usage_count} times
                            </span>
                          </div>
                        </div>

                        {/* Add Icon */}
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-purple-100 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                            <Plus className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
