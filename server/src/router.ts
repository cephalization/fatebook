import { router } from './trpc/init.ts';
import { chatRoomRouter } from './trpc/routers/chatRoom.ts';
import { chatRoomMessageRouter } from './trpc/routers/chatRoomMessage.ts';
import { commentRouter } from './trpc/routers/comment.ts';
import { postRouter } from './trpc/routers/post.ts';
import { profileRouter } from './trpc/routers/profile.ts';
import { userRouter } from './trpc/routers/user.ts';

export const appRouter = router({
  // cannot use camelCase for router keys because the fate generate CLI gets angry
  chatroom: chatRoomRouter,
  // cannot use camelCase for router keys because the fate generate CLI gets angry
  chatroommessage: chatRoomMessageRouter,
  comment: commentRouter,
  post: postRouter,
  profile: profileRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export * from './trpc/views.ts';
