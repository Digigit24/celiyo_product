import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote } from 'lucide-react';

interface NotesCellProps {
  notes?: string;
  onSave: (notes: string) => Promise<void>;
  maxLength?: number;
}

export const NotesCell: React.FC<NotesCellProps> = ({ notes = '', onSave, maxLength = 50 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setValue(notes);
  }, [notes]);

  const handleChange = (newValue: string) => {
    setValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(newValue);
      } catch (error) {
        console.error('Failed to save notes:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const truncatedText = value && value.length > maxLength
    ? `${value.substring(0, maxLength)}...`
    : value || '';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <StickyNote className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {truncatedText || 'Add note...'}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Notes</h4>
            {isSaving && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
          </div>
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Add notes..."
            rows={6}
            className="text-sm resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Changes save automatically
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
