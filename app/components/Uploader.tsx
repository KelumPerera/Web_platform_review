import MediaUploader from './MediaUploader';
import CloudinaryUploader from './CloudinaryUploader';

interface UploaderProps {
  onUpload: (url: string, fileName: string) => void;
  disabled?: boolean;
  storage?: 'supabase' | 'cloudinary';
}

export default function Uploader({ onUpload, disabled = false, storage = 'supabase' }: UploaderProps) {
  if (storage === 'cloudinary') {
    return <CloudinaryUploader onUpload={onUpload} disabled={disabled} />;
  }

  return <MediaUploader onUpload={onUpload} disabled={disabled} />;
}
