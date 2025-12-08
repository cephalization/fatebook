import type { ChatRoom as ChatRoomType } from '@app/server/src/router.ts';
import { fbs } from 'fbtee';
import { ChevronLeftIcon, Loader2Icon, MessagesSquareIcon, PlusIcon } from 'lucide-react';
import { FormEvent, startTransition, Suspense, useActionState, useState } from 'react';
import { DialogTrigger } from 'react-aria-components';
import { ErrorBoundary } from 'react-error-boundary';
import { ConnectionRef, useListView, useRequest, useView, view, ViewRef } from 'react-fate';
import { useFateClient } from 'react-fate';
import cx from '../../lib/cx.tsx';
import AuthClient from '../../user/AuthClient.tsx';
import { Button } from '../Button.tsx';
import Card from '../Card.tsx';
import Error from '../Error.tsx';
import Input from '../Input.tsx';
import Popover from '../Popover.tsx';
import { ChatModalProvider } from './chatModalContext.tsx';
import { ChatRoom } from './ChatRoom.tsx';
import { useChatModalContext } from './useChatModalContext.ts';

type ChatModalProps = {
  className?: string;
};

export const ChatModal = ({ className }: ChatModalProps) => {
  return (
    <ChatModalProvider>
      <DialogTrigger>
        <Button className={className} variant="secondary">
          <MessagesSquareIcon />
        </Button>
        <Popover>
          <Card className="h-96 w-3xl backdrop-blur-sm">
            <ErrorBoundary fallbackRender={({ error }) => <Error error={error} />}>
              <Suspense fallback={<Loader />}>
                <ChatModalContent />
              </Suspense>
            </ErrorBoundary>
          </Card>
        </Popover>
      </DialogTrigger>
    </ChatModalProvider>
  );
};

const Loader = () => (
  <div className="flex items-center justify-center">
    <Loader2Icon className="animate-spin" />
  </div>
);

const ChatRoomView = view<ChatRoomType>()({
  description: true,
  id: true,
  name: true,
});

const ChatRoomConnectionView = {
  args: { first: 10 },
  items: {
    node: ChatRoomView,
  },
} as const;

const ChatModalContent = () => {
  const { selectedChatRoomId } = useChatModalContext();
  const [creatingChatRoom, setCreatingChatRoom] = useState(false);
  const { chatRooms } = useRequest({
    chatRooms: {
      list: ChatRoomConnectionView,
      type: 'ChatRoom',
    },
  });
  if (creatingChatRoom) {
    return (
      <CreateChatRoomForm
        onCancel={() => setCreatingChatRoom(false)}
        onSuccess={() => setCreatingChatRoom(false)}
      />
    );
  }
  return (
    <div className="flex flex-row flex-nowrap gap-2 h-full">
      <div className="basis-2/5 h-full border-r border-border flex flex-col gap-2 p-2 relative">
        <div className="flex justify-end absolute top-2 right-2">
          <Button action={() => setCreatingChatRoom(true)} variant="ghost">
            <PlusIcon />
          </Button>
        </div>
        <ChatRoomList chatRooms={chatRooms} />
      </div>
      <div className="basis-3/5 flex flex-1 items-center justify-center">
        <Suspense fallback={<Loader />}>
          {!selectedChatRoomId ? (
            <fbt desc="Select a chat room">Select a chat room</fbt>
          ) : (
            <ChatRoom chatRoomId={selectedChatRoomId} />
          )}
        </Suspense>
      </div>
    </div>
  );
};

type ChatRoomListProps = {
  chatRooms: ConnectionRef<'ChatRoom'>;
  className?: string;
};

