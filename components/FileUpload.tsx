
import React, { useState, useRef } from 'react';
import { UploadIcon, CheckIcon } from './icons';

interface FileUploadProps {
  id: string;
  label: string;
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, label, onFileSelect }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label htmlFor={id} className="block text-lg font-semibold text-slate-600 mb-2">{label}</label>
      <input
        type="file"
        id={id}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <button
        onClick={handleButtonClick}
        className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${
          fileName 
            ? 'border-green-500 bg-green-50 text-green-700' 
            : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-500'
        }`}
      >
        {fileName ? <CheckIcon /> : <UploadIcon />}
        <span className="mt-2 text-sm font-medium truncate max-w-full">
          {fileName || 'Clique para escolher um arquivo'}
        </span>
      </button>
    </div>
  );
};
