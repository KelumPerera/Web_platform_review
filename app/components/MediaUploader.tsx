import { useState, useRef } from 'react';

interface MediaUploaderProps {
  onUpload: (url: string, fileName: string) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export default function MediaUploader({ 
  onUpload, 
  disabled = false,
  accept = 'image/*,video/*',
  maxSizeMB = 50
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('profileId', 'user-profile-id-placeholder');

    try {
      const response = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onUpload(data.url, data.fileName);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={`w-full border-2 border-dashed rounded-lg p-8 transition-colors ${
          disabled || isUploading
            ? 'border-neutral-700 bg-neutral-900 cursor-not-allowed'
            : 'border-neutral-600 hover:border-blue-500 hover:bg-neutral-900 cursor-pointer'
        }`}
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">📁</span>
          </div>
          <p className="text-neutral-300 font-medium">
            {isUploading ? 'Uploading...' : 'Click to upload media'}
          </p>
          <p className="text-xs text-neutral-500">
            Supports JPG, PNG, GIF, MP4 (Max {maxSizeMB}MB)
          </p>
        </div>
      </button>

      {isUploading && (
        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
