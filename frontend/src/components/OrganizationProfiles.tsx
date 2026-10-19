import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizationProfiles, deleteOrganizationProfile } from '../services/api';
import { OrganizationProfile } from '../types';

export default function OrganizationProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<OrganizationProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizationProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteOrganizationProfile(id);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading organization profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-indigo-600 hover:text-indigo-700 font-medium mb-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Organization Profiles</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage target organizations and prospects
              </p>
            </div>
            <button
              onClick={() => navigate('/organizations/new')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              + New Organization
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organization profiles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first organization profile.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/organizations/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Create Organization Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{profile.organization_name}</h3>
                    {profile.industry && (
                      <p className="mt-1 text-sm text-gray-600">Industry: {profile.industry}</p>
                    )}
                    {profile.company_size && (
                      <p className="mt-1 text-sm text-gray-600">Size: {profile.company_size}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => navigate(`/organizations/${profile.id}/edit`)}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id, profile.organization_name)}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
