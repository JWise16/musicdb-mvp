interface ReportTypeSelectionProps {
  onSelect: (type: 'manual' | 'upload') => void;
  onBack: () => void;
}

const ReportTypeSelection = ({ onSelect, onBack }: ReportTypeSelectionProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          How would you like to report your event?
        </h3>
        <p className="text-gray-600">
          Choose the method that works best for you to add your event to the database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Manual Option */}
        <div 
          className="card hover:shadow-medium transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-accent-200"
          onClick={() => onSelect('manual')}
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Manual Entry</h4>
            <p className="text-gray-600 mb-4">
              Enter event details step by step through our guided form.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left">
              <li>• Enter event date and details</li>
              <li>• Add artist lineup</li>
              <li>• Input ticket sales and pricing</li>
              <li>• Include bar sales data</li>
            </ul>
          </div>
        </div>

        {/* File Upload Option */}
        <div 
          className="card hover:shadow-medium transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-accent-200"
          onClick={() => onSelect('upload')}
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Upload File</h4>
            <p className="text-gray-600 mb-4">
              Upload a file and our team will process it for you.
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left">
              <li>• Upload CSV, Excel, or PDF</li>
              <li>• Our team will process manually</li>
              <li>• You'll be notified when complete</li>
              <li>• Perfect for bulk data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ReportTypeSelection; 