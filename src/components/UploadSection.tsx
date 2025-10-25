'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadSectionProps {
  onUploadComplete: () => void;
}

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setResult(data);
      setProgress(100);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Upload Episode</h2>

      <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
        {!file ? (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-white text-lg mb-2">Click to upload or drag and drop</p>
            <p className="text-slate-400 text-sm">MP4, MP3, or any video/audio format</p>
          </label>
        ) : (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 mx-auto text-green-400" />
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-slate-400 text-sm">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              onClick={() => setFile(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              Change file
            </button>
          </div>
        )}
      </div>

      {file && !uploading && !result && (
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Process Episode
        </button>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing episode...</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-white">
            <p className="font-medium mb-1">Upload Failed</p>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-white">
              <p className="font-medium mb-1">Processing Complete!</p>
              <p className="text-sm text-green-200">
                Generated {result.clipsGenerated} clips from episode
              </p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 text-sm text-yellow-200">
              <p className="font-medium mb-1">Warnings:</p>
              <ul className="list-disc list-inside">
                {result.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
