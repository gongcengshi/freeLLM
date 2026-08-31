import { useEffect, useState } from 'react';
import { api, type LogStats, type HealthCheckResult } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatNumber, formatDuration, getStatusColor } from '@/lib/utils';
import { Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [health, setHealth] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, healthData] = await Promise.all([
        api.logs.stats(),
        api.health.check(),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalRequests || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRequests
                ? `${((stats.successRequests / stats.totalRequests) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalTokens || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.avgLatencyMs || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Health</CardTitle>
        </CardHeader>
        <CardContent>
          {health.length === 0 ? (
            <p className="text-muted-foreground">No health data available</p>
          ) : (
            <div className="space-y-3">
              {health.map((h) => (
                <div
                  key={h.providerId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{h.providerId}</span>
                    <Badge className={getStatusColor(h.status)}>{h.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {h.latencyMs && `${formatDuration(h.latencyMs)}`}
                    {h.error && <span className="text-red-500 ml-2">{h.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {stats && Object.keys(stats.byProvider).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requests by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byProvider).map(([provider, data]) => (
                <div
                  key={provider}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <span className="font-medium">{provider}</span>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(data.requests)} requests / {formatNumber(data.tokens)} tokens
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
