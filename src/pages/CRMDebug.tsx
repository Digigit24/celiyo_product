// src/pages/CRMDebug.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
import { crmClient } from '@/lib/client';

export const CRMDebug: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebug = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await crmClient.get('/crm/debug/');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch debug info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6" />
            CRM Debug - Tenant Check
          </h1>
          <p className="text-muted-foreground text-sm">
            Diagnose tenant mismatch between workflow engine and CRM API
          </p>
        </div>
        <Button onClick={fetchDebug} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {data ? 'Refresh' : 'Run Debug'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Raw Response</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-sm whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CRMDebug;
