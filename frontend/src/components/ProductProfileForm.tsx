import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getProductProfile,
  createProductProfile,
  updateProductProfile,
} from '../services/api';
import {
  CreateProductProfileInput,
  ProductFeature,
  ObjectionResponse,
} from '../types';

const emptyForm = (): CreateProductProfileInput => ({
  product_name: '',
  short_description: '',
  detailed_explanation: '',
  pricing_model: '',
  product_limitations: '',
  ideal_customer_profile: '',
  preferred_next_steps: '',
  problems_solved: [],
  features: [],
  benefits: [],
  use_cases: [],
  common_objections: [],
  supported_industries: [],
  unsupported_industries: [],
  image_references: [],
});

export default function ProductProfileForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateProductProfileInput>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Temporary inputs for array fields
  const [newProblem, setNewProblem] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newUseCase, setNewUseCase] = useState('');
  const [newSupportedIndustry, setNewSupportedIndustry] = useState('');
  const [newUnsupportedIndustry, setNewUnsupportedIndustry] = useState('');

  // Feature temp state
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');

  // Objection temp state
  const [newObjection, setNewObjection] = useState('');
  const [newObjectionResponse, setNewObjectionResponse] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductProfile(id)
      .then((profile) => {
        setForm({
          product_name: profile.product_name,
          short_description: profile.short_description ?? '',
          detailed_explanation: profile.detailed_explanation ?? '',
          pricing_model: profile.pricing_model ?? '',
          product_limitations: profile.product_limitations ?? '',
          ideal_customer_profile: profile.ideal_customer_profile ?? '',
          preferred_next_steps: profile.preferred_next_steps ?? '',
          problems_solved: profile.problems_solved ?? [],
          features: profile.features ?? [],
          benefits: profile.benefits ?? [],
          use_cases: profile.use_cases ?? [],
          common_objections: profile.common_objections ?? [],
          supported_industries: profile.supported_industries ?? [],
          unsupported_industries: profile.unsupported_industries ?? [],
          image_references: profile.image_references ?? [],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function setField<K extends keyof CreateProductProfileInput>(
    key: K,
    value: CreateProductProfileInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // --- String array helpers ---
  function addStringItem(
    field: 'problems_solved' | 'benefits' | 'use_cases' | 'supported_industries' | 'unsupported_industries',
    value: string,
    reset: () => void
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setField(field, [...(form[field] as string[]), trimmed]);
    reset();
  }

  function removeStringItem(
    field: 'problems_solved' | 'benefits' | 'use_cases' | 'supported_industries' | 'unsupported_industries',
    index: number
  ) {
    setField(
      field,
      (form[field] as string[]).filter((_, i) => i !== index)
    );
  }

  // --- Feature helpers ---
  function addFeature() {
    const name = newFeatureName.trim();
    if (!name) return;
    const feature: ProductFeature = {
      name,
      description: newFeatureDesc.trim(),
    };
    setField('features', [...(form.features ?? []), feature]);
    setNewFeatureName('');
    setNewFeatureDesc('');
  }

  function removeFeature(index: number) {
    setField('features', (form.features ?? []).filter((_, i) => i !== index));
  }

  // --- Objection helpers ---
  function addObjection() {
    const objection = newObjection.trim();
    if (!objection) return;
    const entry: ObjectionResponse = {
      objection,
      response: newObjectionResponse.trim(),
    };
    setField('common_objections', [...(form.common_objections ?? []), entry]);
    setNewObjection('');
    setNewObjectionResponse('');
  }

  function removeObjection(index: number) {
    setField(
      'common_objections',
      (form.common_objections ?? []).filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await updateProductProfile(id, form);
      } else {
        await createProductProfile(form);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {id ? 'Edit Product Profile' : 'New Product Profile'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Basic Fields ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.product_name}
              onChange={(e) => setField('product_name', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input
              type="text"
              value={form.short_description ?? ''}
              onChange={(e) => setField('short_description', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Explanation</label>
            <textarea
              rows={4}
              value={form.detailed_explanation ?? ''}
              onChange={(e) => setField('detailed_explanation', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
            <input
              type="text"
              value={form.pricing_model ?? ''}
              onChange={(e) => setField('pricing_model', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Limitations</label>
            <textarea
              rows={3}
              value={form.product_limitations ?? ''}
              onChange={(e) => setField('product_limitations', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Customer Profile</label>
            <textarea
              rows={3}
              value={form.ideal_customer_profile ?? ''}
              onChange={(e) => setField('ideal_customer_profile', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Next Steps</label>
            <textarea
              rows={2}
              value={form.preferred_next_steps ?? ''}
              onChange={(e) => setField('preferred_next_steps', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>

        {/* ── Problems Solved ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Problems Solved</h2>
          <ul className="space-y-1">
            {(form.problems_solved ?? []).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeStringItem('problems_solved', i)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a problem solved…"
              value={newProblem}
              onChange={(e) => setNewProblem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStringItem('problems_solved', newProblem, () => setNewProblem(''));
                }
              }}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => addStringItem('problems_solved', newProblem, () => setNewProblem(''))}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Features</h2>
          <ul className="space-y-2">
            {(form.features ?? []).map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                  <span className="font-medium">{feat.name}</span>
                  {feat.description && (
                    <span className="text-gray-500"> — {feat.description}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium mt-1"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Feature name"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newFeatureDesc}
              onChange={(e) => setNewFeatureDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={addFeature}
            className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Add Feature
          </button>
        </section>

        {/* ── Benefits ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Benefits</h2>
          <ul className="space-y-1">
            {(form.benefits ?? []).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeStringItem('benefits', i)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a benefit…"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStringItem('benefits', newBenefit, () => setNewBenefit(''));
                }
              }}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => addStringItem('benefits', newBenefit, () => setNewBenefit(''))}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </section>

        {/* ── Use Cases ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Use Cases</h2>
          <ul className="space-y-1">
            {(form.use_cases ?? []).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeStringItem('use_cases', i)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a use case…"
              value={newUseCase}
              onChange={(e) => setNewUseCase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStringItem('use_cases', newUseCase, () => setNewUseCase(''));
                }
              }}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => addStringItem('use_cases', newUseCase, () => setNewUseCase(''))}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </section>

        {/* ── Common Objections ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Common Objections</h2>
          <ul className="space-y-2">
            {(form.common_objections ?? []).map((entry, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 space-y-0.5">
                  <p><span className="font-medium">Objection:</span> {entry.objection}</p>
                  {entry.response && (
                    <p><span className="font-medium">Response:</span> {entry.response}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeObjection(i)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium mt-1"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Objection"
              value={newObjection}
              onChange={(e) => setNewObjection(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              rows={2}
              placeholder="Recommended response"
              value={newObjectionResponse}
              onChange={(e) => setNewObjectionResponse(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addObjection}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Add Objection
            </button>
          </div>
        </section>

        {/* ── Industries ── */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Industries</h2>

          {/* Supported */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Supported Industries</h3>
            <div className="flex flex-wrap gap-2">
              {(form.supported_industries ?? []).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeStringItem('supported_industries', i)}
                    className="hover:text-green-600 ml-0.5"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add supported industry…"
                value={newSupportedIndustry}
                onChange={(e) => setNewSupportedIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStringItem('supported_industries', newSupportedIndustry, () => setNewSupportedIndustry(''));
                  }
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => addStringItem('supported_industries', newSupportedIndustry, () => setNewSupportedIndustry(''))}
                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Unsupported */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Unsupported Industries</h3>
            <div className="flex flex-wrap gap-2">
              {(form.unsupported_industries ?? []).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeStringItem('unsupported_industries', i)}
                    className="hover:text-red-600 ml-0.5"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add unsupported industry…"
                value={newUnsupportedIndustry}
                onChange={(e) => setNewUnsupportedIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStringItem('unsupported_industries', newUnsupportedIndustry, () => setNewUnsupportedIndustry(''));
                  }
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => addStringItem('unsupported_industries', newUnsupportedIndustry, () => setNewUnsupportedIndustry(''))}
                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : id ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
