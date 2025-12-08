import { connectionArgs, createResolver } from '@nkzw/fate/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type {
  ChatRoomMessageFindManyArgs,
  ChatRoomMessageSelect,
  ChatRoomWhereInput,
} from '../../prisma/prisma-client/models.ts';
import { createConnectionProcedure } from '../connection.ts';
import { procedure, router } from '../init.ts';
import { chatRoomMessageDataView, type ChatRoomMessageItem } from '../views.ts';

const getChatRoomPrivacyClause = (thisUserId?: string) => {
  if (!thisUserId) {
    return { private: false };
  }
  return {
    OR: [
      { private: false },
      { adminsInChatRoom: { some: { userId: thisUserId } } },
      { private: true, usersInChatRoom: { some: { userId: thisUserId } } },
    ],
  };
};

const mutateChatRoomMessagePrivacyClause = (thisUserId: string) => {
  return {
    OR: [{ adminsInChatRoom: { some: { userId: thisUserId } } }, { authorId: thisUserId }],
  };
};

const getChatRoomMessageSelection = (select: Record<string, unknown>) => {
  return {
    ...select,
    ...((select.chatRoom as { select?: Record<string, unknown> })
      ? {
          chatRoom: {
            select: {
              ...(select.chatRoom as { select?: Record<string, unknown> }).select,
            },
          },
        }
      : {}),
  } as ChatRoomMessageSelect;
};

