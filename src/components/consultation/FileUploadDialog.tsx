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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, File, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      await onUpload(selectedFile, description);
      toast.success('File uploaded successfully');
      // Reset for next upload instead of closing
      setSelectedFile(null);
      setDescription('');
      setPreviewUrl(null);
      // Dialog stays open for next upload
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDescription('');
    setPreviewUrl(null);
    onOpenChange(false);
  };

  const getFileIcon = () => {
    if (!selectedFile) return <File className="h-8 w-8" />;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />;
    if (selectedFile.type === 'application/pdf') return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload images or PDF documents. Maximum file size: 10MB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!selectedFile ? (
            // Dropzone
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
                <p className="text-lg font-medium">Drop the file here</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drag & drop a file here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported: Images (PNG, JPG, GIF, WebP) and PDF files
                  </p>
                </>
              )}
            </div>
          ) : (
            // Selected File Preview
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-4">
                {/* Preview */}
                {previewUrl ? (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-video bg-muted rounded-lg">
                    {getFileIcon()}
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this file..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Close
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading...' : 'Upload & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};