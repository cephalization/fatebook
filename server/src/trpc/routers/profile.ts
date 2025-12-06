import { connectionArgs, createResolver } from '@nkzw/fate/server';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type {
  ProfileFindManyArgs,
  ProfileFindUniqueArgs,
  ProfileUpsertArgs,
} from '../../prisma/prisma-client/models.ts';
import { createConnectionProcedure } from '../connection.ts';
import { procedure, router } from '../init.ts';
import { profileDataView } from '../views.ts';

export const profileRouter = router({
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
        view: profileDataView,
      });

      const profiles = await ctx.prisma.profile.findMany({
        select,
        where: { id: { in: input.ids } },
      });

      if (profiles.length !== input.ids.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more profiles not found',
        });
      }

      for (const profile of profiles) {
        if (profile.private && ctx.sessionUser?.id !== profile.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'One or more profiles are private',
          });
        }
      }

      return resolveMany(profiles);
    }),
  byUserId: createConnectionProcedure({
    input: z.object({
      userId: z.string().min(1, 'User ID is required'),
    }),
    query: async ({ ctx, cursor, direction, input, skip, take }) => {
      if (!input.args?.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        });
      }

      const profile = await ctx.prisma.profile.findUnique({
        select: { private: true, userId: true },
        where: { userId: input.args.userId },
      });

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      if (profile.private && ctx.sessionUser?.id !== profile.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This profile is private',
        });
      }

      const { resolveMany, select } = createResolver({
        ...input,
        ctx,
        view: profileDataView,
      });

      return resolveMany(
        await ctx.prisma.profile.findMany({
          select,
          where: { userId: input.args.userId },
        } as ProfileFindManyArgs),
      );
    },
  }),
  me: procedure
    .input(
      z.object({
        args: connectionArgs,
        select: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.sessionUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view your profile',
        });
      }

      const { resolve, select } = createResolver({
        ...input,
        ctx,
        view: profileDataView,
      });

      const profile = await ctx.prisma.profile.findUnique({
        select,
        where: { userId: ctx.sessionUser.id },
      } as ProfileFindUniqueArgs);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      return resolve(profile);
    }),

  update: procedure
    .input(
      z.object({
        args: connectionArgs,
        bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
        github: z.string().max(100, 'GitHub username must be at most 100 characters').optional(),
        linkedin: z
          .string()
          .max(200, 'LinkedIn username must be at most 100 characters')
          .optional(),
        location: z.string().max(100, 'Location must be at most 100 characters').optional(),
        private: z.boolean().optional(),
        select: z.array(z.string()),
        twitter: z.string().max(100, 'Twitter username must be at most 100 characters').optional(),
        website: z
          .url('Website must be a valid URL')
          .max(200, 'Website must be at most 200 characters')
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.sessionUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update your profile',
        });
      }

      const { resolve, select } = createResolver({
        ...input,
        ctx,
        view: profileDataView,
      });

      const profile = await ctx.prisma.profile.upsert({
        create: {
          bio: input.bio,
          github: input.github,
          linkedin: input.linkedin,
          location: input.location,
          // fail closed if the private flag is not explicitly set
          private: input.private ?? true,
          twitter: input.twitter,
          userId: ctx.sessionUser.id,
          website: input.website,
        },
        select,
        update: {
          bio: input.bio,
          github: input.github,
          linkedin: input.linkedin,
          location: input.location,
          private: input.private,
          twitter: input.twitter,
          website: input.website,
        },
        where: { userId: ctx.sessionUser.id },
      } as ProfileUpsertArgs);

      return resolve(profile);
    }),
});
