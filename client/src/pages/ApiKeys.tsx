import { useEffect, useState } from 'react';
import { api, type ApiKey } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { getStatusColor, formatDate } from '@/lib/utils';
import { Plus, Trash2, Key } from 'lucide-react';

export function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      const data = await api.apiKeys.list();
      setApiKeys(data);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    try {
      await api.apiKeys.delete(id);
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {apiKey.name}
                </CardTitle>
                <Badge className={getStatusColor(apiKey.status)}>{apiKey.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">{apiKey.providerId}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Key:</span>{' '}
                  <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">
                    {apiKey.key}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  {formatDate(apiKey.createdAt)}
                </div>
                {apiKey.lastUsedAt && (
                  <div>
                    <span className="text-muted-foreground">Last Used:</span>{' '}
                    {formatDate(apiKey.lastUsedAt)}
                  </div>
                )}
                {apiKey.cooldownUntil && (
                  <div>
                    <span className="text-muted-foreground">Cooldown Until:</span>{' '}
                    {formatDate(apiKey.cooldownUntil)}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(apiKey.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
