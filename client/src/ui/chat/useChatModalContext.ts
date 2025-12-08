import { use } from 'react';
import { ChatModalContext } from './chatModalContext.tsx';

export const useChatModalContext = () => {
  const context = use(ChatModalContext);
  if (!context) {
    throw new Error('useChatModalContext must be used within a ChatModalProvider');
  }
  return context;
};
