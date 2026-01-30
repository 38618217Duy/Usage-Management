import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface AddAccountFormProps {
  onAdd: (email: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

export function AddAccountForm({ onAdd }: AddAccountFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const result = await onAdd(email.trim());
    
    if (result.success) {
      setEmail('');
    } else {
      setError(result.error?.message || 'Failed to add account');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          disabled={loading}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Add Account
      </button>
    </form>
  );
}

export default AddAccountForm;
