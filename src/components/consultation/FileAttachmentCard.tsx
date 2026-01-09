// src/components/consultation/FileAttachmentCard.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  File,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FileAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  created_at: string;
  description?: string;
}

interface FileAttachmentCardProps {
  file: FileAttachment;
  onDelete: (id: number) => void;
  onDownload: (file: FileAttachment) => void;
}

export const FileAttachmentCard: React.FC<FileAttachmentCardProps> = ({
  file,
  onDelete,
  onDownload,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const isImage = file.file_type.startsWith('image/');
  const isPDF = file.file_type === 'application/pdf';

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5" />;
    if (isPDF) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getFileTypeLabel = () => {
    if (isImage) return 'Image';
    if (isPDF) return 'PDF';
    return 'Document';
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        {/* Preview Section */}
        {isImage ? (
          <div
            className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
            onClick={() => setPreviewOpen(true)}
          >
            <img
              src={file.file_url}
              alt={file.file_name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : isPDF ? (
          <div
            className="relative aspect-video bg-gradient-to-br from-red-50 to-red-100 cursor-pointer flex items-center justify-center"
            onClick={() => setPreviewOpen(true)}
          >
            <FileText className="h-16 w-16 text-red-600" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <File className="h-16 w-16 text-blue-600" />
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="mt-0.5 text-primary">{getFileIcon()}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate" title={file.file_name}>
                  {file.file_name}
                </h4>
                {file.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {file.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(file)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(file.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getFileTypeLabel()}
              </Badge>
              <span className="text-muted-foreground">{formatFileSize(file.file_size)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {file.uploaded_by && (
            <div className="text-xs text-muted-foreground">
              Uploaded by {file.uploaded_by}
            </div>
          )}
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              <span className="truncate">{file.file_name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            {isImage ? (
              <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            ) : isPDF ? (
              <iframe
                src={file.file_url}
                className="w-full h-[600px] rounded-lg border"
                title={file.file_name}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Preview not available for this file type</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => onDownload(file)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};