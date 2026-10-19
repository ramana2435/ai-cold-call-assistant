import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductProfiles, deleteProductProfile } from '../services/api';
import { ProductProfile } from '../types';

export default function ProductProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProductProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProductProfile(id);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading product profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">Product Profiles</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage reusable product knowledge for AI-contextualized calls
              </p>
            </div>
            <button
              onClick={() => navigate('/products/new')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              + New Product
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No product profiles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first product profile.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/products/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Create Product Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{profile.product_name}</h3>
                      {profile.short_description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {profile.short_description}
                        </p>
                      )}
                    </div>
                    {!profile.is_active && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.problems_solved && profile.problems_solved.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {profile.problems_solved.length} problem{profile.problems_solved.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {profile.benefits && profile.benefits.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {profile.benefits.length} benefit{profile.benefits.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {profile.features && profile.features.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {profile.features.length} feature{profile.features.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => navigate(`/products/${profile.id}`)}
                      className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/products/${profile.id}/edit`)}
                      className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id, profile.product_name)}
                      className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