export const chatRoomMessageRouter = router({
  add: procedure
    .input(
      z.object({
        args: connectionArgs,
        chatRoomId: z.string().min(1, 'Chat room id is required'),
        content: z.string().min(1, 'Content is required'),
        select: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.sessionUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to add a chat room message',
        });
      }

      const thisUserId = ctx.sessionUser.id;

      const chatRoom = await ctx.prisma.chatRoom.findUnique({
        where: {
          id: input.chatRoomId,
          ...getChatRoomPrivacyClause(thisUserId),
        },
      });

      if (!chatRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room not found',
        });
      }

      const { resolve, select } = createResolver({
        ...input,
        ctx,
        view: chatRoomMessageDataView,
      });

      return resolve(
        await ctx.prisma.chatRoomMessage.create({
          data: {
            authorId: ctx.sessionUser.id,
            chatRoomId: input.chatRoomId,
            content: input.content,
          },
          select: getChatRoomMessageSelection(select),
        }),
      ) as Promise<ChatRoomMessageItem & { chatRoom?: { chatRoomMessageCount: number } }>;
    }),
  byId: procedure
    .input(
      z.object({
        args: connectionArgs,
        ids: z.array(z.string().min(1)).nonempty(),
        select: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { resolveMany, select } = createResolver({
        ...input,
        ctx,
        view: chatRoomMessageDataView,
      });

      const thisUserId = ctx.sessionUser?.id;

      const chatRoomMessages = await ctx.prisma.chatRoomMessage.findMany({
        select,
        where: {
          chatRoom: {
            ...getChatRoomPrivacyClause(thisUserId),
          },
          id: { in: input.ids },
        },
      } as ChatRoomMessageFindManyArgs);

      if (chatRoomMessages.length !== input.ids.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'One or more chat room messages not found. Do you have access to all chat messages requested?',
        });
      }

      return await resolveMany(chatRoomMessages);
    }),
  delete: procedure
    .input(
      z.object({
        args: connectionArgs.optional(),
        id: z.string().min(1, 'Chat room message id is required'),
        select: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const thisUserId = ctx.sessionUser?.id;
      if (!thisUserId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete a chat room message',
        });
      }
      const chatRoomMessage = await ctx.prisma.chatRoomMessage.findUnique({
        select: { authorId: true },
        where: { id: input.id, ...mutateChatRoomMessagePrivacyClause(thisUserId) },
      });

      if (!chatRoomMessage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room message not found',
        });
      }

      const { resolve, select } = createResolver({
        ...input,
        ctx,
        view: chatRoomMessageDataView,
      });

      let result = (await ctx.prisma.chatRoomMessage.delete({
        select: getChatRoomMessageSelection(select),
        where: { id: input.id, ...mutateChatRoomMessagePrivacyClause(thisUserId) },
      })) as ChatRoomMessageItem & { chatRoom?: { _count?: { chatRoomMessages: number } } };

      if (result.chatRoom?._count) {
        result = {
          ...result,
          chatRoom: {
            ...result.chatRoom,
            _count: {
              chatRoomMessages: result.chatRoom._count.chatRoomMessages - 1,
            },
          },
        };
      }

      return resolve(result) as Promise<
        ChatRoomMessageItem & { chatRoom?: { chatRoomMessageCount: number } }
      >;
    }),
  edit: procedure
    .input(
      z.object({
        content: z.string().min(1, 'Content is required'),
        id: z.string().min(1, 'Chat room message id is required'),
        select: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const thisUserId = ctx.sessionUser?.id;
      if (!thisUserId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to edit a chat room message',
        });
      }

      const chatRoomMessage = await ctx.prisma.chatRoomMessage.findUnique({
        select: { authorId: true },
        where: { id: input.id, ...mutateChatRoomMessagePrivacyClause(thisUserId) },
      });

      if (!chatRoomMessage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room message not found',
        });
      }

      const { resolve, select } = createResolver({
        ...input,
        ctx,
        view: chatRoomMessageDataView,
      });

      return resolve(
        await ctx.prisma.chatRoomMessage.update({
          data: { content: input.content },
          select: getChatRoomMessageSelection(select),
          where: { id: input.id, ...mutateChatRoomMessagePrivacyClause(thisUserId) },
        }),
      );
    }),
  list: createConnectionProcedure({
    query: async ({ ctx, cursor, direction, input, skip, take }) => {
      const { resolveMany, select } = createResolver({
        ...input,
        ctx,
        view: chatRoomMessageDataView,
      });
      const findOptions: ChatRoomMessageFindManyArgs = {
        orderBy: { createdAt: 'desc' },
        select,
        take: direction === 'forward' ? take : -take,
        where: {
          chatRoom: {
            ...getChatRoomPrivacyClause(ctx.sessionUser?.id),
          },
        },
      };

      if (cursor) {
        findOptions.cursor = { id: cursor };
        findOptions.skip = skip;
      }

      const items = await ctx.prisma.chatRoomMessage.findMany({
        ...findOptions,
        where: {
          ...findOptions.where,
          chatRoom: {
            ...(findOptions.where?.chatRoom as ChatRoomWhereInput | undefined),
            ...getChatRoomPrivacyClause(ctx.sessionUser?.id),
          },
        },
      });
      return resolveMany(direction === 'forward' ? items : items.reverse());
    },
  }),
  search: createConnectionProcedure({
    input: z.object({
      query: z.string().min(1, 'Search query is required'),
    }),
    query: async ({ ctx, cursor, direction, input, skip, take }) => {
      const query = input.args?.query?.trim();
      if (!query?.length) {
        return [];
      }

      if (query.length > 1) {
        // Artificial slowdown.
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const { resolveMany, select } = createResolver({
        ...input,
        ctx,
        view: chatRoomMessageDataView,
      });
      const findOptions: ChatRoomMessageFindManyArgs = {
        orderBy: { createdAt: 'desc' },
        select,
        take: direction === 'forward' ? take : -take,
        where: {
          chatRoom: {
            ...getChatRoomPrivacyClause(ctx.sessionUser?.id),
          },
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
      };

      if (cursor) {
        findOptions.cursor = { id: cursor };
        findOptions.skip = skip;
      }

      const items = await ctx.prisma.chatRoomMessage.findMany(findOptions);
      return resolveMany(direction === 'forward' ? items : items.reverse());
    },
  }),
});
