import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCalls } from '../services/api';
import { Call } from '../types';
import CallCard from './CallCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCalls();
      setCalls(data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading calls...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={fetchCalls}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Calls</h1>
          <div className="mt-2 flex space-x-4">
            <button
              onClick={() => navigate('/products')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Product Profiles
            </button>
            <button
              onClick={() => navigate('/organizations')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Organizations
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate('/calls/new')}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Call
        </button>
      </div>

      {calls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No calls yet</h2>
          <p className="text-gray-600 mb-6">Start your first call to begin tracking conversations</p>
          <button
            onClick={() => navigate('/calls/new')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Start Your First Call
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calls.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              onClick={() => navigate(`/calls/${call.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
