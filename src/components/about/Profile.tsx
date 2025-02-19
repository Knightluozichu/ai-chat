import { useState } from 'react';
import { FileNavigation } from './FileNavigation';
import { FilePreview } from './FilePreview';

export const Profile = () => {
  const defaultFile = '/src/data/profile/resume.md';
  const [selectedFile, setSelectedFile] = useState(defaultFile);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <FileNavigation onFileSelect={setSelectedFile} defaultFile={selectedFile} />
        </div>
        <div className="col-span-9">
          <FilePreview filePath={selectedFile} />
        </div>
      </div>
    </div>
  );
};