import { dataView, list, resolver, type Entity } from '@nkzw/fate/server';
import type {
  Comment as PrismaComment,
  Post as PrismaPost,
  Profile as PrismaProfile,
  ChatRoom as PrismaChatRoom,
  ChatRoomMessage as PrismaChatRoomMessage,
  User as PrismaUser,
} from '../prisma/prisma-client/client.ts';

export type UserItem = PrismaUser;

export type ChatRoomItem = PrismaChatRoom & {
  _count?: { adminsInChatRoom: number; chatRoomMessages: number; usersInChatRoom: number };
  adminsInChatRoom: Array<PrismaUser>;
  chatRoomMessages: Array<PrismaChatRoomMessage>;
  usersInChatRoom: Array<PrismaUser>;
};

export type ChatRoomMessageItem = PrismaChatRoomMessage & {
  author: PrismaUser;
  chatRoom: PrismaChatRoom;
};

export type CommentItem = PrismaComment & {
  author?: PrismaUser | null;
  post?: PrismaPost | null;
};

export type PostItem = PrismaPost & {
  _count?: { comments: number };
  author?: PrismaUser | null;
  comments?: Array<CommentItem>;
};

export type ProfileItem = PrismaProfile & {
  user?: PrismaUser | null;
};

const baseProfile = {
  bio: true,
  github: true,
  id: true,
  linkedin: true,
  location: true,
  private: true,
  twitter: true,
  userId: true,
  website: true,
} as const;

export const profileDataView = dataView<ProfileItem>('Profile')({
  ...baseProfile,
  user: dataView<PrismaUser>('User')({
    id: true,
    name: true,
    username: true,
  }),
});

export const userDataView = dataView<PrismaUser>('User')({
  id: true,
  name: true,
  profile: profileDataView,
  username: true,
});

const basePost = {
  author: userDataView,
  commentCount: resolver<PostItem>({
    resolve: ({ item }) => item._count?.comments ?? 0,
    select: () => ({
      _count: { select: { comments: true } },
    }),
  }),
  content: true,
  id: true,
  likes: true,
  title: true,
} as const;

const postSummaryDataView = dataView<PostItem>('Post')({
  ...basePost,
});

export const commentDataView = dataView<CommentItem>('Comment')({
  author: userDataView,
  content: true,
  id: true,
  post: postSummaryDataView,
});

export const postDataView = dataView<PostItem>('Post')({
  ...basePost,
  comments: list(commentDataView),
});

const baseChatRoom = {
  createdAt: true,
  description: true,
  id: true,
  name: true,
  updatedAt: true,
} as const;

export const chatRoomMessageDataView = dataView<ChatRoomMessageItem>('ChatRoomMessage')({
  author: userDataView,
  chatRoom: dataView<PrismaChatRoom>('ChatRoom')({
    ...baseChatRoom,
  }),
  content: true,
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const chatRoomDataView = dataView<ChatRoomItem>('ChatRoom')({
  ...baseChatRoom,
  adminsInChatRoom: list(userDataView),
  chatRoomMessages: list(chatRoomMessageDataView),
  usersInChatRoom: list(userDataView),
});

export type User = Entity<typeof userDataView, 'User'>;
export type Comment = Entity<
  typeof commentDataView,
  'Comment',
  {
    author: User;
    post: Post;
  }
>;
export type Post = Entity<
  typeof postDataView,
  'Post',
  {
    author: User;
    comments: Array<Comment>;
  }
>;

export type Profile = Entity<
  typeof profileDataView,
  'Profile',
  {
    user: User;
  }
>;

export type ChatRoom = Entity<
  typeof chatRoomDataView,
  'ChatRoom',
  {
    adminsInChatRoom: Array<User>;
    chatRoomMessages: Array<ChatRoomMessage>;
    usersInChatRoom: Array<User>;
  }
>;

export type ChatRoomMessage = Entity<
  typeof chatRoomMessageDataView,
  'ChatRoomMessage',
  {
    author: User;
    chatRoom: ChatRoom;
  }
>;

export const Lists = {
  chatRoomMessages: chatRoomMessageDataView,
  chatRoomMessageSearch: { procedure: 'search', view: chatRoomMessageDataView },
  chatRooms: chatRoomDataView,
  commentSearch: { procedure: 'search', view: commentDataView },
  posts: postDataView,
  profileByUserId: { procedure: 'byUserId', view: profileDataView },
};
