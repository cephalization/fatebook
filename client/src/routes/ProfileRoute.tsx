/// <reference types="fbtee/ReactTypes.d.ts" />

import type { Profile, User } from '@app/server/src/router.ts';
import Stack, { VStack } from '@nkzw/stack';
import { fbs } from 'fbtee';
import { ChangeEvent, Suspense, useActionState, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRequest, useView, view, ViewRef } from 'react-fate';
import { useParams } from 'react-router';
import { fate } from '../lib/fate.tsx';
import { Button } from '../ui/Button.tsx';
import Card from '../ui/Card.tsx';
import ErrorDisplay from '../ui/Error.tsx';
import H2 from '../ui/H2.tsx';
import Input from '../ui/Input.tsx';
import Section from '../ui/Section.tsx';
import AuthClient from '../user/AuthClient.tsx';

export const ProfileView = view<Profile>()({
  bio: true,
  github: true,
  linkedin: true,
  location: true,
  private: true,
  twitter: true,
  userId: true,
  website: true,
});

const UserView = view<User>()({
  id: true,
  name: true,
  profile: ProfileView,
  username: true,
});

const ProfileEditForm = ({
  profile,
}: {
  profile: {
    bio: string | null;
    github: string | null;
    linkedin: string | null;
    location: string | null;
    private: boolean;
    twitter: string | null;
    user: { id: string };
    website: string | null;
  };
}) => {
  const [formData, setFormData] = useState({
    bio: profile.bio ?? '',
    github: profile.github ?? '',
    linkedin: profile.linkedin ?? '',
    location: profile.location ?? '',
    private: profile.private,
    twitter: profile.twitter ?? '',
    website: profile.website ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof typeof formData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setError(null);
      setFormData((prev) => ({
        ...prev,
        [field]:
          event.target.type === 'checkbox'
            ? (event.target as HTMLInputElement).checked
            : event.target.value,
      }));
    };

  const [, submitAction, isPending] = useActionState(async () => {
    try {
      setError(null);
      await fate.mutations.profile.update({
        input: {
          bio: formData.bio.trim() || undefined,
          github: formData.github.trim() || undefined,
          linkedin: formData.linkedin.trim() || undefined,
          location: formData.location.trim() || undefined,
          private: formData.private,
          twitter: formData.twitter.trim() || undefined,
          website: formData.website.trim() || undefined,
        },
        optimistic: {
          bio: formData.bio.trim() || null,
          github: formData.github.trim() || null,
          linkedin: formData.linkedin.trim() || null,
          location: formData.location.trim() || null,
          private: formData.private,
          twitter: formData.twitter.trim() || null,
          user: { id: profile.user.id },
          website: formData.website.trim() || null,
        },
        view: ProfileView,
      });
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update profile.');
    }
  }, null);

  return (
    <VStack action={submitAction} as="form" gap={16}>
      <H2>
        <fbt desc="Edit profile headline">Edit Profile</fbt>
      </H2>

      <VStack gap={8}>
        <label
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="profile-bio"
        >
          <fbt desc="Bio label">Bio</fbt>
        </label>
        <textarea
          className="min-h-24 w-full placeholder-gray-500 transition outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:opacity-50 squircle border border-gray-200/80 bg-gray-100/50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/40 dark:placeholder-gray-400"
          disabled={isPending}
          id="profile-bio"
          maxLength={500}
          onChange={handleChange('bio')}
          placeholder={fbs('Tell us about yourself...', 'Bio placeholder')}
          value={formData.bio}
        />
      </VStack>

      <VStack gap={8}>
        <label
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="profile-location"
        >
          <fbt desc="Location label">Location</fbt>
        </label>
        <Input
          className="w-full"
          disabled={isPending}
          id="profile-location"
          maxLength={100}
          onChange={handleChange('location')}
          placeholder={fbs('San Francisco, CA', 'Location placeholder')}
          value={formData.location}
        />
      </VStack>

      <VStack gap={8}>
        <label
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="profile-website"
        >
          <fbt desc="Website label">Website</fbt>
        </label>
        <Input
          className="w-full"
          disabled={isPending}
          id="profile-website"
          maxLength={200}
          onChange={handleChange('website')}
          placeholder={fbs('https://example.com', 'Website placeholder')}
          type="url"
          value={formData.website}
        />
      </VStack>

      <div className="grid gap-4 sm:grid-cols-3">
        <VStack gap={8}>
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="profile-twitter"
          >
            <fbt desc="Twitter label">Twitter</fbt>
          </label>
          <Input
            className="w-full"
            disabled={isPending}
            id="profile-twitter"
            maxLength={100}
            onChange={handleChange('twitter')}
            placeholder={fbs('@username', 'Twitter placeholder')}
            value={formData.twitter}
          />
        </VStack>

        <VStack gap={8}>
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="profile-github"
          >
            <fbt desc="GitHub label">GitHub</fbt>
          </label>
          <Input
            className="w-full"
            disabled={isPending}
            id="profile-github"
            maxLength={100}
            onChange={handleChange('github')}
            placeholder={fbs('username', 'GitHub placeholder')}
            value={formData.github}
          />
        </VStack>

        <VStack gap={8}>
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="profile-linkedin"
          >
            <fbt desc="LinkedIn label">LinkedIn</fbt>
          </label>
          <Input
            className="w-full"
            disabled={isPending}
            id="profile-linkedin"
            maxLength={200}
            onChange={handleChange('linkedin')}
            placeholder={fbs('in/username', 'LinkedIn placeholder')}
            value={formData.linkedin}
          />
        </VStack>
      </div>

      <Stack alignCenter gap={12}>
        <input
          checked={formData.private}
          className="h-4 w-4 squircle border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800"
          disabled={isPending}
          id="profile-private"
          onChange={handleChange('private')}
          type="checkbox"
        />
        <label
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="profile-private"
        >
          <fbt desc="Private profile label">Make profile private</fbt>
        </label>
      </Stack>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Stack end>
        <Button disabled={isPending} size="sm" type="submit" variant="secondary">
          <fbt desc="Save profile button">Save Changes</fbt>
        </Button>
      </Stack>
    </VStack>
  );
};

const SocialLink = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
  <a
    className="inline-flex items-center gap-2 text-sm text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    href={href}
    rel="noopener noreferrer"
    target="_blank"
  >
    <span>{icon}</span>
    <span>{label}</span>
  </a>
);

