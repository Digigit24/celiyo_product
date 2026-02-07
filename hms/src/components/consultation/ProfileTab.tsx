// src/components/consultation/ProfileTab.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pencil, Save, X, User, Phone, Mail, MapPin, Calendar, Droplet, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileTabProps {
  patientId: number;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ patientId }) => {
  const [isEditing, setIsEditing] = useState(false);

  // TODO: Fetch patient data from API using patientId
  // Placeholder patient data
  const [patientData, setPatientData] = useState({
    fullName: 'John Doe',
    patientId: 'PAT-001',
    dateOfBirth: '1980-05-15',
    age: 44,
    gender: 'Male',
    bloodGroup: 'O+',
    mobilePrimary: '+91-9876543210',
    mobileSecondary: '',
    email: 'john.doe@example.com',
    address: '123 Main Street, City, State',
    emergencyContact: '+91-9876543211',
    emergencyContactName: 'Jane Doe',
    emergencyContactRelation: 'Spouse',
    occupation: 'Software Engineer',
    maritalStatus: 'Married',
    nationality: 'Indian',
  });

  const handleSave = () => {
    // TODO: Save patient data via API
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // TODO: Reset to original data
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl font-semibold bg-primary/10">
                  {patientData.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{patientData.fullName}</h2>
                <p className="text-sm text-muted-foreground">ID: {patientData.patientId}</p>
                <p className="text-sm text-muted-foreground">{patientData.age} years • {patientData.gender}</p>
              </div>
            </div>
            <div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              {isEditing ? (
                <Input
                  id="fullName"
                  value={patientData.fullName}
                  onChange={(e) => setPatientData({ ...patientData, fullName: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={patientData.dateOfBirth}
                  onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <Input
                  id="gender"
                  value={patientData.gender}
                  onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.gender}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              {isEditing ? (
                <Input
                  id="bloodGroup"
                  value={patientData.bloodGroup}
                  onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.bloodGroup}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              {isEditing ? (
                <Input
                  id="maritalStatus"
                  value={patientData.maritalStatus}
                  onChange={(e) => setPatientData({ ...patientData, maritalStatus: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.maritalStatus}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              {isEditing ? (
                <Input
                  id="nationality"
                  value={patientData.nationality}
                  onChange={(e) => setPatientData({ ...patientData, nationality: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.nationality}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              {isEditing ? (
                <Input
                  id="occupation"
                  value={patientData.occupation}
                  onChange={(e) => setPatientData({ ...patientData, occupation: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.occupation}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobilePrimary">Primary Mobile</Label>
              {isEditing ? (
                <Input
                  id="mobilePrimary"
                  value={patientData.mobilePrimary}
                  onChange={(e) => setPatientData({ ...patientData, mobilePrimary: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.mobilePrimary}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileSecondary">Secondary Mobile</Label>
              {isEditing ? (
                <Input
                  id="mobileSecondary"
                  value={patientData.mobileSecondary}
                  onChange={(e) => setPatientData({ ...patientData, mobileSecondary: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.mobileSecondary || 'N/A'}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={patientData.email}
                  onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.email}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={patientData.address}
                  onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.address}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              {isEditing ? (
                <Input
                  id="emergencyContactName"
                  value={patientData.emergencyContactName}
                  onChange={(e) => setPatientData({ ...patientData, emergencyContactName: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.emergencyContactName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelation">Relation</Label>
              {isEditing ? (
                <Input
                  id="emergencyContactRelation"
                  value={patientData.emergencyContactRelation}
                  onChange={(e) => setPatientData({ ...patientData, emergencyContactRelation: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.emergencyContactRelation}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergencyContact">Contact Number</Label>
              {isEditing ? (
                <Input
                  id="emergencyContact"
                  value={patientData.emergencyContact}
                  onChange={(e) => setPatientData({ ...patientData, emergencyContact: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium py-2">{patientData.emergencyContact}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
