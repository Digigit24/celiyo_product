import React, { useState, useEffect } from 'react';
import { whatsappClient } from '@/lib/whatsappClient';

interface MediaWithAuthProps {
  src: string;
  alt: string;
  className?: string;
  previewSrc?: string;
  type: 'image' | 'video' | 'audio';
}

const MediaWithAuth: React.FC<MediaWithAuthProps> = ({ src, alt, className, previewSrc, type }) => {
  const [mediaSrc, setMediaSrc] = useState<string | null>(previewSrc || null);
  const [isLoading, setIsLoading] = useState(!previewSrc);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!src || previewSrc) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await whatsappClient.get(src, {
          responseType: 'blob',
        });
        
        const mimeType = response.headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([response.data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setMediaSrc(url);
      } catch (err) {
        console.error('Failed to fetch media:', err);
        setError('Failed to load media');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();

    // Cleanup function
    return () => {
      if (mediaSrc && !previewSrc) {
        URL.revokeObjectURL(mediaSrc);
      }
    };
  }, [src, previewSrc]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-md ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 text-destructive text-xs rounded-md ${className}`}>
        {error}
      </div>
    );
  }

  if (!mediaSrc) {
    return null;
  }

  if (type === 'image') {
    return <img src={mediaSrc} alt={alt} className={className} />;
  }

  if (type === 'video') {
    return <video src={mediaSrc} controls className={className} />;
  }

  if (type === 'audio') {
    return <audio src={mediaSrc} controls className={className} />;
  }

  return null;
};

export default MediaWithAuth;
