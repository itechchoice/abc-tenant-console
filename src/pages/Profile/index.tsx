import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// @ts-expect-error shared lib dist lacks .d.ts
import { ProfilePage } from '@itechchoice/mcp-fe-shared';
import {
  fetchProfile, updateProfile, uploadAvatar, resetPassword,
  listGlobalApiKeys, createGlobalApiKey, deleteGlobalApiKey,
  type MockApiKey,
} from './mock/profileMock';

export default function Profile() {
  const navigate = useNavigate();

  const profileApi = useMemo(() => ({
    getProfile: fetchProfile,
    updateProfile: (data: Record<string, unknown>) => updateProfile(data as Record<string, string>),
    uploadAvatar,
    sendResetPasswordLink: async () => resetPassword(),
    listGlobalApiKeys,
    listWorkspaceApiKeys: async () => [],
    createGlobalApiKey,
    createWorkspaceApiKey: async () => ({}),
    deleteGlobalApiKey,
    deleteWorkspaceApiKey: async () => {},
  }), []);

  const apiKeyEvents = useMemo(() => ({
    onLoadApiKeySources: async () => {
      const keys = await listGlobalApiKeys();
      return [{
        id: 'global',
        label: 'API Keys',
        sourceType: 'personal',
        count: keys.filter((k: MockApiKey) => !k.expired).length,
        items: keys.map((k: MockApiKey) => ({
          ...k,
          sourceType: 'personal',
          sourceId: 'global',
          sourceLabel: 'API Keys',
        })),
      }];
    },
    onCreateApiKey: async (payload: Record<string, unknown>) => {
      const result = await createGlobalApiKey({
        name: (payload.name as string) || undefined,
        expiresAt: (payload.expiresAt as string) || undefined,
      });
      return {
        ...result,
        sourceType: 'personal',
        sourceId: 'global',
        sourceLabel: 'API Keys',
      };
    },
    onDeleteApiKey: async (apiKey: Record<string, unknown>) => {
      await deleteGlobalApiKey((apiKey.id as string) || null);
      return null;
    },
  }), []);

  const handleSuccess = useCallback((ctx: string) => {
    const msgs: Record<string, string> = {
      updateName: 'Name updated',
      uploadAvatar: 'Avatar updated',
      resetPassword: 'Reset link sent',
    };
    console.log('[Profile]', msgs[ctx] || 'Success');
  }, []);

  const handleError = useCallback((err: unknown, ctx: string) => {
    console.error(`[Profile] ${ctx}:`, err);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto w-full">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and API keys</p>
      </div>

      <ProfilePage
        profileApi={profileApi}
        apiKeyEvents={apiKeyEvents}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
