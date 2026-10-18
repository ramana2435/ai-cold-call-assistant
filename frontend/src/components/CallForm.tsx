import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCall } from '../services/api';

export default function CallForm() {
  const navigate = useNavigate();
  const [prospectName, setProspectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [prospectRole, setProspectRole] = useState('');
  const [callContext, setCallContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!prospectName.trim() || !companyName.trim()) {
      setError('Prospect name and company name are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const call = await createCall({
        prospect_name: prospectName.trim(),
        company_name: companyName.trim(),
        prospect_role: prospectRole.trim() || undefined,
        call_context: callContext.trim() || undefined
      });
      navigate(`/calls/${call.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create call');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 mr-4 text-2xl"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Start New Call</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="prospectName" className="block text-sm font-medium text-gray-700 mb-2">
              Prospect Name <span className="text-red-500">*</span>
            </label>
            <input
              id="prospectName"
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="e.g., Dr. Sarah Johnson"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Springfield Medical Center"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="prospectRole" className="block text-sm font-medium text-gray-700 mb-2">
              Role (Optional)
            </label>
            <input
              id="prospectRole"
              type="text"
              value={prospectRole}
              onChange={(e) => setProspectRole(e.target.value)}
              placeholder="e.g., Practice Manager"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="callContext" className="block text-sm font-medium text-gray-700 mb-2">
              Call Context (Optional)
            </label>
            <input
              id="callContext"
              type="text"
              value={callContext}
              onChange={(e) => setCallContext(e.target.value)}
              placeholder="e.g., first call, follow-up from conference"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              {callContext.length}/100 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !prospectName.trim() || !companyName.trim()}
            >
              {submitting ? 'Creating...' : 'Start Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
