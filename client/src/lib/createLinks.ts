import { httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client';
import env from './env.tsx';

export const createLinks = (userId: string | undefined) => {
  return [
    splitLink({
      condition: (op) => op.type === 'subscription',
      false: httpBatchLink({
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            credentials: userId ? 'include' : undefined,
          }),
        url: `${env('SERVER_URL')}/trpc`,
      }),
      true: httpSubscriptionLink({
        url: `${env('SERVER_URL')}/trpc`,
        eventSourceOptions() {
          return {
            withCredentials: userId != null,
          };
        },
      }),
    }),
  ];
};
