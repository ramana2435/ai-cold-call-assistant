import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getOrganizationProfile,
  createOrganizationProfile,
  updateOrganizationProfile,
} from '../services/api';
import { CreateOrganizationProfileInput } from '../types';

const emptyForm = (): CreateOrganizationProfileInput => ({
  organization_name: '',
  website: '',
  industry: '',
  organization_type: '',
  company_size: '',
  prospect_name: '',
  prospect_role: '',
  is_decision_maker: false,
  business_challenges: '',
  potential_use_cases: '',
  organization_notes: '',
  information_source: '',
  confidence_level: 'unverified',
});

export default function OrganizationProfileForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateOrganizationProfileInput>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrganizationProfile(id)
      .then((profile) => {
        setForm({
          organization_name: profile.organization_name,
          website: profile.website ?? '',
          industry: profile.industry ?? '',
          organization_type: profile.organization_type ?? '',
          company_size: profile.company_size ?? '',
          prospect_name: profile.prospect_name ?? '',
          prospect_role: profile.prospect_role ?? '',
          is_decision_maker: profile.is_decision_maker ?? false,
          business_challenges: profile.business_challenges ?? '',
          potential_use_cases: profile.potential_use_cases ?? '',
          organization_notes: profile.organization_notes ?? '',
          information_source: profile.information_source ?? '',
          confidence_level: profile.confidence_level ?? 'unverified',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization_name.trim()) {
      setError('Organization name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await updateOrganizationProfile(id, form);
      } else {
        await createOrganizationProfile(form);
      }
      navigate('/organizations');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {id ? 'Edit Organization Profile' : 'New Organization Profile'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="organization_name"
            value={form.organization_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Acme Corporation"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            name="website"
            value={form.website ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            type="text"
            name="industry"
            value={form.industry ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="SaaS, Manufacturing, Healthcare…"
          />
        </div>

        {/* Organization Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
          <input
            type="text"
            name="organization_type"
            value={form.organization_type ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Startup, Enterprise, Non-profit…"
          />
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
          <input
            type="text"
            name="company_size"
            value={form.company_size ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="1–10, 50–200, 1000+…"
          />
        </div>

        {/* Prospect Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prospect Name</label>
          <input
            type="text"
            name="prospect_name"
            value={form.prospect_name ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Jane Smith"
          />
        </div>

        {/* Prospect Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prospect Role</label>
          <input
            type="text"
            name="prospect_role"
            value={form.prospect_role ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="CTO, VP of Sales…"
          />
        </div>

        {/* Is Decision Maker */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_decision_maker"
            name="is_decision_maker"
            checked={form.is_decision_maker ?? false}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is_decision_maker" className="text-sm font-medium text-gray-700">
            Is Decision Maker
          </label>
        </div>

        {/* Business Challenges */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Challenges</label>
          <textarea
            name="business_challenges"
            value={form.business_challenges ?? ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Key pain points and problems facing the organization…"
          />
        </div>

        {/* Potential Use Cases */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Potential Use Cases</label>
          <textarea
            name="potential_use_cases"
            value={form.potential_use_cases ?? ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="How this organization might use the product…"
          />
        </div>

        {/* Organization Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization Notes</label>
          <textarea
            name="organization_notes"
            value={form.organization_notes ?? ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Additional context, history, or notes…"
          />
        </div>

        {/* Information Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Information Source</label>
          <input
            type="text"
            name="information_source"
            value={form.information_source ?? ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="LinkedIn, Discovery call, CRM…"
          />
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
          <select
            name="confidence_level"
            value={form.confidence_level ?? 'unverified'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="unverified">Unverified</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : id ? 'Update Profile' : 'Create Profile'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/organizations')}
            className="flex-1 bg-white text-gray-700 py-2 px-4 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
