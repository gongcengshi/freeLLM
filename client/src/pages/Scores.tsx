import { useEffect, useState } from 'react';
import { api, type ModelScore } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { formatDate, formatNumber } from '@/lib/utils';

export function Scores() {
  const [scores, setScores] = useState<ModelScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
  }, []);

  async function loadScores() {
    try {
      const data = await api.scores.list();
      setScores(data);
    } catch (error) {
      console.error('Failed to load scores:', error);
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Model Scores</h1>

      <Card>
        <CardHeader>
          <CardTitle>Model Performance Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-muted-foreground">No scores available yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Model</th>
                    <th className="text-left py-3 px-2">Provider</th>
                    <th className="text-center py-3 px-2">Total</th>
                    <th className="text-center py-3 px-2">Health</th>
                    <th className="text-center py-3 px-2">Speed</th>
                    <th className="text-center py-3 px-2">Quality</th>
                    <th className="text-center py-3 px-2">Reliability</th>
                    <th className="text-right py-3 px-2">Requests</th>
                    <th className="text-left py-3 px-2">Last Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score) => (
                    <tr key={`${score.providerId}/${score.modelId}`} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          {score.modelId}
                        </code>
                      </td>
                      <td className="py-3 px-2">{score.providerId}</td>
                      <td className={`py-3 px-2 text-center font-bold ${getScoreColor(score.totalScore)}`}>
                        {score.totalScore.toFixed(1)}
                      </td>
                      <td className={`py-3 px-2 text-center ${getScoreColor(score.health)}`}>
                        {score.health.toFixed(1)}
                      </td>
                      <td className={`py-3 px-2 text-center ${getScoreColor(score.speed)}`}>
                        {score.speed.toFixed(1)}
                      </td>
                      <td className={`py-3 px-2 text-center ${getScoreColor(score.quality)}`}>
                        {score.quality.toFixed(1)}
                      </td>
                      <td className={`py-3 px-2 text-center ${getScoreColor(score.reliability)}`}>
                        {score.reliability.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatNumber(score.successCount)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatDate(score.lastChecked)}
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