const ChatRoomList = ({ chatRooms: chatRoomsRef, className }: ChatRoomListProps) => {
  const [chatRooms, loadNext] = useListView(ChatRoomConnectionView, chatRoomsRef);
  if (chatRooms.length === 0) {
    return (
      <div className={cx('flex flex-1 items-center justify-center text-gray-400', className)}>
        <fbt desc="No chat rooms found">No chat rooms found</fbt>
      </div>
    );
  }
  return (
    <ul className={className}>
      {chatRooms.map(({ node: chatRoom }) => (
        <ChatRoomItem chatRoom={chatRoom} key={chatRoom.id} />
      ))}
      {loadNext ? (
        <li>
          <Button onClick={loadNext} variant="ghost">
            <fbt desc="Load more button">Load more</fbt>
          </Button>
        </li>
      ) : null}
    </ul>
  );
};

const ChatRoomItem = ({ chatRoom: chatRoomRef }: { chatRoom: ViewRef<'ChatRoom'> }) => {
  const chatRoom = useView(ChatRoomView, chatRoomRef);
  const { selectedChatRoomId, setSelectedChatRoomId } = useChatModalContext();
  return (
    <li key={chatRoom.id}>
      <Button
        isDisabled={selectedChatRoomId === chatRoom.id}
        onClick={() => setSelectedChatRoomId(chatRoom.id)}
        variant="ghost"
      >
        {chatRoom.name}
      </Button>
    </li>
  );
};

const CreateChatRoomForm = ({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const fate = useFateClient();
  const { data: session } = AuthClient.useSession();
  const thisUserId = session?.user?.id;
  const [chatRoomName, setChatRoomName] = useState('');
  const [chatRoomDescription, setChatRoomDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [, handleCreateChatRoom, createChatRoomIsPending] = useActionState(async () => {
    const result = await fate.mutations.chatRoom.create({
      input: { description: chatRoomDescription, isPrivate, name: chatRoomName },
      optimistic: {
        adminsInChatRoom: [
          {
            id: thisUserId,
          },
        ],
        author: { id: thisUserId },
        description: chatRoomDescription,
        id: `optimistic:${Date.now().toString(36)}`,
        isPrivate,
        name: chatRoomName,
        usersInChatRoom: [
          {
            id: thisUserId,
          },
        ],
      },
      view: view<ChatRoomType>()({
        ...ChatRoomView,
      }),
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    onSuccess();

    return result;
  }, null);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => handleCreateChatRoom());
  };
  return (
    <form className="h-full" onSubmit={onSubmit}>
      <fieldset className="flex flex-col gap-4 h-full" disabled={createChatRoomIsPending}>
        <div className="flex gap-2 items-center">
          <Button onClick={onCancel} variant="ghost">
            <ChevronLeftIcon />
          </Button>
          <h1 className="text-2xl font-bold">
            <fbt desc="Create chat room title">Create chat room</fbt>
          </h1>
        </div>
        <label className="flex flex-col gap-2 w-full">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <fbt desc="Chat room name label">name</fbt>
          </span>
          <Input
            className="w-full"
            onChange={(e) => setChatRoomName(e.target.value)}
            placeholder={fbs('Enter chat room name', 'Placeholder text for chat room name input')}
            value={chatRoomName}
          />
        </label>
        <label className="flex flex-col gap-2 w-full">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <fbt desc="Chat room description label">description</fbt>
          </span>
          <Input
            className="w-full"
            onChange={(e) => setChatRoomDescription(e.target.value)}
            placeholder={fbs(
              'Enter chat room description',
              'Placeholder text for chat room description input',
            )}
            value={chatRoomDescription}
          />
        </label>
        <label className="flex flex-col gap-2 w-fit">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <fbt desc="Chat room private label">private</fbt>
          </span>
          <input
            checked={isPrivate}
            id="chat-room-private"
            onChange={(e) => setIsPrivate(e.target.checked)}
            type="checkbox"
          />
        </label>
        {error ? <p className="text-destructive text-sm">{error.message}</p> : null}
        <div className="flex justify-end mt-auto">
          <Button isPending={createChatRoomIsPending} type="submit" variant="secondary">
            <fbt desc="Create chat room button">Create chat room</fbt>
          </Button>
        </div>
      </fieldset>
    </form>
  );
};
