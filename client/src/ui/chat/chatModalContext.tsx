import { createContext, useState } from 'react';

export const ChatModalContext = createContext<{
  selectedChatRoomId?: string;
  setSelectedChatRoomId: (chatRoomId: string) => void;
} | null>(null);

export const ChatModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | undefined>(undefined);
  return (
    <ChatModalContext.Provider value={{ selectedChatRoomId, setSelectedChatRoomId }}>
      {children}
    </ChatModalContext.Provider>
  );
};
