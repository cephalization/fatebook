import type {
  AppRouter,
  ChatRoomMessage,
  ChatRoom as ChatRoomType,
  User,
} from '@app/server/src/router.ts';
import { ConnectionTag } from '@nkzw/fate';
import { createTRPCProxyClient } from '@trpc/client';
import { fbs } from 'fbtee';
import { LucideLock, SendIcon } from 'lucide-react';
import { startTransition, useActionState, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ConnectionRef, useListView, useRequest, useView, view, ViewRef } from 'react-fate';
import { useFateClient } from 'react-fate';
import { createLinks } from '../../lib/createLinks.ts';
import cx from '../../lib/cx.tsx';
import AuthClient from '../../user/AuthClient.tsx';
import { Button } from '../Button.tsx';
import Error from '../Error.tsx';
import Input from '../Input.tsx';

const UserView = view<User>()({
  id: true,
  name: true,
});

const ChatRoomMessageView = view<ChatRoomMessage>()({
  author: UserView,
  content: true,
  id: true,
  updatedAt: true,
  createdAt: true,
});

const ChatRoomMessageConnectionView = {
  args: {},
  items: {
    node: ChatRoomMessageView,
  },
} as const;

export const ChatRoomView = view<ChatRoomType>()({
  chatRoomMessages: ChatRoomMessageConnectionView,
  description: true,
  id: true,
  name: true,
});

export const ChatRoom = ({ chatRoomId }: { chatRoomId: string }) => {
  const { chatRoom: chatRoomRef } = useRequest({
    chatRoom: {
      id: chatRoomId,
      type: 'ChatRoom',
      view: ChatRoomView,
    },
  } as const);
  const chatRoom = useView(ChatRoomView, chatRoomRef);
  return (
    <div className="h-full w-full flex flex-col gap-2">
      <ErrorBoundary fallbackRender={({ error }) => <Error error={error} />}>
        <div className="flex flex-col gap-2 h-full">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-bold">{chatRoom.name}</h1>
            {chatRoom.description && (
              <p className="text-sm text-gray-500">{chatRoom.description}</p>
            )}
          </div>
          <ChatRoomMessages chatRoomId={chatRoomId} chatRoomMessages={chatRoom.chatRoomMessages} />
          <ChatRoomInput chatRoom={chatRoom} />
        </div>
      </ErrorBoundary>
    </div>
  );
};

const ChatRoomInput = ({ chatRoom }: { chatRoom: { id: string } }) => {
  const fate = useFateClient();
  const chatRoomId = chatRoom.id;
  const { data: session } = AuthClient.useSession();
  const thisUserId = session?.user?.id;
  const [message, setMessage] = useState('');
  const [, handleSendMessage] = useActionState(async () => {
    if (!thisUserId) {
      return;
    }
    setMessage('');
    const result = await fate.mutations.chatRoomMessage.add({
      input: { chatRoomId, content: message },
      optimistic: {
        author: {
          id: thisUserId,
          name: session.user.name,
        },
        chatRoom: { id: chatRoomId },
        content: message,
        id: `optimistic:${Date.now().toString(36)}`,
      },
      view: view<ChatRoomMessage>()({
        ...ChatRoomMessageView,
        chatRoom: { chatRoomMessageCount: true },
      }),
    });
    return result;
  }, null);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(() => handleSendMessage());
  };
  if (!thisUserId) {
    return (
      <div className="flex items-center justify-center text-gray-500 gap-4">
        <LucideLock className="size-4" />
        <span>You must be logged in to send messages</span>
      </div>
    );
  }
  return (
    <form className="w-full flex flex-row gap-1" onSubmit={handleSubmit}>
      <Input
        className="w-full"
        onChange={(e) => setMessage(e.target.value)}
        placeholder={fbs('Enter your message...', 'Placeholder text for chat room message input')}
        value={message}
      />
      <Button isDisabled={!message} type="submit">
        <SendIcon className="h-4 w-4" />
      </Button>
    </form>
  );
};

const useChatRoomMessages = ({
  chatRoomId,
  chatRoomMessagesRef,
}: {
  chatRoomId: string;
  chatRoomMessagesRef: ConnectionRef<'ChatRoomMessage'>;
}) => {
  const fate = useFateClient();
  const [chatRoomMessages] = useListView(ChatRoomMessageConnectionView, chatRoomMessagesRef);
  const { data: session } = AuthClient.useSession();
  const userId = session?.user?.id;
  const trpc = useMemo(
    () =>
      createTRPCProxyClient<AppRouter>({
        links: createLinks(userId),
      }),
    [userId],
  );
  const [lastEventId, setLastEventId] = useState<string | null>(() => {
    // @ts-expect-error - TODO: fix this
    const list = fate.store.getListState(chatRoomMessagesRef[ConnectionTag].key);
    const lastItemId = list?.ids?.[list.ids.length - 1];
    const lastItem = lastItemId ? fate.store.read(lastItemId) : null;
    const createdAt = typeof lastItem?.createdAt === 'string' ? lastItem.createdAt : null;
    return createdAt;
  });
  useEffect(() => {
    const subscription = trpc.chatRoomMessage.onChatMessageAdded.subscribe(
      {
        chatRoomId,
        lastEventId,
      },
      {
        onData: ({ data, id }) => {
          if (id === lastEventId) {
            return;
          }
          setLastEventId(data.createdAt);
          fate.store.merge(`ChatRoomMessage:${data.id}`, data, new Set(Object.keys(data)));
          // @ts-expect-error - TODO: fix this
          const list = fate.store.getListState(chatRoomMessagesRef[ConnectionTag].key);
          // @ts-expect-error - TODO: fix this
          fate.store.setList(chatRoomMessagesRef[ConnectionTag].key, {
            ...list,
            ids: [...(list?.ids || []), `ChatRoomMessage:${data.id}`],
          });
        },
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [chatRoomId]);
  return chatRoomMessages;
};

export const ChatRoomMessages = ({
  chatRoomId,
  chatRoomMessages: chatRoomMessagesRef,
}: {
  chatRoomId: string;
  chatRoomMessages: ConnectionRef<'ChatRoomMessage'>;
}) => {
  const chatRoomMessages = useChatRoomMessages({ chatRoomId, chatRoomMessagesRef });
  if (chatRoomMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Start a conversation
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col-reverse overflow-y-auto">
      <ul className="flex flex-col gap-2">
        {chatRoomMessages.map(({ node: chatRoomMessage }) => (
          <ChatRoomMessageItem chatRoomMessage={chatRoomMessage} key={chatRoomMessage.id} />
        ))}
      </ul>
    </div>
  );
};

const ChatRoomMessageItem = ({
  chatRoomMessage: chatRoomMessageRef,
}: {
  chatRoomMessage: ViewRef<'ChatRoomMessage'>;
}) => {
  const chatRoomMessage = useView(ChatRoomMessageView, chatRoomMessageRef);
  const author = useView(UserView, chatRoomMessage.author);
  return (
    <li
      className={cx(chatRoomMessage.id.startsWith('optimistic') && 'opacity-85')}
      key={chatRoomMessage.id}
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-500">{author.name}</p>
        <p className="text-sm">{chatRoomMessage.content}</p>
      </div>
    </li>
  );
};
