// src/components/form/DoctorSelect.tsx
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useDoctor } from '@/hooks/useDoctor';

interface DoctorSelectProps {
  value?: number | string | null;
  onChange: (doctorId: number | string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  showSpecialties?: boolean;
  returnUserId?: boolean; // If true, returns user_id (UUID string) instead of id (number)
}

export function DoctorSelect({
  value,
  onChange,
  disabled = false,
  error,
  label = 'Doctor',
  required = false,
  placeholder = 'Select a doctor',
  showSpecialties = true,
  returnUserId = false,
}: DoctorSelectProps) {
  const { useDoctors } = useDoctor();
  const { data: doctorsData } = useDoctors({ page_size: 1000 });

  const doctors = doctorsData?.results || [];

  // State for dropdown
  const [selectOpen, setSelectOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Convert value to display value (always use id for display)
  const displayValue = returnUserId && typeof value === 'string'
    ? doctors.find(d => d.user_id === value)?.id
    : value;

  // Filter doctors based on search
  const filteredDoctors = doctors.filter((doctor) => {
    const search = searchTerm.toLowerCase();
    const specialties = doctor.specialties?.map((s) => s.name).join(' ').toLowerCase() || '';
    return (
      doctor.full_name?.toLowerCase().includes(search) ||
      doctor.employee_id?.toLowerCase().includes(search) ||
      specialties.includes(search)
    );
  });

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      {/* Doctor Selection */}
      <Select
        value={displayValue ? String(displayValue) : ''}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={(val) => {
          const selectedDoctor = doctors.find(d => d.id === Number(val));
          if (selectedDoctor) {
            onChange(returnUserId ? selectedDoctor.user_id : selectedDoctor.id);
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
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Doctor List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredDoctors.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No doctors found
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <SelectItem key={doctor.id} value={String(doctor.id)}>
                  <div className="flex flex-col">
                    <span className="font-medium">{doctor.full_name}</span>
                    {showSpecialties && doctor.specialties && doctor.specialties.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {doctor.specialties.map((s) => s.name).join(', ')}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
