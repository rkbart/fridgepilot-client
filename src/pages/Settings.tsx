import { useState, useEffect } from 'react';
import { settings } from '../services/api';

interface SettingsData {
  ai_api_key: string | null;
  ai_api_endpoint: string | null;
  has_api_key: boolean;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    settings.get().then((res) => {
      const d = (res as { data: SettingsData }).data;
      setData(d);
      setEndpoint(d.ai_api_endpoint || '');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload: { ai_api_endpoint?: string; ai_api_key?: string } = { ai_api_endpoint: endpoint };
      if (apiKey) payload.ai_api_key = apiKey;
      await settings.update(payload);
      setMessage('Settings saved.');
      setApiKey('');
      if (data) setData({ ...data, has_api_key: true, ai_api_endpoint: endpoint });
    } catch {
      setError('Failed to save settings.');
    }
  };

  if (!data) return <div style={{ padding: '2rem', color: 'var(--stone)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {message && <div className="info-msg">{message}</div>}
      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>AI Configuration</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>API Key {data.has_api_key && '(set)'}</label>
            <input
              className="form-input"
              type="password"
              placeholder={data.has_api_key ? '••••••••' : 'Enter your NVIDIA NIM API key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>API Endpoint</label>
            <input
              className="form-input"
              placeholder="https://integrate.api.nvidia.com/v1"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save settings</button>
        </form>
      </div>
    </div>
  );
}
