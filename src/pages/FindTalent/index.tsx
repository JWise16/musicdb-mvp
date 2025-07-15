import Sidebar from '../../components/layout/Sidebar';
import N8nChatWidget from '../../components/features/talent/N8nChatWidget';

const FindTalent = () => {

  const webhookUrl = import.meta.env.VITE_PUBLIC_N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('VITE_PUBLIC_N8N_WEBHOOK_URL environment variable is not set');
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-4 lg:p-8 overflow-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 min-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8">
            <div className="min-w-0">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">Find Talent</h2>
              <p className="text-gray-600 truncate">
                Discover and connect with talented artists using our AI assistant
              </p>
            </div>
          </div>

          {/* Chat Widget Container */}
          <div className="flex-1 min-h-0">
            <N8nChatWidget 
              webhookUrl={webhookUrl}
              mode="fullscreen"
              allowFileUploads={true}
              className="border border-gray-200 rounded-xl"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindTalent; 