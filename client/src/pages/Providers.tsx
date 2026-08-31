import { useEffect, useState } from 'react';
import { api, type Provider } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { getStatusColor } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const data = await api.providers.list();
      setProviders(data);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      await api.providers.delete(id);
      setProviders(providers.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Providers</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <Badge className={getStatusColor(provider.enabled ? 'active' : 'inactive')}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">{provider.id}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Base URL:</span>{' '}
                  <span className="break-all">{provider.baseUrl}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Models:</span>{' '}
                  <span>{provider.models.length} models</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate Limits:</span>{' '}
                  <span>{provider.rateLimits.rpm} RPM / {provider.rateLimits.rpd} RPD</span>
                </div>
                <div className="flex gap-2 pt-2">
                  {provider.features.streaming && (
                    <Badge variant="secondary">Streaming</Badge>
                  )}
                  {provider.features.tools && (
                    <Badge variant="secondary">Tools</Badge>
                  )}
                  {provider.features.vision && (
                    <Badge variant="secondary">Vision</Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(provider.id)}
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
