// src/components/opd-settings/TemplateListDrawer.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { TemplateFormDrawer } from './TemplateFormDrawer';
import { TemplateDesigner} from './TemplateDesigner';
import { SideDrawer } from '@/components/SideDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Plus, RefreshCw, Eye, Edit, Trash2, Copy, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import type { Template, TemplatesQueryParams } from '@/types/opdTemplate.types';

type DrawerMode = 'view' | 'edit' | 'create';

interface TemplateListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number | null;
  onClose: () => void;
}

export function TemplateListDrawer({
  open,
  onOpenChange,
  groupId,
  onClose,
}: TemplateListDrawerProps) {
  const {
    useTemplates,
    useTemplateGroup,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useOPDTemplate();

  // Template Form Drawer state
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateDrawerMode, setTemplateDrawerMode] = useState<DrawerMode>('view');

  // Template Designer Drawer state
  const [designerDrawerOpen, setDesignerDrawerOpen] = useState(false);
  const [selectedTemplateForDesigner, setSelectedTemplateForDesigner] = useState<number | null>(
    null
  );

  // Query parameters state
  const [queryParams, setQueryParams] = useState<TemplatesQueryParams>({
    group: groupId || undefined,
    is_active: true,
    page: 1,
    page_size: 100,
    ordering: 'display_order',
  });

  // Update query params when groupId changes
  React.useEffect(() => {
    if (groupId) {
      setQueryParams((prev) => ({ ...prev, group: groupId }));
    }
  }, [groupId]);

  // Fetch templates
  const { data: templatesData, error, isLoading, mutate } = useTemplates(queryParams);

  // Fetch group data for title
  const { data: groupData } = useTemplateGroup(groupId);

  // Handlers for Template CRUD
  const handleCreateTemplate = useCallback(() => {
    setSelectedTemplateId(null);
    setTemplateDrawerMode('create');
    setTemplateDrawerOpen(true);
  }, []);

  const handleViewTemplate = useCallback((template: Template) => {
    setSelectedTemplateId(template.id);
    setTemplateDrawerMode('view');
    setTemplateDrawerOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: Template) => {
    setSelectedTemplateId(template.id);
    setTemplateDrawerMode('edit');
    setTemplateDrawerOpen(true);
  }, []);

  const handleDeleteTemplate = useCallback(
    async (template: Template) => {
      try {
        await deleteTemplate(template.id);
        toast.success(`Template "${template.name}" deleted successfully`);
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete template');
      }
    },
    [deleteTemplate, mutate]
  );

  const handleDuplicateTemplate = useCallback(
    async (template: Template) => {
      try {
        const duplicated = await duplicateTemplate(template.id);
        toast.success(`Template "${template.name}" duplicated successfully`);
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to duplicate template');
      }
    },
    [duplicateTemplate, mutate]
  );

  const handleToggleActive = useCallback(
    async (template: Template) => {
      try {
        await updateTemplate(template.id, { is_active: !template.is_active });
        toast.success(
          `Template "${template.name}" ${!template.is_active ? 'activated' : 'deactivated'}`
        );
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to update template');
      }
    },
    [updateTemplate, mutate]
  );

  const handleDesignTemplate = useCallback((template: Template) => {
    setSelectedTemplateForDesigner(template.id);
    setDesignerDrawerOpen(true);
  }, []);

  const handleTemplateDrawerClose = useCallback(() => {
    setTemplateDrawerOpen(false);
    setSelectedTemplateId(null);
  }, []);

  const handleTemplateDrawerSuccess = useCallback(() => {
    mutate(); // Refresh the list
    handleTemplateDrawerClose();
  }, [mutate, handleTemplateDrawerClose]);

  const handleDesignerDrawerClose = useCallback(() => {
    setDesignerDrawerOpen(false);
    setSelectedTemplateForDesigner(null);
  }, []);

  // Helper to safely format dates
  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Define columns for desktop table
  const columns: DataTableColumn<Template>[] = useMemo(
    () => [
      {
        header: 'Name',
        key: 'name',
        cell: (template) => (
          <div>
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-muted-foreground">{template.code}</div>
            {template.description && (
              <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
            )}
          </div>
        ),
      },
      {
        header: 'Order',
        key: 'display_order',
        cell: (template) => <span className="text-sm">{template.display_order}</span>,
        className: 'text-center',
      },
      {
        header: 'Status',
        key: 'is_active',
        cell: (template) => (
          <Badge variant={template.is_active ? 'default' : 'secondary'}>
            {template.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
        className: 'text-center',
      },
    ],
    [formatDate]
  );

  // Render mobile card
  const renderMobileCard = useCallback(
    (template: Template, actions: any) => (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-muted-foreground">{template.code}</div>
            {template.description && (
              <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
            )}
          </div>
          <Badge variant={template.is_active ? 'default' : 'secondary'}>
            {template.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center text-sm">
          <span className="text-muted-foreground">Order: {template.display_order}</span>
        </div>

        <div className="flex gap-2 pt-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleDesignTemplate(template)}>
            <Wrench className="h-4 w-4 mr-1" />
            Design
          </Button>
          {actions.view && (
            <Button size="sm" variant="outline" onClick={actions.view}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {actions.edit && (
            <Button size="sm" variant="outline" onClick={actions.edit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {actions.askDelete && (
            <Button size="sm" variant="outline" onClick={actions.askDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    ),
    [handleDesignTemplate, formatDate]
  );

  // Extra actions in dropdown
  const extraActions = useCallback(
    (template: Template) => (
      <>
        <DropdownMenuItem onClick={() => handleDesignTemplate(template)}>
          <Wrench className="mr-2 h-4 w-4" />
          Design Template
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggleActive(template)}>
          {template.is_active ? 'Deactivate' : 'Activate'}
        </DropdownMenuItem>
      </>
    ),
    [handleDesignTemplate, handleDuplicateTemplate, handleToggleActive]
  );

  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={groupData ? `Templates - ${groupData.name}` : 'Templates'}
        mode="view"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Templates</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => mutate()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={handleCreateTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={templatesData?.results || []}
                isLoading={isLoading}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(template) => template.id}
                getRowLabel={(template) => template.name}
                onView={handleViewTemplate}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                extraActions={extraActions}
                emptyTitle="No templates found"
                emptySubtitle="Create your first template to get started"
              />
            </CardContent>
          </Card>
        </div>
      </SideDrawer>

      {/* Template Form Drawer */}
      <TemplateFormDrawer
        open={templateDrawerOpen}
        onOpenChange={setTemplateDrawerOpen}
        mode={templateDrawerMode}
        templateId={selectedTemplateId}
        groupId={groupId}
        onSuccess={handleTemplateDrawerSuccess}
        onClose={handleTemplateDrawerClose}
      />

      {/* Template Designer Drawer */}
      <TemplateDesigner
        open={designerDrawerOpen}
        onOpenChange={setDesignerDrawerOpen}
        templateId={selectedTemplateForDesigner}
        onClose={handleDesignerDrawerClose}
      />
    </>
  );
}
