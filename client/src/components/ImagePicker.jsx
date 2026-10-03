import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Eye,
  Smartphone,
  AlertCircle
} from 'lucide-react';

/**
 * Format bytes to readable size (KB, MB)
 */
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Compresses an image file from the device client-side and returns base64 and dimension stats
 */
const compressImageFile = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.84) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        const originalWidth = width;
        const originalHeight = height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Estimate compressed size in bytes from base64 length
        const head = 'data:image/jpeg;base64,';
        const compressedBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);

        resolve({
          dataUrl,
          width,
          height,
          originalWidth,
          originalHeight,
          compressedBytes
        });
      };
      img.onerror = (err) => reject(new Error('Corrupted or invalid image file.'));
    };
    reader.onerror = (err) => reject(new Error('Unable to read selected device file.'));
  });
};

export default function ImagePicker({ value, onChange, onProcessingChange, accentColor = 'indigo' }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP) from your device.');
      return;
    }

    // Safety limit 15MB
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB. Please choose a smaller photo.');
      return;
    }

    setUploadError('');
    setUploading(true);
    onProcessingChange?.(true);

    try {
      const result = await compressImageFile(file);
      setFileDetails({
        name: file.name,
        originalSize: file.size,
        optimizedSize: result.compressedBytes,
        dimensions: `${result.width} × ${result.height}`
      });
      onChange(result.dataUrl);
    } catch (err) {
      setUploadError(err.message || 'Failed to process image from device. Please select another file.');
    } finally {
      setUploading(false);
      onProcessingChange?.(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
    setFileDetails(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Color schemes for borders and highlights
  const accentClasses = {
    rose: {
      borderActive: 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: 'text-rose-400'
    },
    emerald: {
      borderActive: 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: 'text-emerald-400'
    },
    indigo: {
      borderActive: 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10',
      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      icon: 'text-indigo-400'
    }
  }[accentColor] || {
    borderActive: 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10',
    btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: 'text-indigo-400'
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input (Always triggers native device file dialog) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        aria-label="Choose item photo from device"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleFileProcess(file);
        }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>Item Photo (Optional)</span>
        </label>
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-slate-500" />
          <span>Local Device Storage</span>
        </span>
      </div>

      {/* If Image is Selected -> Show Rich Preview Card */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/90 p-3 sm:p-4 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Thumbnail with Click to Expand */}
            <div
              onClick={() => setFullPreviewOpen(true)}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950 cursor-pointer group"
              title="Click to view full size"
            >
              <img
                src={value}
                alt="Selected device item photo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="w-5 h-5 drop-shadow-md" />
              </div>
            </div>

            {/* Metadata and Stats */}
            <div className="flex-1 min-w-0 space-y-1.5 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loaded From Device
                </span>
                {fileDetails?.dimensions && (
                  <span className="text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    {fileDetails.dimensions}
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-white truncate max-w-md font-mono">
                {fileDetails?.name || 'Selected Device Photo'}
              </p>

              {fileDetails && (
                <div className="text-[11px] text-slate-400 space-x-2">
                  <span>Size: <strong className="text-slate-200">{formatBytes(fileDetails.optimizedSize)}</strong></span>
                  {fileDetails.originalSize > fileDetails.optimizedSize && (
                    <span className="text-slate-500 line-through">
                      ({formatBytes(fileDetails.originalSize)})
                    </span>
                  )}
                  <span className="text-emerald-400 font-medium">✓ Optimized for fast upload</span>
                </div>
              )}

              {/* Action Buttons: Change or Remove */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  Change File
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3 h-3 text-rose-400" />
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Full Screen Image Modal */}
          {fullPreviewOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
              onClick={() => setFullPreviewOpen(false)}
            >
              <div
                className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setFullPreviewOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={value}
                  alt="Full preview"
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain mx-auto"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State Dropzone: Select directly from device files */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Browse device files to select an item photo"
          aria-busy={uploading}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
            dragActive
              ? accentClasses.borderActive
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-105 transition-transform">
              {uploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              ) : (
                <UploadCloud className={`w-7 h-7 ${accentClasses.icon}`} />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {uploading ? 'Processing & Optimizing Image...' : 'Select Item Image from Device Files'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Drag and drop your photo here, or click to browse files from your computer, phone, or tablet.
              </p>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 ${accentClasses.btn}`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                Browse Device Files
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span>PNG, JPG, WEBP, GIF</span>
              <span>•</span>
              <span>Up to 15MB</span>
              <span>•</span>
              <span>Auto-compressed</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
