'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PortfolioFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: {
    title?: string;
    description?: string;
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
    isProduct?: boolean;
    demoUrl?: string;
    githubUrl?: string;
    testScenarioUrl?: string;
    category?: string;
    tags?: string;
    pledgeAmount?: number;
    processorType?: 'stripe' | 'paypal';
  };
  disabled?: boolean;
}

interface FormData {
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  file?: File;
  isProduct: boolean;
  demoUrl?: string;
  githubUrl?: string;
  testScenarioFile?: File;
  testScenarioUrl?: string;
  category?: string;
  tags?: string;
  pledgeAmount?: number;
  processorType?: 'stripe' | 'paypal';
}

export default function PortfolioForm({ onSubmit, initialData, disabled = false }: PortfolioFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [mediaType, setMediaType] = useState(initialData?.mediaType || 'image');
  const [currentMediaUrl, setCurrentMediaUrl] = useState(initialData?.mediaUrl || '');
  const [category, setCategory] = useState(initialData?.category || 'Development');
  const [tags, setTags] = useState(initialData?.tags || '');
  
  // Uploading States
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingMarkdown, setIsUploadingMarkdown] = useState(false);
  
  // Product Fields
  const [isProduct, setIsProduct] = useState(initialData?.isProduct || false);
  const [demoUrl, setDemoUrl] = useState(initialData?.demoUrl || '');
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '');
  const [testScenarioUrl, setTestScenarioUrl] = useState(initialData?.testScenarioUrl || '');
  const [testScenarioFile, setTestScenarioFile] = useState<File | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState(initialData?.pledgeAmount || 0);
  const [processorType, setProcessorType] = useState<'stripe' | 'paypal'>(initialData?.processorType || 'stripe');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: FormData = {
      title,
      description,
      mediaType,
      isProduct,
      demoUrl: demoUrl || '',
      githubUrl: githubUrl || '',
      testScenarioUrl,
      category,
      tags,
      pledgeAmount,
      processorType,
    };

    if (mediaType === 'image' && !currentMediaUrl) {
      alert('Please upload an image');
      return;
    }

    if (mediaType === 'video' && !currentMediaUrl) {
      alert('Please upload a video');
      return;
    }

    if (currentMediaUrl) {
      formData.file = new File([], currentMediaUrl.split('/').pop() || 'media', { type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4' });
    }

    if (testScenarioFile) {
      formData.testScenarioFile = testScenarioFile;
    }

    onSubmit(formData);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingMedia(true);
    const uploaderFormData = new FormData();
    uploaderFormData.append('file', file);
    
    try {
      // Fetch authenticated user ID to upload to the correct Supabase user storage bucket folder
      const statusRes = await fetch('/api/auth/status');
      const statusData = await statusRes.json();
      if (statusData.authenticated && statusData.user?.id) {
        uploaderFormData.append('profileId', statusData.user.id);
      } else {
        uploaderFormData.append('profileId', 'anonymous');
      }

      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: uploaderFormData,
      });
      const data = await res.json();
      if (data.success) {
        setCurrentMediaUrl(data.url);
      } else {
        alert('Media upload failed: ' + data.error);
      }
    } catch (err) {
      alert('Media upload failed');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleMarkdownUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.md')) {
      alert('Please upload a valid Markdown (.md) file');
      return;
    }

    setTestScenarioFile(file);
    setIsUploadingMarkdown(true);
    
    const uploaderFormData = new FormData();
    uploaderFormData.append('file', file);
    
    try {
      // Fetch authenticated user ID to upload to the correct Supabase user storage bucket folder
      const statusRes = await fetch('/api/auth/status');
      const statusData = await statusRes.json();
      if (statusData.authenticated && statusData.user?.id) {
        uploaderFormData.append('profileId', statusData.user.id);
      } else {
        uploaderFormData.append('profileId', 'anonymous');
      }

      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: uploaderFormData,
      });
      const data = await res.json();
      if (data.success) {
        setTestScenarioUrl(data.url);
      } else {
        alert('Markdown upload failed: ' + data.error);
      }
    } catch (err) {
      alert('Markdown upload failed');
    } finally {
      setIsUploadingMarkdown(false);
    }
  };
  const isUploading = isUploadingMedia || isUploadingMarkdown;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Core Specifications */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase">Project Title</label>
              <span className="text-xs text-neutral-500">{title.length} / 60</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              maxLength={60}
              required
              disabled={disabled || isUploading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white transition-all text-sm"
              placeholder="Project Title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={disabled || isUploading}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white transition-all appearance-none pr-10"
                >
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Writing">Writing</option>
                  <option value="Other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Tags (Comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={disabled || isUploading}
                placeholder="e.g. React, Next.js, Postgres"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase">Description</label>
              <span className="text-xs text-neutral-500">{description.length} / 500</span>
            </div>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              required
              disabled={disabled || isUploading}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white transition-all text-sm"
              placeholder="Describe your project in detail..."
            />
          </div>

          {/* Product Feature Option */}
          <div className="pt-6 border-t border-neutral-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isProduct}
                onChange={(e) => setIsProduct(e.target.checked)}
                disabled={disabled || isUploading}
                className="w-5 h-5 rounded border-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-neutral-950 cursor-pointer"
              />
              <span className="text-sm font-semibold text-neutral-200">Convert this project to an active reviewable Product</span>
            </label>
            <p className="text-xs text-neutral-400 mt-1 ml-8">Enables reviewer upvotes, feedback reports, public test execution instructions, and product changelogs.</p>

            {isProduct && (
              <div className="mt-4 ml-8 p-4 bg-neutral-950/80 border border-neutral-850 rounded-xl space-y-4 animate-fadeIn">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Escrow Bounty Pledge</h4>
                <p className="text-[11px] text-neutral-400">Set a monetary bounty locked in platform escrow (via Stripe Connect or PayPal) to incentivize expert developer reviews. Reward will be paid to the author of the best technical validation report.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Pledge Amount ($ USD)</label>
                    <input
                      type="number"
                      min="0"
                      value={pledgeAmount || ''}
                      onChange={(e) => setPledgeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="e.g. 50"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Payment Escrow Processor</label>
                    <div className="relative">
                      <select
                        value={processorType}
                        onChange={(e) => setProcessorType(e.target.value as 'stripe' | 'paypal')}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all appearance-none pr-10"
                      >
                        <option value="stripe">Stripe Escrow Connect</option>
                        <option value="paypal">PayPal Payouts Escrow</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Assets */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Media Type</label>
              <div className="relative">
                <select
                  value={mediaType}
                  onChange={(e) => {
                    setMediaType(e.target.value as 'image' | 'video');
                    setCurrentMediaUrl('');
                  }}
                  disabled={disabled || isUploading}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white transition-all appearance-none pr-10"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Upload Media</label>
              <div className="relative border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900/40 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[140px] transition-all group">
                {isUploadingMedia ? (
                  <div className="text-center py-6 select-none">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-xs font-semibold text-neutral-400">Uploading media...</p>
                  </div>
                ) : currentMediaUrl ? (
                  <div className="relative w-full h-36 flex items-center justify-center bg-black">
                    {mediaType === 'image' ? (
                      <img src={currentMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={currentMediaUrl} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentMediaUrl('')}
                      className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md"
                      title="Remove media"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full p-5 flex flex-col items-center justify-center cursor-pointer select-none">
                    <input
                      type="file"
                      accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleMediaUpload}
                      disabled={disabled || isUploadingMedia}
                      className="sr-only"
                    />
                    <span className="text-xl mb-1 block">📁</span>
                    <p className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Supports {mediaType === 'image' ? 'PNG, JPG, or GIF. Max 25MB' : 'MP4, MOV, or WebM. Max 50MB'}.
                    </p>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Links & Test Specifications */}
          <div className="pt-6 border-t border-neutral-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Links & Test Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-1">Live Application URL (Demo)</label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  disabled={disabled || isUploading}
                  placeholder="https://example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-1">GitHub / Repository URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={disabled || isUploading}
                  placeholder="https://github.com/username/repo"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-white text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">Upload Test Scenarios Markdown (.md)</label>
              <div className="relative border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900/40 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[100px] transition-all group">
                {isUploadingMarkdown ? (
                  <div className="text-center py-6 select-none">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-xs font-semibold text-neutral-400">Uploading test scenario...</p>
                  </div>
                ) : testScenarioUrl ? (
                  <div className="w-full p-4 flex items-center justify-between bg-neutral-950/80">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xl">📝</span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-neutral-200 truncate">
                          {testScenarioFile?.name || 'test_scenario.md'}
                        </p>
                        <a href={testScenarioUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline">
                          View uploaded file
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTestScenarioUrl('');
                        setTestScenarioFile(null);
                      }}
                      className="bg-red-600/90 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ml-4"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full p-5 flex flex-col items-center justify-center cursor-pointer select-none">
                    <input
                      type="file"
                      accept=".md"
                      onChange={handleMarkdownUpload}
                      disabled={disabled || isUploadingMarkdown}
                      className="sr-only"
                    />
                    <span className="text-xl mb-1 block">📝</span>
                    <p className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors">
                      Click to upload test scenarios (.md)
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Supports only Markdown files (.md).
                    </p>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flex gap-4 pt-6 border-t border-neutral-800">
        <Link
          href="/dashboard/items"
          className="flex-1 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 text-white text-center flex items-center justify-center text-sm active:scale-98"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={disabled || isUploading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 font-semibold text-sm rounded-xl px-6 py-3 shadow-lg shadow-blue-500/10 active:scale-98 transition-all text-white flex items-center justify-center gap-2"
        >
          {(disabled || isUploading) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {disabled ? (initialData ? 'Updating...' : 'Creating...') : isUploading ? 'Uploading...' : (initialData ? 'Update Item' : 'Create Item')}
        </button>
      </div>
    </form>
  );
}

