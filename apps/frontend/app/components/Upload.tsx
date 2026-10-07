'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedUrl(res.data.secure_url);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
    setUploading(false);
  };

  return (
    <div className="p-4 border rounded-lg shadow max-w-md mx-auto mt-10">
      <h2 className="text-xl mb-4 font-semibold">Upload Your Song</h2>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-purple/85 text-white rounded hover:bg-purple/90"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploadedUrl && (
        <div className="mt-4">
          <p className="text-purple/85">Uploaded successfully!</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-purple/75 underline">
            View file
          </a>
        </div>
      )}
    </div>
  );
}




