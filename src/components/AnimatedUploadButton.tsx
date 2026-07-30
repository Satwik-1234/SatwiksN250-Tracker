'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './AnimatedUploadButton.module.css';

interface AnimatedUploadButtonProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  selectedFileName?: string | null;
}

export const AnimatedUploadButton: React.FC<AnimatedUploadButtonProps> = ({ 
  onFileSelect, 
  accept = "image/*,.pdf",
  selectedFileName 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFileName) {
      setIsUploading(true);
      // Wait for animation to finish before resetting state (approx 3.5s in CSS)
      const timer = setTimeout(() => {
        // We can keep it checked to show success state
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setIsUploading(false);
    }
  }, [selectedFileName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setIsUploading(true);
      onFileSelect(file);
    }
  };

  return (
    <div className="relative flex justify-center py-4">
      <input 
        type="checkbox" 
        id="upload-check" 
        className={styles.check} 
        checked={isUploading} 
        readOnly 
      />
      <label htmlFor="upload-check" className={styles.upload} onClick={(e) => {
        e.preventDefault();
        fileInputRef.current?.click();
      }}>
        <div className={styles.app}></div>
        <div className={styles.arrow}></div>
        <div className={styles.success}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29.756 29.756">
            <path d="M29.049,5.009L28.19,4.151c-0.943-0.945-2.488-0.945-3.434,0L10.079,18.829L4.998,13.746 c-0.943-0.943-2.488-0.943-3.433,0L0.707,14.606c-0.943,0.945-0.943,2.489,0,3.434l7.654,7.654c0.436,0.438,1.047,0.707,1.716,0.707 c0.671,0,1.28-0.269,1.716-0.707l17.256-17.254C29.992,7.498,29.992,5.953,29.049,5.009z" />
          </svg>
        </div>
      </label>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        onChange={handleFileChange} 
        accept={accept} 
      />
      
      {selectedFileName && (
        <div className="absolute -bottom-2 w-full text-center">
          <p className="text-xs text-emerald-600 font-medium truncate px-4">{selectedFileName}</p>
        </div>
      )}
    </div>
  );
};
