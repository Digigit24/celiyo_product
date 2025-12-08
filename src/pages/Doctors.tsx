// src/pages/Doctors.tsx
import React, { useState } from 'react';
import { useDoctor } from '@/hooks/useDoctor';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import DoctorsFormDrawer from '@/components/DoctorsFormDrawer';
import {
  Loader2,
  Plus,
  Search,
  UserPlus,
  Stethoscope,
  Calendar,
  DollarSign,
  Star
} from 'lucide-react';
import { DoctorListParams, Doctor } from '@/types/doctor.types';

export const Doctors: React.FC = () => {
  const { user, hasModuleAccess } = useAuth();
  const {
    hasHMSAccess,
    useDoctors,
    deleteDoctor,
  } = useDoctor();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'on_leave' | 'inactive' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debug logging
  console.log('Doctors component rendering...');
  console.log('HMS Access:', hasHMSAccess);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  // Build query params
  const queryParams: DoctorListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
  };

  // Fetch doctors
  const {
    data: doctorsData,
    error: doctorsError,
    isLoading: doctorsLoading,
    mutate: mutateDoctors
  } = useDoctors(queryParams);

  const doctors = doctorsData?.results || [];
  const totalCount = doctorsData?.count || 0;
  const hasNext = !!doctorsData?.next;
  const hasPrevious = !!doctorsData?.previous;

  // Debug logging
  console.log('Doctors data:', { doctors, totalCount, isLoading: doctorsLoading, error: doctorsError });

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleStatusFilter = (status: 'active' | 'on_leave' | 'inactive' | '') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleView = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctorId(doctor.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedDoctorId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleDelete = async (doctor: Doctor) => {
    try {
      await deleteDoctor(doctor.id);
      mutateDoctors();
    } catch (error: any) {
      console.error('Delete failed:', error);
    }
  };

  const handleDrawerSuccess = () => {
    mutateDoctors();
  };

  const handleDrawerDelete = () => {
    mutateDoctors();
  };

  // DataTable columns configuration
  const columns: DataTableColumn<Doctor>[] = [
    {
      header: 'Doctor',
      key: 'name',
      cell: (doctor) => (
        <div className="flex flex-col">
          <span className="font-medium">{doctor.full_name}</span>
          <span className="text-sm text-muted-foreground">{doctor.user?.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Specialties',
      key: 'specialties',
      cell: (doctor) => (
        <div className="flex flex-wrap gap-1">
          {(doctor.specialties || []).slice(0, 2).map((specialty) => (
            <Badge key={specialty.id} variant="secondary" className="text-xs">
              {specialty.name}
            </Badge>
          ))}
          {(doctor.specialties || []).length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{(doctor.specialties || []).length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Experience',
      key: 'experience',
      cell: (doctor) => (
        <span className="text-sm">{doctor.years_of_experience || 0} years</span>
      ),
    },
    {
      header: 'Consultation Fee',
      key: 'fee',
      cell: (doctor) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">${doctor.consultation_fee || 0}</span>
          <span className="text-xs text-muted-foreground">
            Follow-up: ${doctor.follow_up_fee || 0}
          </span>
        </div>
      ),
    },
    {
      header: 'Rating',
      key: 'rating',
      cell: (doctor) => (
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{doctor.average_rating || 0}</span>
          <span className="text-muted-foreground">({doctor.total_reviews || 0})</span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      cell: (doctor) => {
        const statusConfig = {
          active: { label: 'Active', className: 'bg-green-600' },
          on_leave: { label: 'On Leave', className: 'bg-orange-600' },
          inactive: { label: 'Inactive', className: 'bg-gray-600' },
        };
        const config = statusConfig[doctor.status];
        return (
          <Badge variant="default" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (doctor: Doctor, actions: any) => {
    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{doctor.full_name}</h3>
            <p className="text-sm text-muted-foreground truncate">{doctor.user?.email || 'N/A'}</p>
          </div>
          <Badge
            variant="default"
            className={
              doctor.status === 'active'
                ? 'bg-green-600'
                : doctor.status === 'on_leave'
                ? 'bg-orange-600'
                : 'bg-gray-600'
            }
          >
            {doctor.status === 'active' && 'Active'}
            {doctor.status === 'on_leave' && 'On Leave'}
            {doctor.status === 'inactive' && 'Inactive'}
          </Badge>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1">
          {(doctor.specialties || []).map((specialty) => (
            <Badge key={specialty.id} variant="secondary" className="text-xs">
              {specialty.name}
            </Badge>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Experience</p>
            <p className="font-medium">{doctor.years_of_experience || 0} years</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Consultation</p>
            <p className="font-medium">${doctor.consultation_fee || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Rating</p>
            <p className="font-medium flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {doctor.average_rating || 0}
            </p>
          </div>
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
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      {/* DEBUG: Confirm render */}
      <div style={{ padding: '10px', background: '#f0f0f0', border: '2px solid #ff0000' }}>
        <p style={{ margin: 0 }}>🚨 DEBUG: Doctors component is rendering!</p>
        <p style={{ margin: 0, fontSize: '12px' }}>Loading: {String(doctorsLoading)} | Doctors count: {doctors.length} | Total: {totalCount}</p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Doctors</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your medical staff
          </p>
        </div>
        <Button onClick={handleCreate} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Doctors</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {doctors.filter((d) => d.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">On Leave</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {doctors.filter((d) => d.status === 'on_leave').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Fee</p>
                <p className="text-xl sm:text-2xl font-bold">
                  $
                  {doctors.length > 0
                    ? Math.round(
                        doctors.reduce(
                          (sum, d) => sum + parseFloat(d.consultation_fee),
                          0
                        ) / doctors.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors by name, email..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'on_leave' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('on_leave')}
              >
                On Leave
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Doctors List</CardTitle>
            {doctorsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {doctorsError ? (
            <div className="p-8 text-center">
              <p className="text-destructive">{doctorsError.message}</p>
            </div>
          ) : (
            <>
              <DataTable
                rows={doctors}
                isLoading={doctorsLoading}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(doctor) => doctor.id}
                getRowLabel={(doctor) => doctor.full_name}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                emptyTitle="No doctors found"
                emptySubtitle="Try adjusting your search or filters, or add a new doctor"
              />

              {/* Pagination */}
              {!doctorsLoading && doctors.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {doctors.length} of {totalCount} doctor(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevious}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <DoctorsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        doctorId={selectedDoctorId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={handleDrawerDelete}
        onModeChange={(newMode) => setDrawerMode(newMode)}
      />
    </div>
  );
};
