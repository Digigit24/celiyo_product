// src/components/opd-settings/TemplatesTab.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { TemplateGroupFormDrawer } from './TemplateGroupFormDrawer';
import { TemplateFormDrawer } from './TemplateFormDrawer';
import { TemplateDesigner } from './TemplateDesigner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Plus, RefreshCw, Eye, Edit, Trash2, Copy, Wrench, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { authService } from '@/services/authService';
import { authClient } from '@/lib/client';
import { API_CONFIG, buildUrl } from '@/lib/apiConfig';
import type { TemplateGroup, Template, TemplatesQueryParams } from '@/types/opdTemplate.types';

type DrawerMode = 'view' | 'edit' | 'create';

export function TemplatesTab() {
  const {
    useTemplateGroups,
    useTemplates,
    createTemplateGroup,
    updateTemplateGroup,
    deleteTemplateGroup,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useOPDTemplate();

  // State for selected group
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Template Group Drawer state
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupDrawerMode, setGroupDrawerMode] = useState<DrawerMode>('view');

  // Template Drawer state
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateDrawerMode, setTemplateDrawerMode] = useState<DrawerMode>('view');

  // Template Designer Drawer state
  const [designerDrawerOpen, setDesignerDrawerOpen] = useState(false);
  const [selectedTemplateForDesigner, setSelectedTemplateForDesigner] = useState<number | null>(
    null
  );

  // Default template state
  const [defaultTemplateId, setDefaultTemplateId] = useState<number | null>(null);
  const [isSavingDefault, setIsSavingDefault] = useState(false);

  // Load default template from user preferences on mount
  useEffect(() => {
    const preferences = authService.getUserPreferences();
    if (preferences?.defaultOPDTemplate) {
      setDefaultTemplateId(preferences.defaultOPDTemplate);
    }
  }, []);

  // Fetch template groups
  const {
    data: groupsData,
    error: groupsError,
    isLoading: groupsLoading,
    mutate: mutateGroups,
  } = useTemplateGroups({
    show_inactive: false,
    ordering: 'display_order',
  });

  // Fetch templates for selected group
  const [templatesQueryParams, setTemplatesQueryParams] = useState<TemplatesQueryParams>({
    group: selectedGroupId || undefined,
    is_active: true,
    page: 1,
    page_size: 100,
    ordering: 'display_order',
  });

  const {
    data: templatesData,
    error: templatesError,
    isLoading: templatesLoading,
    mutate: mutateTemplates,
  } = useTemplates(templatesQueryParams);

  React.useEffect(() => {
    if (selectedGroupId) {
      setIsLoadingTemplates(true);
      setTemplatesQueryParams((prev) => ({ ...prev, group: selectedGroupId }));
    }
  }, [selectedGroupId]);

  // Clear loading state when templates data is ready
  React.useEffect(() => {
    if (!templatesLoading && selectedGroupId) {
      setIsLoadingTemplates(false);
    }
  }, [templatesLoading, selectedGroupId]);

  // Template Group handlers
  const handleCreateGroup = useCallback(() => {
    setSelectedGroup(null);
    setGroupDrawerMode('create');
    setGroupDrawerOpen(true);
  }, []);

  const handleViewGroup = useCallback((group: TemplateGroup) => {
    setSelectedGroup(group.id);
    setGroupDrawerMode('view');
    setGroupDrawerOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: TemplateGroup) => {
    setSelectedGroup(group.id);
    setGroupDrawerMode('edit');
    setGroupDrawerOpen(true);
  }, []);

  const handleDeleteGroup = useCallback(
    async (group: TemplateGroup) => {
      if (!confirm(`Are you sure you want to delete "${group.name}"?`)) {
        return;
      }

      try {
        await deleteTemplateGroup(group.id);
        toast.success(`Template group "${group.name}" deleted successfully`);
        mutateGroups();
        if (selectedGroupId === group.id) {
          setSelectedGroupId(null);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete template group');
      }
    },
    [deleteTemplateGroup, mutateGroups, selectedGroupId]
  );

  const handleToggleGroupActive = useCallback(
    async (group: TemplateGroup) => {
      try {
        await updateTemplateGroup(group.id, { is_active: !group.is_active });
        toast.success(
          `Template group "${group.name}" ${!group.is_active ? 'activated' : 'deactivated'}`
        );
        mutateGroups();
      } catch (error: any) {
        toast.error(error.message || 'Failed to update template group');
      }
    },
    [updateTemplateGroup, mutateGroups]
  );

  const handleGroupDrawerClose = useCallback(() => {
    setGroupDrawerOpen(false);
    setSelectedGroup(null);
  }, []);

  const handleGroupDrawerSuccess = useCallback(() => {
    mutateGroups();
    handleGroupDrawerClose();
  }, [mutateGroups, handleGroupDrawerClose]);

  // Template handlers
  const handleCreateTemplate = useCallback(() => {
    if (!selectedGroupId) {
      toast.error('Please select a template group first');
      return;
    }
    setSelectedTemplateId(null);
    setTemplateDrawerMode('create');
    setTemplateDrawerOpen(true);
  }, [selectedGroupId]);

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
      if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
        return;
      }

      try {
        await deleteTemplate(template.id);
        toast.success(`Template "${template.name}" deleted successfully`);
        mutateTemplates();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete template');
      }
    },
    [deleteTemplate, mutateTemplates]
  );

  const handleDuplicateTemplate = useCallback(
    async (template: Template) => {
      try {
        await duplicateTemplate(template.id);
        toast.success(`Template "${template.name}" duplicated successfully`);
        mutateTemplates();
      } catch (error: any) {
        toast.error(error.message || 'Failed to duplicate template');
      }
    },
    [duplicateTemplate, mutateTemplates]
  );

  const handleToggleTemplateActive = useCallback(
    async (template: Template) => {
      try {
        await updateTemplate(template.id, { is_active: !template.is_active });
        toast.success(
          `Template "${template.name}" ${!template.is_active ? 'activated' : 'deactivated'}`
        );
        mutateTemplates();
      } catch (error: any) {
        toast.error(error.message || 'Failed to update template');
      }
    },
    [updateTemplate, mutateTemplates]
  );

  const handleDesignTemplate = useCallback((template: Template) => {
    setSelectedTemplateForDesigner(template.id);
    setDesignerDrawerOpen(true);
  }, []);

  const handleSetDefaultTemplate = useCallback(
    async (template: Template) => {
      setIsSavingDefault(true);
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          toast.error('User not found');
          return;
        }

        // Update preferences on backend
        const url = buildUrl(API_CONFIG.AUTH.USERS.UPDATE, { id: user.id }, 'auth');
        const updatedPreferences = {
          ...authService.getUserPreferences(),
          defaultOPDTemplate: template.id,
        };

        await authClient.patch(url, { preferences: updatedPreferences });

        // Update local storage
        authService.updateUserPreferences(updatedPreferences);

        // Update local state
        setDefaultTemplateId(template.id);

        toast.success(`"${template.name}" set as default template`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to set default template');
      } finally {
        setIsSavingDefault(false);
      }
    },
    []
  );

  const handleTemplateDrawerClose = useCallback(() => {
    setTemplateDrawerOpen(false);
    setSelectedTemplateId(null);
  }, []);

  const handleTemplateDrawerSuccess = useCallback(() => {
    mutateTemplates();
    handleTemplateDrawerClose();
  }, [mutateTemplates, handleTemplateDrawerClose]);

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

  // Template group columns
  const groupColumns: DataTableColumn<TemplateGroup>[] = useMemo(
    () => [
      {
        header: 'Name',
        key: 'name',
        cell: (group) => (
          <div>
            <div className="font-medium">{group.name}</div>
            {group.description && (
              <div className="text-sm text-muted-foreground mt-1">{group.description}</div>
            )}
          </div>
        ),
      },
      {
        header: 'Order',
        key: 'display_order',
        cell: (group) => <span className="text-sm">{group.display_order}</span>,
        className: 'text-center w-20',
      },
      {
        header: 'Status',
        key: 'is_active',
        cell: (group) => (
          <Badge variant={group.is_active ? 'default' : 'secondary'}>
            {group.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
        className: 'text-center w-24',
      },
    ],
    []
  );

  // Template columns
  const templateColumns: DataTableColumn<Template>[] = useMemo(
    () => [
      {
        header: 'Name',
        key: 'name',
        cell: (template) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{template.name}</span>
              {defaultTemplateId === template.id && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Default
                </Badge>
              )}
            </div>
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
        className: 'text-center w-20',
      },
      {
        header: 'Status',
        key: 'is_active',
        cell: (template) => (
          <Badge variant={template.is_active ? 'default' : 'secondary'}>
            {template.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
        className: 'text-center w-24',
      },
    ],
    [defaultTemplateId]
  );

  // Render mobile card for groups
  const renderGroupMobileCard = useCallback(
    (group: TemplateGroup, actions: any) => (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{group.name}</div>
            {group.description && (
              <div className="text-sm text-muted-foreground mt-1">{group.description}</div>
            )}
          </div>
          <Badge variant={group.is_active ? 'default' : 'secondary'}>
            {group.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center text-sm">
          <span className="text-muted-foreground">Order: {group.display_order}</span>
        </div>

        <div className="flex gap-2 pt-2 flex-wrap">
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
    []
  );

  // Render mobile card for templates
  const renderTemplateMobileCard = useCallback(
    (template: Template, actions: any) => (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{template.name}</span>
              {defaultTemplateId === template.id && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Default
                </Badge>
              )}
            </div>
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
          {defaultTemplateId !== template.id && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSetDefaultTemplate(template)}
              disabled={isSavingDefault}
            >
              <Star className="h-4 w-4 mr-1" />
              Set as Default
            </Button>
          )}
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
    [handleDesignTemplate, handleSetDefaultTemplate, defaultTemplateId, isSavingDefault]
  );

  // Extra actions for groups
  const groupExtraActions = useCallback(
    (group: TemplateGroup) => (
      <>
        <DropdownMenuItem onClick={() => handleToggleGroupActive(group)}>
          {group.is_active ? 'Deactivate' : 'Activate'}
        </DropdownMenuItem>
      </>
    ),
    [handleToggleGroupActive]
  );

  // Extra actions for templates
  const templateExtraActions = useCallback(
    (template: Template) => (
      <>
        {defaultTemplateId !== template.id && (
          <DropdownMenuItem
            onClick={() => handleSetDefaultTemplate(template)}
            disabled={isSavingDefault}
          >
            <Star className="mr-2 h-4 w-4" />
            Set as Default
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleDesignTemplate(template)}>
          <Wrench className="mr-2 h-4 w-4" />
          Design Template
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggleTemplateActive(template)}>
          {template.is_active ? 'Deactivate' : 'Activate'}
        </DropdownMenuItem>
      </>
    ),
    [
      handleDesignTemplate,
      handleDuplicateTemplate,
      handleToggleTemplateActive,
      handleSetDefaultTemplate,
      defaultTemplateId,
      isSavingDefault,
    ]
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Groups Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Template Groups</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => mutateGroups()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm" onClick={handleCreateGroup}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={groupsData?.results || []}
              isLoading={groupsLoading}
              columns={groupColumns}
              renderMobileCard={renderGroupMobileCard}
              getRowId={(group) => group.id}
              getRowLabel={(group) => group.name}
              onRowClick={(group) => setSelectedGroupId(group.id)}
              selectedRowId={selectedGroupId}
              onView={handleViewGroup}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              extraActions={groupExtraActions}
              emptyTitle="No template groups found"
              emptySubtitle="Create your first template group to get started"
            />
          </CardContent>
        </Card>

        {/* Templates Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedGroupId
                  ? `Templates - ${groupsData?.results?.find((g) => g.id === selectedGroupId)?.name || 'Group'}`
                  : 'Templates'}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => mutateTemplates()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateTemplate}
                  disabled={!selectedGroupId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedGroupId ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No group selected</p>
                <p className="text-sm mt-1">Select a template group to view its templates</p>
              </div>
            ) : (
              <DataTable
                rows={isLoadingTemplates ? [] : (templatesData?.results || [])}
                isLoading={isLoadingTemplates || templatesLoading}
                columns={templateColumns}
                renderMobileCard={renderTemplateMobileCard}
                getRowId={(template) => template.id}
                getRowLabel={(template) => template.name}
                onView={handleViewTemplate}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                extraActions={templateExtraActions}
                emptyTitle="No templates found"
                emptySubtitle="Create your first template to get started"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Template Group Form Drawer */}
      <TemplateGroupFormDrawer
        open={groupDrawerOpen}
        onOpenChange={setGroupDrawerOpen}
        mode={groupDrawerMode}
        groupId={selectedGroup}
        onSuccess={handleGroupDrawerSuccess}
        onClose={handleGroupDrawerClose}
      />

      {/* Template Form Drawer */}
      <TemplateFormDrawer
        open={templateDrawerOpen}
        onOpenChange={setTemplateDrawerOpen}
        mode={templateDrawerMode}
        templateId={selectedTemplateId}
        groupId={selectedGroupId}
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
