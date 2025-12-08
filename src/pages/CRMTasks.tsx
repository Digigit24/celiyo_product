// src/pages/CRMTasks.tsx
import { useState, useCallback } from 'react';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import type {
  Task,
  TasksQueryParams,
  TaskStatusEnum,
  PriorityEnum,
} from '@/types/crmTypes';
import TasksFormDrawer from '@/components/TasksFormDrawer';

export const CRMTasks: React.FC = () => {
  const { user } = useAuth();
  const { hasCRMAccess, useTasks, deleteTask } = useCRM();

  // Query parameters state
  const [queryParams, setQueryParams] = useState<TasksQueryParams>({
    page: 1,
    page_size: 20,
    ordering: '-created_at',
  });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  // Fetch tasks
  const { data: tasksData, error, isLoading, mutate } = useTasks(queryParams);

  const tasks = tasksData?.results || [];

  // Check access
  if (!hasCRMAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">CRM Access Required</h2>
              <p className="text-gray-600">
                CRM module is not enabled for your account. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handlers
  const handleView = (task: Task) => {
    setSelectedTaskId(task.id);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTaskId(task.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedTaskId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id);
      mutate();
    } catch (error: any) {
      console.error('Delete failed:', error);
    }
  };

  const handleDrawerSuccess = () => {
    mutate();
  };

  const handleDrawerDelete = () => {
    mutate();
  };

  // Get status badge variant
  const getStatusBadge = (status: TaskStatusEnum) => {
    const statusConfig = {
      TODO: { label: 'To Do', variant: 'secondary' as const },
      IN_PROGRESS: { label: 'In Progress', variant: 'default' as const },
      DONE: { label: 'Done', variant: 'success' as const },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' as const },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: PriorityEnum) => {
    const priorityConfig = {
      LOW: { label: 'Low', variant: 'secondary' as const },
      MEDIUM: { label: 'Medium', variant: 'default' as const },
      HIGH: { label: 'High', variant: 'destructive' as const },
    };
    const config = priorityConfig[priority] || { label: priority, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Define table columns
  const columns: DataTableColumn<Task>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (task) => (
        <div className="font-medium">{task.title}</div>
      ),
    },
    {
      key: 'lead_name',
      header: 'Lead',
      cell: (task) => (
        <div className="text-sm">
          {task.lead_name || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (task) => getStatusBadge(task.status),
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (task) => getPriorityBadge(task.priority),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      cell: (task) => (
        <div className="text-sm">
          {task.due_date ? (
            <>
              <div>{format(new Date(task.due_date), 'MMM dd, yyyy')}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
              </div>
            </>
          ) : (
            '-'
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (task) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </div>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (task: Task, actions: any) => {
    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{task.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{task.lead_name || 'No lead'}</p>
          </div>
          <div className="flex gap-1">
            {getStatusBadge(task.status)}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </div>
        )}

        {/* Info Row */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Priority</p>
            <div className="font-medium">{getPriorityBadge(task.priority)}</div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Due Date</p>
            <p className="font-medium">
              {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'Not set'}
            </p>
          </div>
        </div>

        {/* Created */}
        <div className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {actions.view && (
            <Button size="sm" variant="outline" onClick={actions.view} className="flex-1">
              View
            </Button>
          )}
          {actions.edit && (
            <Button size="sm" variant="outline" onClick={actions.edit} className="flex-1">
              Edit
            </Button>
          )}
          {actions.askDelete && (
            <Button size="sm" variant="destructive" onClick={actions.askDelete}>
              Delete
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Tasks</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <p>Failed to load tasks</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            rows={tasks}
            isLoading={isLoading}
            columns={columns}
            renderMobileCard={renderMobileCard}
            getRowId={(task) => task.id}
            getRowLabel={(task) => task.title}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyTitle="No tasks found"
            emptySubtitle="Create a new task to get started"
          />
        )}
      </div>

      {/* Drawer */}
      <TasksFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        taskId={selectedTaskId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={handleDrawerDelete}
        onModeChange={(newMode) => setDrawerMode(newMode)}
      />
    </div>
  );
};
