import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  className = '' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      // Upload multiple files at once
      const formData = new FormData();
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        validFiles.push(file);
        formData.append('images', file);
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      // Upload to server
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4000/upload/images', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const uploadedUrls = result.images.map((img: any) => img.url);
      
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${validFiles.length} image(s) uploaded successfully`);

    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="h-5 w-5" />
        <Label className="text-sm font-medium">
          Court Photos ({images.length}/{maxImages})
        </Label>
        {images.length > 0 && (
          <Badge variant="secondary">{images.length} uploaded</Badge>
        )}
      </div>

      {/* Upload Methods */}
      <div className="max-w-md">
        {/* File Upload */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4" />
              <Label className="text-sm font-medium">Upload Court Images</Label>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileUpload}
                disabled={uploading || images.length >= maxImages}
                className="w-full"
                size="sm"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Max 5MB per image. JPG, PNG, WebP supported.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border-2 border-dashed border-muted overflow-hidden bg-muted">
                  <img
                    src={url}
                    alt={`Court image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                      e.currentTarget.className = 'w-full h-full object-cover opacity-50';
                    }}
                  />
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 shadow-lg"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge variant="secondary" className="text-xs truncate w-full justify-center">
                    Image {index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Guidelines:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Add high-quality photos showcasing your court</li>
              <li>Include different angles and lighting conditions</li>
              <li>Show amenities and facilities</li>
              <li>Avoid blurry or low-resolution images</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
