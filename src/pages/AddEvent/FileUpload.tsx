import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../contexts/VenueContext';
import { EventFileService, type FileUploadProgress } from '../../services/eventFileService';

interface FileUploadProps {
  onBack: () => void;
  onComplete: () => void;
}

const FileUpload = ({ onBack, onComplete }: FileUploadProps) => {
  const { user } = useAuth();
  const { currentVenue, userVenues } = useVenue();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null); // Clear any previous errors
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setUploadError('Please select a file and ensure you are logged in.');
      return;
    }

    // Determine which venue to use
    let venueId: string;
    if (currentVenue) {
      venueId = currentVenue.id;
    } else if (userVenues && userVenues.length > 0) {
      venueId = userVenues[0].id; // Use first venue if no specific venue selected
    } else {
      setUploadError('No venue found. Please add a venue first.');
      return;
    }

    // Validate file before upload
    const validation = EventFileService.validateFile(selectedFile);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(null);
    
    try {
      const result = await EventFileService.uploadEventFile(
        user.id,
        venueId,
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (result.success) {
        setUploadedFileId(result.fileId || null);
        setIsUploaded(true);
        console.log('File uploaded successfully:', result);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('An unexpected error occurred during upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  if (isUploaded) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          File Uploaded Successfully!
        </h3>
        
        <p className="text-gray-600 mb-6">
          Thank you for uploading your event file! Your file has been successfully stored and our team will process it manually. You'll be notified once the processing is complete.
        </p>
        
        {uploadedFileId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>File ID:</strong> {uploadedFileId}
            </p>
            <p className="text-sm text-gray-600">
              <strong>File:</strong> {selectedFile?.name}
            </p>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Our team will review your file within 24-48 hours</li>
            <li>• We'll contact you if we need any clarification</li>
            <li>• Your event will be added to the database once processed</li>
            <li>• You'll receive an email confirmation when complete</li>
          </ul>
        </div>
        
        <button
          onClick={onComplete}
          className="btn-primary"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Upload Event File
        </h3>
        <p className="text-gray-600">
          Upload your event data file and our team will process it for you.
        </p>
      </div>

      <div className="card p-8">
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploadError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-accent-300'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            uploadError ? 'bg-red-100' : 'bg-accent-100'
          }`}>
            {uploadError ? (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          
          <h4 className={`text-lg font-semibold mb-2 ${uploadError ? 'text-red-900' : 'text-gray-900'}`}>
            {uploadError ? 'Upload Error' : (selectedFile ? selectedFile.name : 'Choose a file or drag it here')}
          </h4>
          
          {uploadError ? (
            <p className="text-red-600 mb-4">{uploadError}</p>
          ) : (
            <p className="text-gray-600 mb-4">
              Supported formats: CSV, Excel (.xlsx, .xls), PDF
            </p>
          )}
          
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            className="btn-secondary cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Select File
          </label>
        </div>

        {selectedFile && (
          <div className="mt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Upload Progress */}
            {isUploading && uploadProgress && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Uploading...</span>
                  <span className="text-sm text-blue-700">{uploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  {(uploadProgress.loaded / 1024 / 1024).toFixed(2)} MB of {(uploadProgress.total / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">File Requirements</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Maximum file size: 10MB</li>
            <li>• Include event date, name, and venue information</li>
            <li>• Artist lineup and performance details</li>
            <li>• Ticket sales, pricing, and bar sales data (if available)</li>
          </ul>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {uploadProgress ? `Uploading... ${uploadProgress.percentage}%` : 'Uploading...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploadError ? 'Try Again' : 'Upload File'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload; 