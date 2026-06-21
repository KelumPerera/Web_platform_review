import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Route handler client
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation'; // Use next/navigation for routing

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
}

interface PortfolioItemFormProps {
  itemId?: string; // Optional: for editing existing items
  onItemSaved?: () => void; // Callback after item is saved
}

const PortfolioItemForm: React.FC<PortfolioItemFormProps> = ({ itemId, onItemSaved }) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemId) {
      // Fetch existing item data if editing
      const fetchItem = async () => {
        setIsLoading(true);
        setError('');
        try {
          const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('id', itemId)
            .single();

          if (error) {
            toast.error(`Failed to load portfolio item: ${error.message}`);
            setError('Could not load item.');
            console.error('Supabase fetch error:', error);
          } else if (data) {
            setTitle(data.title);
            setDescription(data.description || '');
            setMediaUrl(data.media_url);
            setMediaType(data.media_type);
          }
        } catch (err) {
          toast.error('An unexpected error occurred while loading the item.');
          console.error('Unexpected load error:', err);
          setError('Could not load item.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchItem();
    }
  }, [itemId]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaUrl(URL.createObjectURL(file)); // Preview
      // Basic type detection
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else {
        setMediaType(null); // Unknown type
        toast.warn('Unsupported media type. Please upload an image or video.');
      }
    }
  };

  const handleMediaRemove = async () => {
    setMediaFile(null);
    setMediaUrl(null);
    setMediaType(null);
    setMediaUrl(''); // Clear preview and stored URL
    if (itemId) {
      // Remove from database if editing
      try {
        const { error } = await supabase
          .from('portfolio_items')
          .update({ media_url: null, media_type: null })
          .eq('id', itemId);
        if (error) {
          toast.error('Failed to remove media from item.');
          console.error('Error removing media:', error);
        } else {
          toast.success('Media removed successfully!');
        }
      } catch (error) {
        toast.error('An unexpected error occurred while removing media.');
        console.error('Unexpected error removing media:', error);
      }
    }
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile) return mediaUrl; // Return existing URL if no new file

    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      toast.error('Authentication required to upload media.');
      return null;
    }
    const userId = user.data.user.id;
    const fileName = `${userId}/${Date.now()}-${mediaFile.name}`;
    const filePath = `${fileName}`; // Path within the Supabase Storage bucket

    try {
      const { error: uploadError } = await supabase.storage
        .from('portfolio-media')
        .upload(filePath, mediaFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast.error(`Failed to upload media: ${uploadError.message}`);
        console.error('Supabase upload error:', uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from('portfolio-media').getPublicUrl(filePath);
      return publicUrlData?.publicUrl || null;

    } catch (error) {
      toast.error('An unexpected error occurred during media upload.');
      console.error('Unexpected upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    let finalMediaUrl = mediaUrl;

    try {
      // Upload media if a new file is selected
      if (mediaFile) {
        const uploadedUrl = await uploadMedia();
        if (!uploadedUrl) {
          setIsSaving(false);
          return; // Error handled in uploadMedia
        }
        finalMediaUrl = uploadedUrl;
      } else if (!mediaUrl && !mediaFile) {
        // If no media exists and none is selected, ensure it's null
        finalMediaUrl = null;
      }

      if (!title.trim()) {
        setError('Title is required.');
        setIsSaving(false);
        return;
      }

      // Determine the correct operation: INSERT or UPDATE
      let operationError: Error | null = null;
      if (itemId) {
        // Update existing item
        const { error } = await supabase
          .from('portfolio_items')
          .update({
            title,
            description,
            media_url: finalMediaUrl,
            media_type: mediaType,
          })
          .eq('id', itemId);
        operationError = error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('portfolio_items')
          .insert({
            title,
            description,
            media_url: finalMediaUrl,
            media_type: mediaType,
            // profile_id will be automatically set by RLS based on auth.uid() if correctly configured
          });
        operationError = error;
      }

      if (operationError) {
        toast.error(`Failed to save item: ${operationError.message}`);
        console.error('Supabase operation error:', operationError);
        setError('Failed to save item. Please check your inputs.');
      } else {
        toast.success(`Portfolio item ${itemId ? 'updated' : 'added'} successfully!`);
        onItemSaved?.(); // Callback to refresh list or close modal
        // Clear form fields after successful save
        setTitle('');
        setDescription('');
        setMediaFile(null);
        setMediaUrl(null);
        setMediaType('image');
      }
    } catch (err) {
      toast.error('An unexpected error occurred during save.');
      console.error('Unexpected save error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-lg shadow-xl p-8 border border-neutral-800 space-y-6">
      <h3 className="text-2xl font-semibold">{itemId ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</h3>

      {/* Media Upload */}
      <div className="flex items-center space-x-4">
        <div className={`relative w-24 h-24 rounded-lg overflow-hidden border border-neutral-700 ${mediaUrl ? '' : 'bg-neutral-800 flex items-center justify-center'}`}>
          {mediaUrl ? (
            mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full object-cover" />
            ) : (
              <Image
                src={mediaUrl}
                alt="Media preview"
                layout="fill"
                objectFit="cover"
              />
            )
          ) : (
            <div className="text-neutral-600">No Media</div>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="media-upload"
            className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors duration-200"
          >
            {isSaving ? 'Processing...' : mediaFile ? 'Change Media' : 'Upload Media'}
          </label>
          <input
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="hidden"
            disabled={isSaving}
          />
          {mediaUrl && (
            <button
              type="button"
              onClick={handleMediaRemove}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white transition-colors duration-200"
            >
              Remove Media
            </button>
          )}
        </div>
      </div>

      {/* Media Type Selector */}
      <div className="flex flex-col">
        <label htmlFor="mediaType" className="block text-sm font-medium text-neutral-300 mb-2">Media Type</label>
        <select
          id="mediaType"
          value={mediaType || ''}
          onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | null)}
          required
          className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base appearance-none"
        >
          <option value="" disabled>Select media type</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-300">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 text-base"
          placeholder="e.g., Responsive Web Design"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-300">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 text-base"
          placeholder="Describe this project or service..."
        />
      </div>

      {error && <p className="text-red-500 text-center text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isSaving || isLoading}
        className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-lg font-semibold transition duration-150 ease-in-out"
      >
        {isSaving ? 'Saving...' : itemId ? 'Update Item' : 'Add Item'}
      </button>
    </form>
  );
};

export default PortfolioItemForm;
