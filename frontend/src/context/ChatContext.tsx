import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatRecipient {
  id: number;
  name: string;
  role?: string;
}

interface ChatContextType {
  isChatOpen: boolean;
  selectedRecipient: ChatRecipient | null;
  openChat: (recipient: ChatRecipient) => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<ChatRecipient | null>(null);

  const openChat = useCallback((recipient: ChatRecipient) => {
    setSelectedRecipient(recipient);
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <ChatContext.Provider value={{ isChatOpen, selectedRecipient, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