const ProfileDisplay = ({
  profile,
}: {
  profile: {
    bio: string | null;
    github: string | null;
    linkedin: string | null;
    location: string | null;
    twitter: string | null;
    user: { id: string; name: string | null; username: string | null };
    website: string | null;
  };
}) => (
  <VStack gap={16}>
    <VStack gap={4}>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {profile.user.name ?? 'Anonymous'}
      </h1>
      {profile.user.username && <p className="text-muted-foreground">@{profile.user.username}</p>}
    </VStack>

    {profile.bio && <p className="text-foreground/90 leading-relaxed">{profile.bio}</p>}

    {profile.location && (
      <Stack alignCenter gap={8}>
        <span className="text-muted-foreground">📍</span>
        <span className="text-muted-foreground">{profile.location}</span>
      </Stack>
    )}

    <Stack gap={16} wrap>
      {profile.website && (
        <SocialLink
          href={profile.website}
          icon="🔗"
          label={profile.website.replace(/^https?:\/\//, '')}
        />
      )}
      {profile.twitter && (
        <SocialLink
          href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
          icon="𝕏"
          label={profile.twitter.startsWith('@') ? profile.twitter : `@${profile.twitter}`}
        />
      )}
      {profile.github && (
        <SocialLink href={`https://github.com/${profile.github}`} icon="⌨️" label={profile.github} />
      )}
      {profile.linkedin && (
        <SocialLink
          href={`https://linkedin.com/${profile.linkedin.startsWith('in/') ? profile.linkedin : `in/${profile.linkedin}`}`}
          icon="💼"
          label={profile.linkedin}
        />
      )}
    </Stack>
  </VStack>
);

const ProfileCard = ({ user: userRef }: { user: ViewRef<'User'> }) => {
  const user = useView(UserView, userRef);
  const profile = useView(ProfileView, user.profile);
  const { data: session } = AuthClient.useSession();
  const isOwner = session?.user?.id === user.id;

  return (
    <VStack gap={32}>
      <Card>
        <ProfileDisplay
          profile={{
            ...profile,
            user: {
              id: user.id,
              name: user.name,
              username: user.username,
            },
          }}
        />
      </Card>

      {isOwner && (
        <Card>
          <ProfileEditForm
            profile={{
              ...profile,
              user: { id: user.id },
            }}
          />
        </Card>
      )}
    </VStack>
  );
};

const ProfileContent = ({ userId }: { userId: string }) => {
  const { user } = useRequest({
    user: {
      id: userId,
      root: UserView,
      type: 'User',
    },
  } as const);

  return <ProfileCard user={user} />;
};

export default function ProfileRoute() {
  const { userId } = useParams();

  if (!userId) {
    throw new Error('fate: User ID is required.');
  }

  return (
    // request does not re-fire when deps change, so we need to key the content
    <Section key={userId}>
      <ErrorBoundary
        fallbackRender={({ error }) => {
          if (error instanceof Error && error.message.includes('private')) {
            return (
              <Card>
                <Stack center verticalPadding={24}>
                  <fbt desc="Private profile text">This profile is private.</fbt>
                </Stack>
              </Card>
            );
          }
          return <ErrorDisplay error={error} />;
        }}
      >
        <Suspense
          fallback={
            <Card>
              <Stack center className="animate-pulse text-gray-500 italic" verticalPadding={24}>
                <fbt desc="Loading profile text">Loading profile…</fbt>
              </Stack>
            </Card>
          }
        >
          <ProfileContent userId={userId} />
        </Suspense>
      </ErrorBoundary>
    </Section>
  );
}
