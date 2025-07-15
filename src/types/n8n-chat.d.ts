declare module '@n8n/chat' {
  export interface ChatConfig {
    webhookUrl: string;
    target?: string;
    mode?: 'window' | 'fullscreen';
    chatInputKey?: string;
    chatSessionKey?: string;
    loadPreviousSession?: boolean;
    metadata?: Record<string, any>;
    showWelcomeScreen?: boolean;
    defaultLanguage?: string;
    initialMessages?: string[];
    allowFileUploads?: boolean;
    allowedFilesMimeTypes?: string;
    i18n?: {
      en: {
        title: string;
        subtitle: string;
        footer: string;
        getStarted: string;
        inputPlaceholder: string;
      };
    };
    webhookConfig?: {
      method: string;
      headers: Record<string, string>;
    };
  }

  export interface ChatInstance {
    destroy?: () => void;
  }

  export function createChat(config: ChatConfig): ChatInstance;
} 