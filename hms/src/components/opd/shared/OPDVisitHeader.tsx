// src/components/opd/shared/OPDVisitHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Loader2,
  Phone,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
} from 'lucide-react';

interface OPDVisitHeaderProps {
  visit: any;
  currentIndex: number;
  totalVisits: number;
  prevVisitId: number | null;
  nextVisitId: number | null;
  isSaving: boolean;
  showCompleteDialog: boolean;
  completeNote: string;
  onBack: () => void;
  onPrevVisit: () => void;
  onNextVisit: () => void;
  onStartConsultation: () => void;
  onCompleteConsultation: () => void;
  setShowCompleteDialog: (show: boolean) => void;
  setCompleteNote: (note: string) => void;
}

export const OPDVisitHeader: React.FC<OPDVisitHeaderProps> = ({
  visit,
  currentIndex,
  totalVisits,
  prevVisitId,
  nextVisitId,
  isSaving,
  showCompleteDialog,
  completeNote,
  onBack,
  onPrevVisit,
  onNextVisit,
  onStartConsultation,
  onCompleteConsultation,
  setShowCompleteDialog,
  setCompleteNote,
}) => {
  const navigate = useNavigate();
  const patient = visit.patient_details;

  return (
    <>
      {/* Modern Sticky Header - Responsive */}
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-3 sm:gap-0">
          {/* Left Section */}
          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {patient?.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1
                  className="text-sm sm:text-lg font-bold leading-none cursor-pointer hover:underline decoration-primary/50 underline-offset-4 truncate"
                  onClick={() => navigate(`/patients/${visit.patient}`)}
                >
                  {patient?.full_name || 'Unknown Patient'}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="font-mono bg-muted px-1 rounded whitespace-nowrap">PID: {patient?.patient_id || 'N/A'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline whitespace-nowrap">{patient?.age || '-'} yrs / {patient?.gender || '-'}</span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline items-center gap-1 whitespace-nowrap">
                    <Phone className="h-3 w-3 inline" /> {patient?.mobile_primary || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Controls - Hidden on mobile, shown on larger screens */}
            <div className="hidden lg:flex items-center bg-muted/50 rounded-lg border p-0.5 ml-4 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onPrevVisit}
                disabled={!prevVisitId}
                title="Previous Patient"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 text-xs font-medium border-x border-muted-foreground/20 whitespace-nowrap">
                {currentIndex + 1} / {totalVisits}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onNextVisit}
                disabled={!nextVisitId}
                title="Next Patient"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Section - Status and Actions */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mobile Navigation Controls */}
            <div className="flex lg:hidden items-center bg-muted/50 rounded-lg border p-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onPrevVisit}
                disabled={!prevVisitId}
                title="Previous Patient"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-2 text-xs font-medium border-x border-muted-foreground/20 whitespace-nowrap">
                {currentIndex + 1} / {totalVisits}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onNextVisit}
                disabled={!nextVisitId}
                title="Next Patient"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Badge
              variant={visit.status === 'completed' ? 'default' : 'secondary'}
              className={`px-2 sm:px-3 py-1 text-xs uppercase tracking-wide shrink-0 ${
                visit.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                visit.status === 'in_consultation' || visit.status === 'in_progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                'bg-orange-100 text-orange-700 hover:bg-orange-100'
              }`}
            >
              <span className="hidden sm:inline">{visit.status?.replace('_', ' ')}</span>
              <span className="sm:hidden">{visit.status?.split('_')[0]}</span>
            </Badge>

            {/* Action Buttons based on Status */}
            {visit.status === 'waiting' && (
              <Button onClick={onStartConsultation} disabled={isSaving} className="gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm shrink-0">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span className="hidden sm:inline">Start Consultation</span>
                <span className="sm:hidden">Start</span>
              </Button>
            )}

            {(visit.status === 'in_consultation' || visit.status === 'in_progress') && (
              <Button onClick={() => setShowCompleteDialog(true)} disabled={isSaving} className="gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm shrink-0">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                <span className="hidden sm:inline">Complete Visit</span>
                <span className="sm:hidden">Complete</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Complete Consultation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Consultation</DialogTitle>
            <DialogDescription>
              Finalize this visit. This will move the patient to the completed list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="complete-note">Final Diagnosis / Notes</Label>
            <Input
              id="complete-note"
              placeholder="Enter diagnosis or completion summary..."
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={onCompleteConsultation} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
