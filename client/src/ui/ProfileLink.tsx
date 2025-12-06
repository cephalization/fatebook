import { PropsWithChildren } from 'react';
import Link from './Link.tsx';

export const ProfileLink = ({ children, userId }: PropsWithChildren<{ userId: string }>) => {
  if (!userId) {
    throw new Error('fate: User ID is required.');
  }
  return <Link to={`/profile/${userId}`}>{children ?? 'Profile'}</Link>;
};
