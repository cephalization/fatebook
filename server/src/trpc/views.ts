import { dataView, list, resolver, type DataViewResult } from '@nkzw/fate/server';
import type {
  Comment as PrismaComment,
  Post as PrismaPost,
  User as PrismaUser,
} from '../prisma/prisma-client/client.ts';

export type CommentItem = PrismaComment & {
  author?: PrismaUser | null;
  post?: PrismaPost | null;
};

export type PostItem = PrismaPost & {
  _count?: { comments: number };
  author?: PrismaUser | null;
  comments?: Array<CommentItem>;
};

export const userDataView = dataView<PrismaUser>('User')({
  id: true,
  name: true,
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

export type User = DataViewResult<typeof userDataView> & {
  __typename: 'User';
};
export type Comment = Omit<DataViewResult<typeof commentDataView>, 'author'> & {
  __typename: 'Comment';
  author: User;
  post: Post;
};
export type Post = Omit<
  DataViewResult<typeof postDataView>,
  'author' | 'category' | 'comments' | 'tags'
> & {
  __typename: 'Post';
  author: User;
  comments: Array<Comment>;
};

export const Lists = {
  commentSearch: { procedure: 'search', view: commentDataView },
  posts: postDataView,
};
