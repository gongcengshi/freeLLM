import { useEffect, useState } from 'react';
import { api, type RequestLog } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { getStatusColor, formatDate, formatDuration, formatNumber } from '@/lib/utils';

export function Logs() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await api.logs.list({ limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Request Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No logs available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Time</th>
                    <th className="text-left py-3 px-2">Model</th>
                    <th className="text-left py-3 px-2">Provider</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-right py-3 px-2">Tokens</th>
                    <th className="text-right py-3 px-2">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-2">
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          {log.model}
                        </code>
                      </td>
                      <td className="py-3 px-2">{log.providerId}</td>
                      <td className="py-3 px-2">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatNumber(log.totalTokens)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatDuration(log.latencyMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
