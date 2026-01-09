// src/components/consultation/FloatingActionPanel.tsx
import React from 'react';
import { Microscope, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FloatingActionPanelProps {
  onOpenDiagnostics: () => void;
  onAddNotes: () => void;
  onDummyAction?: () => void;
  disabled?: boolean;
}

export const FloatingActionPanel: React.FC<FloatingActionPanelProps> = ({
  onOpenDiagnostics,
  onAddNotes,
  onDummyAction,
  disabled = false,
}) => {
  return (
    <div className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
      <TooltipProvider>
        {/* Add Notes Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onAddNotes}
              size="icon"
              disabled={disabled}
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Add Clinical Note</p>
          </TooltipContent>
        </Tooltip>

        {/* Diagnostics Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onOpenDiagnostics}
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95"
            >
              <Microscope className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Order Diagnostics</p>
          </TooltipContent>
        </Tooltip>

        {/* Dummy Action Button */}
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDummyAction}
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-lg bg-muted hover:bg-muted/80 transition-all hover:scale-110 active:scale-95"
              disabled
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Coming Soon</p>
          </TooltipContent>
        </Tooltip> */}
      </TooltipProvider>
    </div>
  );
};
