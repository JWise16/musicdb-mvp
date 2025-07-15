import { useEffect, useRef, useState } from 'react';
import '@n8n/chat/style.css';
import { createChat, type ChatConfig, type ChatInstance } from '@n8n/chat';

interface N8nChatWidgetProps {
  webhookUrl: string;
  mode?: 'window' | 'fullscreen';
  allowFileUploads?: boolean;
  className?: string;
}

const N8nChatWidget = ({ 
  webhookUrl, 
  mode = 'fullscreen', 
  allowFileUploads = false,
  className = ''
}: N8nChatWidgetProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<ChatInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    const initializeChat = async () => {
      // Wait for container to be available with retry mechanism
      let retryCount = 0;
      const maxRetries = 10;
      
      while (!chatContainerRef.current && retryCount < maxRetries) {
        if (isDevelopment) {
          console.log(`⏳ Waiting for container (attempt ${retryCount + 1}/${maxRetries})`);
          // Additional DOM debugging
          const elementById = document.getElementById('n8n-chat-container');
          console.log('Element by ID:', elementById);
          console.log('Ref current:', chatContainerRef.current);
          console.log('Document ready state:', document.readyState);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }

      const debug: Record<string, any> = {
        timestamp: new Date().toISOString(),
        webhookUrl: webhookUrl || 'NOT_SET',
        mode,
        allowFileUploads,
        containerExists: !!chatContainerRef.current,
        containerRetries: retryCount,
        isDevelopment
      };

      setDebugInfo(debug);

      if (isDevelopment) {
        console.group('🔧 N8n Chat Widget Debug Info');
        console.log('Environment Variables:', {
          VITE_PUBLIC_N8N_WEBHOOK_URL: import.meta.env.VITE_PUBLIC_N8N_WEBHOOK_URL,
          DEV: import.meta.env.DEV,
          MODE: import.meta.env.MODE
        });
        console.log('Debug Info:', debug);
        console.groupEnd();
      }

      if (!webhookUrl) {
        const errorMsg = 'Webhook URL is missing. Please check your VITE_PUBLIC_N8N_WEBHOOK_URL environment variable.';
        setError(errorMsg);
        setIsLoading(false);
        if (isDevelopment) {
          console.error('❌ N8n Chat Error:', errorMsg);
          console.log('💡 Expected format: https://your-n8n-instance.com/webhook/your-webhook-id');
        }
        return;
      }

      // Validate webhook URL format
      try {
        const url = new URL(webhookUrl);
        if (!url.pathname.includes('/webhook/')) {
          throw new Error('Invalid webhook URL format');
        }
        debug.webhookValidation = 'valid';
      } catch (urlError) {
        const errorMsg = `Invalid webhook URL format: ${webhookUrl}`;
        setError(errorMsg);
        setIsLoading(false);
        if (isDevelopment) {
          console.error('❌ Webhook URL Validation Error:', urlError);
          console.log('💡 Expected format: https://your-n8n-instance.com/webhook/your-webhook-id');
        }
        return;
      }

      if (!chatContainerRef.current) {
        const errorMsg = 'Chat container element not found after retries. This might be a DOM mounting issue.';
        setError(errorMsg);
        setIsLoading(false);
        if (isDevelopment) {
          console.error('❌ Container Error:', errorMsg);
          console.log('💡 Try refreshing the page or check if the component is properly mounted');
        }
        return;
      }

      try {
        // Clean up previous chat instance
        if (chatInstanceRef.current?.destroy) {
          if (isDevelopment) {
            console.log('🧹 Cleaning up previous chat instance');
          }
          chatInstanceRef.current.destroy();
        }

        const config: ChatConfig = {
          webhookUrl,
          target: '#n8n-chat-container',
          mode,
          loadPreviousSession: true,
          showWelcomeScreen: true,
          allowFileUploads,
          defaultLanguage: 'en',
          initialMessages: [
            'Hi there! 👋',
            'I\'m here to help you find the perfect artists for your venue. What kind of talent are you looking for?'
          ],
          i18n: {
            en: {
              title: 'Find Talent Assistant',
              subtitle: 'Discover artists that match your venue\'s style and needs',
              footer: 'Powered by MusicDB',
              getStarted: 'Start Conversation',
              inputPlaceholder: 'Describe the type of artist or performance you\'re looking for...',
            },
          },
          webhookConfig: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        };

        if (isDevelopment) {
          console.log('⚙️ Creating chat with config:', config);
        }

        // Test webhook connectivity before creating chat
        try {
          const testResponse = await fetch(webhookUrl, {
            method: 'OPTIONS',
            headers: {
              'Origin': window.location.origin
            }
          });
          
          debug.corsTest = {
            status: testResponse.status,
            ok: testResponse.ok,
            headers: Object.fromEntries(testResponse.headers.entries())
          };

          if (isDevelopment) {
            console.log('🌐 CORS Test Response:', debug.corsTest);
          }
        } catch (corsError) {
          debug.corsError = corsError;
          if (isDevelopment) {
            console.warn('⚠️ CORS test failed (this might be normal):', corsError);
          }
        }

        // Create new chat instance
        chatInstanceRef.current = createChat(config);
        
        if (isDevelopment) {
          console.log('✅ Chat instance created successfully');
        }

        setIsLoading(false);
        setError(null);
        debug.success = true;
        setDebugInfo(debug);

      } catch (err: any) {
        debug.error = {
          message: err.message,
          stack: err.stack,
          name: err.name
        };
        setDebugInfo(debug);

        console.error('❌ Failed to initialize n8n chat widget:', err);
        
        let userFriendlyError = 'Failed to load chat interface.';
        
        if (err.message?.includes('CORS')) {
          userFriendlyError = 'Connection blocked by CORS policy. Check your n8n webhook CORS settings.';
        } else if (err.message?.includes('fetch')) {
          userFriendlyError = 'Cannot connect to chat service. Check your webhook URL and network connection.';
        } else if (err.message?.includes('target')) {
          userFriendlyError = 'Chat container not found. Please refresh the page.';
        }

        setError(userFriendlyError);
        setIsLoading(false);

        if (isDevelopment) {
          console.group('🐛 Debugging Information');
          console.log('Error Details:', err);
          console.log('Debug Info:', debug);
          console.log('Suggested fixes:');
          console.log('1. Verify your n8n workflow is active');
          console.log('2. Check CORS settings in n8n Chat Trigger node');
          console.log('3. Ensure webhook URL is correct and accessible');
          console.log('4. Check browser network tab for failed requests');
          console.groupEnd();
        }
      }
    };

    initializeChat();

    return () => {
      if (chatInstanceRef.current?.destroy) {
        chatInstanceRef.current.destroy();
      }
    };
  }, [webhookUrl, mode, allowFileUploads, isDevelopment]);

  return (
    <div className={`w-full h-full ${className} relative`}>
      {/* Always render the chat container */}
      <div 
        id="n8n-chat-container" 
        ref={chatContainerRef} 
        className={`w-full h-full ${(isLoading || error) ? 'invisible' : 'visible'}`}
      />
      
      {/* Overlay for loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat assistant...</p>
          </div>
        </div>
      )}

      {/* Overlay for error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center max-w-2xl p-4">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Unavailable</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            
            {isDevelopment && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">🔧 Development Debug Info:</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div>
                    <strong>Webhook URL:</strong> 
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {debugInfo.webhookUrl || 'NOT_SET'}
                    </code>
                  </div>
                  <div>
                    <strong>Environment:</strong> {import.meta.env.MODE} mode
                  </div>
                  <div>
                    <strong>Container Ready:</strong> {debugInfo.containerExists ? '✅' : '❌'}
                    {debugInfo.containerRetries !== undefined && ` (${debugInfo.containerRetries} retries)`}
                  </div>
                  {debugInfo.error && (
                    <div>
                      <strong>Error Details:</strong>
                      <pre className="mt-1 text-xs bg-red-50 border border-red-200 rounded p-2 overflow-auto">
                        {JSON.stringify(debugInfo.error, null, 2)}
                      </pre>
                    </div>
                  )}
                  {debugInfo.corsTest && (
                    <div>
                      <strong>CORS Test:</strong>
                      <pre className="mt-1 text-xs bg-blue-50 border border-blue-200 rounded p-2 overflow-auto">
                        {JSON.stringify(debugInfo.corsTest, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  💡 Check browser console for more detailed logs
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-150"
              >
                Retry
              </button>
              {isDevelopment && (
                <button 
                  onClick={() => {
                    console.group('🔍 Full Debug Info');
                    console.log('All debug data:', debugInfo);
                    console.log('Environment:', import.meta.env);
                    console.log('Container element:', document.getElementById('n8n-chat-container'));
                    console.log('Ref element:', chatContainerRef.current);
                    console.groupEnd();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                >
                  Log Debug Info
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default N8nChatWidget; 