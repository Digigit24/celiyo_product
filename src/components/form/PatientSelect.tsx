// src/components/form/PatientSelect.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Edit2, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { usePatient } from '@/hooks/usePatient';
import type { PatientCreateData } from '@/types/patient.types';
import PatientsFormDrawer from '@/components/PatientsFormDrawer';

interface PatientSelectProps {
  value?: number | null;
  onChange: (patientId: number) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  showEditButton?: boolean;
  showAddButton?: boolean;
  placeholder?: string;
}

export function PatientSelect({
  value,
  onChange,
  disabled = false,
  error,
  label = 'Patient',
  required = false,
  showEditButton = true,
  showAddButton = true,
  placeholder = 'Select a patient',
}: PatientSelectProps) {
  const { usePatients, createPatient } = usePatient();
  const { data: patientsData, mutate: mutatePatients } = usePatients({ page_size: 1000 });

  const patients = patientsData?.results || [];

  // State for inline patient creation
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [inlineData, setInlineData] = useState({
    first_name: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    mobile_primary: '',
  });

  // State for patient drawer (full form edit)
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<number | null>(null);

  // State for dropdown
  const [selectOpen, setSelectOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter patients based on search
  const filteredPatients = patients.filter((patient) => {
    const search = searchTerm.toLowerCase();
    return (
      patient.full_name?.toLowerCase().includes(search) ||
      patient.patient_id?.toLowerCase().includes(search) ||
      patient.mobile_primary?.toLowerCase().includes(search)
    );
  });

  // Handle inline patient creation
  const handleCreateInlinePatient = async () => {
    if (!inlineData.first_name.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!inlineData.gender) {
      toast.error('Gender is required');
      return;
    }
    if (!inlineData.mobile_primary.trim() || inlineData.mobile_primary.length < 9) {
      toast.error('Valid mobile number is required (min 9 digits)');
      return;
    }

    setIsCreating(true);
    try {
      const newPatient = await createPatient({
        first_name: inlineData.first_name.trim(),
        gender: inlineData.gender,
        mobile_primary: inlineData.mobile_primary.trim(),
      } as PatientCreateData);

      toast.success('Patient created successfully');
      await mutatePatients();
      onChange(newPatient.id);

      // Reset and hide form
      setInlineData({ first_name: '', gender: '', mobile_primary: '' });
      setShowInlineForm(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create patient');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit patient
  const handleEditPatient = () => {
    if (value) {
      setSelectedPatientForEdit(value);
      setPatientDrawerOpen(true);
    }
  };

  // Handle patient drawer success
  const handlePatientDrawerSuccess = async () => {
    await mutatePatients();
    setPatientDrawerOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      {/* Patient Selection with Edit Button */}
      <div className="flex gap-2">
        <Select
          value={value ? String(value) : ''}
          open={selectOpen}
          onOpenChange={setSelectOpen}
          onValueChange={(val) => {
            onChange(Number(val));
            if (showInlineForm) {
              setShowInlineForm(false);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {/* Search Box */}
            <div className="p-2 border-b sticky top-0 bg-background z-10">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Add New Patient Button */}
            {showAddButton && (
              <div className="p-2 border-b sticky top-[52px] bg-background z-10">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInlineForm(!showInlineForm);
                    setSelectOpen(false);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Patient
                </Button>
              </div>
            )}

            {/* Patient List */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No patients found
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <SelectItem key={patient.id} value={String(patient.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{patient.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {patient.patient_id} • {patient.mobile_primary}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>

        {/* Edit Patient Button */}
        {showEditButton && value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleEditPatient}
            title="Edit patient details"
            disabled={disabled}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Inline Patient Creation Form */}
      {showInlineForm && (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Quick Add Patient</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowInlineForm(false);
                  setInlineData({ first_name: '', gender: '', mobile_primary: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="inline_first_name">First Name *</Label>
              <Input
                id="inline_first_name"
                value={inlineData.first_name}
                onChange={(e) => setInlineData({ ...inlineData, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>

            <div>
              <Label htmlFor="inline_gender">Gender *</Label>
              <Select
                value={inlineData.gender}
                onValueChange={(val) => setInlineData({ ...inlineData, gender: val as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inline_mobile">Mobile Number *</Label>
              <Input
                id="inline_mobile"
                value={inlineData.mobile_primary}
                onChange={(e) => setInlineData({ ...inlineData, mobile_primary: e.target.value })}
                placeholder="Enter mobile number"
              />
            </div>

            <Button
              type="button"
              onClick={handleCreateInlinePatient}
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Patient'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Patient Edit Drawer */}
      <PatientsFormDrawer
        open={patientDrawerOpen}
        onOpenChange={setPatientDrawerOpen}
        patientId={selectedPatientForEdit}
        mode="edit"
        onSuccess={handlePatientDrawerSuccess}
      />
    </div>
  );
}
