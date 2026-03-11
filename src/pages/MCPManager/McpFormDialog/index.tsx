import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { useMcpManagerStore } from '@/stores/mcpManagerStore';
import { useMCPDetail } from '../hooks/useMCPDetail';
import { useCreateMCP, useUpdateMCP } from '../hooks/useMCPMutations';
import { useSaveServerAuthParams } from '../hooks/useServerAuthConfig';
import BasicInfoTab from './BasicInfoTab';
import AuthInfoTab from './AuthInfoTab';

const formSchema = z.object({
  serverCode: z.string().min(1, 'Server code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  runtimeMode: z.enum(['REMOTE', 'LOCAL']),
  icon: z.string().optional(),
  endpoint: z.string().optional(),
  supportsStreaming: z.boolean().optional(),
  authType: z.enum(['NONE', 'API_KEY', 'BASIC', 'OAUTH2', 'BEARER_TOKEN', 'CUSTOM']),
  categories: z.array(z.string()).optional(),
  authParamConfigs: z.array(z.any()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  serverCode: '',
  name: '',
  description: '',
  runtimeMode: 'REMOTE',
  icon: '',
  endpoint: '',
  supportsStreaming: false,
  authType: 'NONE',
  categories: [],
  authParamConfigs: [],
};

export default function McpFormDialog() {
  const { formDialog, closeFormDialog } = useMcpManagerStore();
  const isEdit = formDialog.mode === 'edit';
  const { data: existing } = useMCPDetail(isEdit ? formDialog.serverId : undefined);
  const createMutation = useCreateMCP();
  const updateMutation = useUpdateMCP();
  const saveAuthParamsMutation = useSaveServerAuthParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        serverCode: existing.serverCode,
        name: existing.name,
        description: existing.description ?? '',
        runtimeMode: existing.runtimeMode ?? 'REMOTE',
        icon: existing.icon ?? '',
        endpoint: existing.endpoint ?? '',
        supportsStreaming: existing.supportsStreaming ?? false,
        authType: existing.authType,
        categories: existing.categories ?? [],
        authParamConfigs: existing.authParamConfigs ?? [],
      });
    } else if (!isEdit) {
      form.reset(DEFAULT_VALUES);
    }
  }, [isEdit, existing, form]);

  const onSubmit = (values: FormValues) => {
    const categoriesJson = values.categories && values.categories.length > 0
      ? JSON.stringify(values.categories)
      : undefined;

    if (isEdit && formDialog.serverId) {
      const sid = formDialog.serverId;
      updateMutation.mutate({
        serverId: sid,
        payload: {
          name: values.name,
          description: values.description,
          runtimeMode: values.runtimeMode,
          icon: values.icon,
          endpoint: values.endpoint,
          supportsStreaming: values.supportsStreaming,
          authType: values.authType,
          categories: categoriesJson,
        },
      });
      if (values.authParamConfigs && values.authParamConfigs.length > 0) {
        saveAuthParamsMutation.mutate({ serverId: sid, params: values.authParamConfigs });
      }
    } else {
      createMutation.mutate({
        serverCode: values.serverCode,
        name: values.name,
        description: values.description,
        runtimeMode: values.runtimeMode,
        icon: values.icon,
        endpoint: values.endpoint,
        supportsStreaming: values.supportsStreaming,
        authType: values.authType,
        categories: categoriesJson,
        authParamConfigs: values.authParamConfigs && values.authParamConfigs.length > 0
          ? values.authParamConfigs
          : undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || saveAuthParamsMutation.isPending;

  return (
    <Dialog open={formDialog.open} onOpenChange={(open) => { if (!open) closeFormDialog(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{isEdit ? 'Edit MCP Server' : 'Create MCP Server'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="auth">Auth Config</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" forceMount className="data-[state=inactive]:hidden">
                  <BasicInfoTab form={form} isEdit={isEdit} />
                </TabsContent>
                <TabsContent value="auth" forceMount className="data-[state=inactive]:hidden">
                  <AuthInfoTab form={form} />
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="px-6 py-4 border-t shrink-0">
              <Button type="button" variant="outline" onClick={closeFormDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
