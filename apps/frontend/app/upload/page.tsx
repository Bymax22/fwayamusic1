"use client";

import React, { useState, useCallback, ChangeEvent } from "react";

import Link from "next/link";
import { CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { CheckCircle, Music, Video, Headphones, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useToast } from "@/components/ui/use-toast";

interface UploadMetadata {
  title: string;
  description: string;
  genre: string;
  type: "AUDIO" | "VIDEO" | "PODCAST" | "LIVE_STREAM";
  isPremium: boolean;
  isExplicit: boolean;
}

const validAudioTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/aac", "audio/flac"];
const validVideoTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const maxFileSize = 100 * 1024 * 1024; // 100MB

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [metadata, setMetadata] = useState<UploadMetadata>({
    title: "",
    description: "",
    genre: "other",
    type: "AUDIO",
    isPremium: false,
    isExplicit: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success] = useState(false);

  const { toast } = useToast();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (e.target.files?.length) {
        const selectedFile = e.target.files[0];
        const validTypes = metadata.type === "VIDEO" ? validVideoTypes : validAudioTypes;

        if (!validTypes.includes(selectedFile.type)) {
          setError(`Please upload a valid ${metadata.type.toLowerCase()} file`);
          return;
        }

        if (selectedFile.size > maxFileSize) {
          setError(`File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`);
          return;
        }

        setFile(selectedFile);
        if (!metadata.title) {
          setMetadata((prev) => ({
            ...prev,
            title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          }));
        }
      }
    },
    [metadata.type, metadata.title]
  );

const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadWidgetInfo> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "bymaxdev1");
    formData.append("resource_type", metadata.type === "VIDEO" ? "video" : "auto");

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.statusText || "Cloudinary upload failed"));
        }
      }
    };

    xhr.open("POST", "https://api.cloudinary.com/v1_1/dayn5vifn/upload");
    xhr.send(formData);
  });
};

// Reference it to avoid unused warning
void uploadToCloudinary;

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 1. Create FormData for Cloudinary upload
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("upload_preset", "bymaxdev1");
      cloudinaryFormData.append("resource_type", metadata.type === "VIDEO" ? "video" : "auto");

      // 2. Upload to Cloudinary using fetch instead of XMLHttpRequest
      const cloudinaryResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dayn5vifn/upload",
        {
          method: "POST",
          body: cloudinaryFormData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error("Cloudinary upload failed");
      }

      const cloudinaryData = await cloudinaryResponse.json();

      // 3. Save to your backend
      const backendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            url: cloudinaryData.secure_url,
            format: cloudinaryData.format,
            duration: cloudinaryData.duration ? Math.round(Number(cloudinaryData.duration)) : null,
            title: metadata.title,
            description: metadata.description,
            genre: metadata.genre,
            type: metadata.type,
            isPremium: metadata.isPremium,
            isExplicit: metadata.isExplicit,
            originalFilename: file.name,
            fileSize: file.size,
          }),
        }
      );

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || "Failed to save to database");
      }

      const savedMedia = await backendResponse.json();
      
      // 4. Redirect to success page
      window.location.href = `/upload/success?id=${savedMedia.data.id}`;
      
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg ring-1 ring-gray-200/10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600 animate-in fade-in zoom-in-75" />
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Upload Complete!
          </h1>
          <p className="mb-6 text-center text-gray-600">
            Your media is now available in your library.
          </p>

          <div className="flex flex-col space-y-3">
            <Button asChild>
              <Link href="/upload" className="gap-2">
                Upload Another File
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/library" className="gap-2">
                View Your Library
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Upload New Media</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Media Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Media Type *
          </label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={metadata.type === "AUDIO" ? "default" : "outline"}
              onClick={() => setMetadata({...metadata, type: "AUDIO"})}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Music className="h-5 w-5" />
              <span>Audio</span>
            </Button>
            <Button
              variant={metadata.type === "VIDEO" ? "default" : "outline"}
              onClick={() => setMetadata({...metadata, type: "VIDEO"})}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Video className="h-5 w-5" />
              <span>Video</span>
            </Button>
            <Button
              variant={metadata.type === "PODCAST" ? "default" : "outline"}
              onClick={() => setMetadata({...metadata, type: "PODCAST"})}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Headphones className="h-5 w-5" />
              <span>Podcast</span>
            </Button>
            <Button
              variant={metadata.type === "LIVE_STREAM" ? "default" : "outline"}
              onClick={() => setMetadata({...metadata, type: "LIVE_STREAM"})}
              className="flex flex-col items-center gap-2 h-auto py-3"
            >
              <Radio className="h-5 w-5" />
              <span>Live</span>
            </Button>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {metadata.type === "VIDEO" ? "Video File" : "Audio File"} *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="media-upload"
              accept={metadata.type === "VIDEO" ? "video/*" : "audio/*"}
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="media-upload"
              className={`cursor-pointer flex flex-col items-center justify-center gap-2 ${uploading ? "opacity-50" : ""}`}
            >
              {metadata.type === "VIDEO" ? (
                <Video className="h-8 w-8 text-gray-400" />
              ) : (
                <Music className="h-8 w-8 text-gray-400" />
              )}
              {file ? (
                <div className="text-center">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600">
                    Drag and drop or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    {metadata.type === "VIDEO" 
                      ? "Supports MP4, MOV, AVI (Max 100MB)"
                      : "Supports MP3, WAV, AAC, FLAC (Max 100MB)"}
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-right">
              {uploadProgress}% Complete
            </p>
          </div>
        )}

        {/* Metadata Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setMetadata({ ...metadata, title: e.target.value })
              }
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={metadata.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setMetadata({ ...metadata, description: e.target.value })
              }
              rows={3}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              value={metadata.genre}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                setMetadata({...metadata, genre: e.target.value})
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="hiphop">Hip Hop</option>
              <option value="electronic">Electronic</option>
              <option value="classical">Classical</option>
              <option value="jazz">Jazz</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPremium"
                checked={metadata.isPremium}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMetadata({ ...metadata, isPremium: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPremium" className="text-sm font-medium text-gray-700">
                Premium Content
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isExplicit"
                checked={metadata.isExplicit}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMetadata({ ...metadata, isExplicit: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isExplicit" className="text-sm font-medium text-gray-700">
                Explicit Content
              </label>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={uploading || !file || !metadata.title}
          className="w-full py-6 text-lg"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </span>
          ) : (
            "Upload Media"
          )}
        </Button>
      </div>
    </div>
  );
}