import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface WindsurfAddAccountFormProps {
  onAdd: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export function WindsurfAddAccountForm({ onAdd }: WindsurfAddAccountFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onAdd(email.trim());
      
      if (result.success) {
        setEmail('');
        setError(null);
      } else {
        setError(result.error || 'Failed to add account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="windsurf-email" className="block text-sm font-medium text-gray-700 mb-2">
          Windsurf Email Address
        </label>
        <input
          id="windsurf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your-email@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Add Windsurf Account
      </button>
    </form>
  );
}

export default WindsurfAddAccountForm;
