// src/pages/WorkflowEditor.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Save,
  Play,
  Settings,
  Zap,
  Target,
  ArrowRight,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  TriggerTypeEnum,
  ActionTypeEnum,
  TransformationTypeEnum,
  LEAD_FIELD_OPTIONS,
} from '@/types/integration.types';

export const WorkflowEditor = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!workflowId;

  const {
    useWorkflow,
    useConnectionsList,
    createWorkflow,
    updateWorkflow,
    testWorkflow,
    useWorkflowTriggers,
    useWorkflowActions,
    useWorkflowMappings,
    createWorkflowTrigger,
    createWorkflowAction,
    createWorkflowMapping,
    deleteWorkflowTrigger,
    deleteWorkflowAction,
    deleteWorkflowMapping,
    getSpreadsheets,
    getSheets,
  } = useIntegrations();

  // Fetch workflow data if editing
  const { data: workflow, isLoading: workflowLoading } = useWorkflow(
    workflowId ? parseInt(workflowId) : undefined
  );
  const { data: connectionsData } = useConnectionsList({ is_active: true });
  const { data: triggers, mutate: mutateTriggers } = useWorkflowTriggers(
    workflowId ? parseInt(workflowId) : undefined
  );
  const { data: actions, mutate: mutateActions } = useWorkflowActions(
    workflowId ? parseInt(workflowId) : undefined
  );
  const { data: mappings, mutate: mutateMappings } = useWorkflowMappings(
    workflowId ? parseInt(workflowId) : undefined
  );

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'trigger' | 'action' | 'mapping'>('basic');

  // Trigger state
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [triggerType, setTriggerType] = useState<TriggerTypeEnum>('NEW_ROW');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);

  // Action state
  const [actionType, setActionType] = useState<ActionTypeEnum>('CREATE_LEAD');

  // Mapping state
  const [newMapping, setNewMapping] = useState({
    source_field: '',
    destination_field: '',
    transformation_type: 'TEXT' as TransformationTypeEnum,
    is_required: false,
  });

  // Load workflow data when editing
  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setIsActive(workflow.is_active);
    }
  }, [workflow]);

  // Load spreadsheets when connection is selected
  useEffect(() => {
    if (selectedConnection) {
      loadSpreadsheets(selectedConnection);
    }
  }, [selectedConnection]);

  // Load sheets when spreadsheet is selected
  useEffect(() => {
    if (selectedConnection && spreadsheetId) {
      loadSheets(selectedConnection, spreadsheetId);
    }
  }, [selectedConnection, spreadsheetId]);

  const loadSpreadsheets = async (connectionId: number) => {
    try {
      const result = await getSpreadsheets(connectionId);
      setSpreadsheets(result.spreadsheets);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load spreadsheets');
    }
  };

  const loadSheets = async (connectionId: number, spreadsheetId: string) => {
    try {
      const result = await getSheets(connectionId, spreadsheetId);
      setSheets(result.sheets);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load sheets');
    }
  };

  const handleSaveBasic = async () => {
    if (!name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    if (!selectedConnection && !isEditMode) {
      toast.error('Please select a connection');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && workflowId) {
        await updateWorkflow(parseInt(workflowId), { name, description, is_active: isActive });
        toast.success('Workflow updated successfully');
      } else {
        const newWorkflow = await createWorkflow({
          name,
          description,
          is_active: isActive,
          connection_id: selectedConnection!
        });
        toast.success('Workflow created successfully');
        navigate(`/integrations/workflows/${newWorkflow.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTrigger = async () => {
    if (!workflowId) {
      toast.error('Please save the workflow first');
      return;
    }

    if (!selectedConnection) {
      toast.error('Please select a connection');
      return;
    }

    setIsSaving(true);
    try {
      await createWorkflowTrigger(parseInt(workflowId), {
        connection: selectedConnection,
        trigger_type: triggerType,
        config: {
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
        },
        is_active: true,
      });
      toast.success('Trigger added successfully');
      mutateTriggers();
      setActiveTab('action');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save trigger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAction = async () => {
    if (!workflowId) {
      toast.error('Please save the workflow first');
      return;
    }

    setIsSaving(true);
    try {
      await createWorkflowAction(parseInt(workflowId), {
        action_type: actionType,
        config: {},
        order_index: (actions?.length || 0) + 1,
        is_active: true,
      });
      toast.success('Action added successfully');
      mutateActions();
      setActiveTab('mapping');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save action');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!workflowId) {
      toast.error('Please save the workflow first');
      return;
    }

    if (!newMapping.source_field || !newMapping.destination_field) {
      toast.error('Please select both source and destination fields');
      return;
    }

    setIsSaving(true);
    try {
      await createWorkflowMapping(parseInt(workflowId), newMapping);
      toast.success('Field mapping added successfully');
      mutateMappings();
      setNewMapping({
        source_field: '',
        destination_field: '',
        transformation_type: 'TEXT',
        is_required: false,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save mapping');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWorkflow = async () => {
    if (!workflowId) {
      toast.error('Please save the workflow first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testWorkflow(parseInt(workflowId));
      if (result.success) {
        toast.success('Workflow test successful!');
      } else {
        toast.error(result.message || 'Workflow test failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test workflow');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteTrigger = async (triggerId: number) => {
    if (!workflowId) return;
    try {
      await deleteWorkflowTrigger(parseInt(workflowId), triggerId);
      toast.success('Trigger deleted');
      mutateTriggers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete trigger');
    }
  };

  const handleDeleteAction = async (actionId: number) => {
    if (!workflowId) return;
    try {
      await deleteWorkflowAction(parseInt(workflowId), actionId);
      toast.success('Action deleted');
      mutateActions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete action');
    }
  };

  const handleDeleteMapping = async (mappingId: number) => {
    if (!workflowId) return;
    try {
      await deleteWorkflowMapping(parseInt(workflowId), mappingId);
      toast.success('Mapping deleted');
      mutateMappings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete mapping');
    }
  };

  if (workflowLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/integrations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? 'Edit Workflow' : 'New Workflow'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure your automation workflow step by step
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button variant="outline" onClick={handleTestWorkflow} disabled={isTesting}>
              <Play className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Workflow'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">
            <Settings className="h-4 w-4 mr-2" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="trigger" disabled={!isEditMode}>
            <Zap className="h-4 w-4 mr-2" />
            Trigger
          </TabsTrigger>
          <TabsTrigger value="action" disabled={!isEditMode}>
            <Target className="h-4 w-4 mr-2" />
            Action
          </TabsTrigger>
          <TabsTrigger value="mapping" disabled={!isEditMode}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Field Mapping
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
              <CardDescription>Configure the basic settings for your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Google Sheets to CRM Leads"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  rows={3}
                />
              </div>

              {!isEditMode && (
                <div className="space-y-2">
                  <Label>Select Connection *</Label>
                  <Select
                    value={selectedConnection?.toString() || ''}
                    onValueChange={(value) => setSelectedConnection(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a connected app" />
                    </SelectTrigger>
                    <SelectContent>
                      {(connectionsData?.results || []).map((connection) => (
                        <SelectItem key={connection.id} value={connection.id.toString()}>
                          {connection.name} ({connection.integration_details?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this workflow
                  </p>
                </div>
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveBasic} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Create Workflow'}
                </Button>
                {isEditMode && (
                  <Button variant="outline" onClick={() => setActiveTab('trigger')}>
                    Next: Configure Trigger
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trigger Tab */}
        <TabsContent value="trigger">
          <Card>
            <CardHeader>
              <CardTitle>When this happens...</CardTitle>
              <CardDescription>Configure what triggers this workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Triggers */}
              {triggers && triggers.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label>Existing Triggers</Label>
                  {(triggers || []).map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{trigger.trigger_type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {trigger.connection_details?.name}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTrigger(trigger.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Trigger */}
              <div className="space-y-2">
                <Label>Select Connection</Label>
                <Select
                  value={selectedConnection?.toString() || ''}
                  onValueChange={(value) => setSelectedConnection(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a connected app" />
                  </SelectTrigger>
                  <SelectContent>
                    {(connectionsData?.results || []).map((connection) => (
                      <SelectItem key={connection.id} value={connection.id.toString()}>
                        {connection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedConnection && (
                <>
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerTypeEnum)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW_ROW">New Row Added</SelectItem>
                        <SelectItem value="UPDATED_ROW">Row Updated</SelectItem>
                        <SelectItem value="SCHEDULE">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Spreadsheet</Label>
                    <Select value={spreadsheetId} onValueChange={setSpreadsheetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a spreadsheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {(spreadsheets || []).map((spreadsheet) => (
                          <SelectItem key={spreadsheet.id} value={spreadsheet.id}>
                            {spreadsheet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {spreadsheetId && (
                    <div className="space-y-2">
                      <Label>Select Sheet</Label>
                      <Select value={sheetName} onValueChange={setSheetName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a sheet" />
                        </SelectTrigger>
                        <SelectContent>
                          {(sheets || []).map((sheet) => (
                            <SelectItem key={sheet.id} value={sheet.name}>
                              {sheet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveTrigger} disabled={isSaving || !selectedConnection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trigger
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('action')}>
                  Next: Configure Action
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Tab */}
        <TabsContent value="action">
          <Card>
            <CardHeader>
              <CardTitle>Do this...</CardTitle>
              <CardDescription>Configure what action to perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Actions */}
              {actions && actions.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label>Existing Actions</Label>
                  {(actions || []).map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{action.action_type.replace('_', ' ')}</p>
                        <Badge variant="outline">Order: {action.order_index}</Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAction(action.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Action */}
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select value={actionType} onValueChange={(value) => setActionType(value as ActionTypeEnum)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATE_LEAD">Create Lead in CRM</SelectItem>
                    <SelectItem value="UPDATE_LEAD">Update Lead in CRM</SelectItem>
                    <SelectItem value="CREATE_CONTACT">Create Contact</SelectItem>
                    <SelectItem value="SEND_EMAIL">Send Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveAction} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('mapping')}>
                  Next: Configure Field Mapping
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mapping Tab */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Map Fields</CardTitle>
              <CardDescription>Map source fields to destination fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Mappings */}
              {mappings && mappings.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label>Existing Mappings</Label>
                  <div className="space-y-2">
                    {(mappings || []).map((mapping) => (
                      <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{mapping.source_field}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{mapping.destination_field}</span>
                          {mapping.is_required && <Badge variant="destructive">Required</Badge>}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Mapping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Field (Google Sheets Column)</Label>
                  <Input
                    value={newMapping.source_field}
                    onChange={(e) =>
                      setNewMapping({ ...newMapping, source_field: e.target.value })
                    }
                    placeholder="e.g., Name, Email, Phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destination Field (CRM Field)</Label>
                  <Select
                    value={newMapping.destination_field}
                    onValueChange={(value) =>
                      setNewMapping({ ...newMapping, destination_field: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose CRM field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="address_line1">Address Line 1</SelectItem>
                      <SelectItem value="city">City</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={newMapping.is_required}
                    onCheckedChange={(checked) =>
                      setNewMapping({ ...newMapping, is_required: checked })
                    }
                  />
                  <Label htmlFor="required">Required field</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveMapping} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field Mapping
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowEditor;
