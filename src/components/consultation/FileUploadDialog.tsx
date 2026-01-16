// src/components/consultation/FileUploadDialog.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, File, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PendingFile {
  id: string;
  file: File;
  description: string;
  previewUrl?: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, description: string) => Promise<void>;
}

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  onUpload,
}) => {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: PendingFile[] = acceptedFiles.map((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      let previewUrl: string | undefined;

      // Create preview for images only
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id,
        file,
        description: '',
        previewUrl,
      };
    });

    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const pendingFile of pendingFiles) {
      try {
        await onUpload(pendingFile.file, pendingFile.description);
        successCount++;
        
        // Clean up preview URL
        if (pendingFile.previewUrl) {
          URL.revokeObjectURL(pendingFile.previewUrl);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`Failed to upload ${pendingFile.file.name}:`, error);
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload`);
    }

    // Clear pending files after upload
    setPendingFiles([]);
  };

  const handleRemoveFile = (id: string) => {
    setPendingFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpdateDescription = (id: string, description: string) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description } : f))
    );
  };

  const handleClose = () => {
    // Clean up all preview URLs
    pendingFiles.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setPendingFiles([]);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (file.type === 'application/pdf') return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return 'Image';
    if (file.type === 'application/pdf') return 'PDF';
    return 'Document';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload images or PDF documents. Maximum file size: 10MB per file
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported: Images (PNG, JPG, GIF, WebP) and PDF files
                </p>
              </>
            )}
          </div>

          {/* Pending Files List */}
          {pendingFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Files to Upload ({pendingFiles.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    pendingFiles.forEach((file) => {
                      if (file.previewUrl) {
                        URL.revokeObjectURL(file.previewUrl);
                      }
                    });
                    setPendingFiles([]);
                  }}
                  disabled={uploading}
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {pendingFiles.map((pendingFile) => (
                  <div
                    key={pendingFile.id}
                    className="border rounded-lg p-3 space-y-3 bg-card"
                  >
                    <div className="flex items-start gap-3">
                      {/* Preview Thumbnail */}
                      <div className="flex-shrink-0">
                        {pendingFile.previewUrl ? (
                          <div className="w-16 h-16 rounded border overflow-hidden bg-muted">
                            <img
                              src={pendingFile.previewUrl}
                              alt={pendingFile.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
                            {pendingFile.file.type === 'application/pdf' ? (
                              <FileText className="h-8 w-8 text-red-600" />
                            ) : (
                              <File className="h-8 w-8 text-blue-600" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" title={pendingFile.file.name}>
                              {pendingFile.file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {getFileTypeLabel(pendingFile.file)}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(pendingFile.file.size)}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRemoveFile(pendingFile.id)}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Description Input */}
                        <div className="space-y-1">
                          <Label htmlFor={`desc-${pendingFile.id}`} className="text-xs">
                            Description (Optional)
                          </Label>
                          <Textarea
                            id={`desc-${pendingFile.id}`}
                            placeholder="Add a description..."
                            value={pendingFile.description}
                            onChange={(e) =>
                              handleUpdateDescription(pendingFile.id, e.target.value)
                            }
                            rows={2}
                            className="text-sm"
                            disabled={uploading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadAll}
            disabled={pendingFiles.length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${pendingFiles.length} File${pendingFiles.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};