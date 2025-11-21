import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';

const RULES = ['holiday', 'happy_hour', 'weekday_special'];
const DISCOUNT_TYPES = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'amount', label: 'Flat Amount' }
];

const TARGET_TYPES = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'combo', label: 'Combo' }
];

export default function OfferForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      title: '',
      description: '',
      image_url: '',
      rule_type: '',
      discount_type: 'percent',
      discount_value: 0,
      max_discount: '',
      valid_from: '',
      valid_to: '',
      active: true,
      rules: [],
    }
  });

  React.useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        const res = await adminApi.get(`${A.offers()}/${id}`);
        const o = res?.offer || res || {};
        setState((s) => ({
          ...s,
          status: 'idle',
          form: {
            title: o.title || '',
            description: o.description || '',
            image_url: o.image_url || '',
            rule_type: o.rule_type || '',
            discount_type: o.discount_type || 'percent',
            discount_value: Number(o.discount_value ?? o.discount_percent ?? 0),
            max_discount: o.max_discount ?? '',
            valid_from: o.valid_from || '',
            valid_to: o.valid_to || '',
            active: !!o.active,
            rules: Array.isArray(o.rules) ? o.rules.map((r) => ({
              target_type: r.target_type || 'attraction',
              target_id: r.target_id ?? '',
              applies_to_all: !!r.applies_to_all,
              date_from: r.date_from || '',
              date_to: r.date_to || '',
              time_from: r.time_from || '',
              time_to: r.time_to || '',
              slot_type: r.slot_type || '',
              slot_id: r.slot_id ?? '',
              rule_discount_type: r.rule_discount_type || '',
              rule_discount_value: r.rule_discount_value ?? '',
              priority: r.priority ?? 100,
            })) : [],
          },
        }));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const updateForm = React.useCallback((partial) => {
    setState((s) => ({ ...s, form: { ...s.form, ...partial } }));
  }, []);

  const updateRule = React.useCallback((idx, partial) => {
    setState((s) => {
      const nextRules = [...(s.form.rules || [])];
      nextRules[idx] = { ...nextRules[idx], ...partial };
      return { ...s, form: { ...s.form, rules: nextRules } };
    });
  }, []);

  const addRule = React.useCallback(() => {
    setState((s) => ({
      ...s,
      form: {
        ...s.form,
        rules: [
          ...(s.form.rules || []),
          {
            target_type: 'attraction',
            target_id: '',
            applies_to_all: false,
            date_from: '',
            date_to: '',
            time_from: '',
            time_to: '',
            slot_type: '',
            slot_id: '',
            rule_discount_type: '',
            rule_discount_value: '',
            priority: 100,
          },
        ],
      },
    }));
  }, []);

  const removeRule = React.useCallback((idx) => {
    setState((s) => {
      const nextRules = [...(s.form.rules || [])];
      nextRules.splice(idx, 1);
      return { ...s, form: { ...s.form, rules: nextRules } };
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...state.form,
        discount_type: state.form.discount_type || 'percent',
        discount_value: Number(state.form.discount_value || 0),
        discount_percent: state.form.discount_type === 'percent' ? Number(state.form.discount_value || 0) : 0,
        max_discount: state.form.max_discount === '' ? null : Number(state.form.max_discount),
        rules: (state.form.rules || []).map((rule) => ({
          ...rule,
          target_id: rule.applies_to_all ? null : (rule.target_id === '' ? null : Number(rule.target_id)),
          slot_id: rule.slot_id === '' ? null : Number(rule.slot_id),
          rule_discount_value: rule.rule_discount_value === '' ? null : Number(rule.rule_discount_value),
          priority: Number(rule.priority ?? 100),
        })),
      };
      if (isEdit) await adminApi.put(`${A.offers()}/${id}`, payload);
      else await adminApi.post(A.offers(), payload);
      navigate('/admin/catalog/offers');
    } catch (err) { setState((s) => ({ ...s, error: err })); }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Offer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.title} onChange={(e) => updateForm({ title: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
          <textarea rows={4} className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.description} onChange={(e) => updateForm({ description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <ImageUploader label="Image" value={f.image_url} onChange={(url) => updateForm({ image_url: url })} requiredPerm="uploads:write" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Rule Type</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.rule_type} onChange={(e) => updateForm({ rule_type: e.target.value })}>
            <option value="">—</option>
            {RULES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount Type</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_type} onChange={(e) => updateForm({ discount_type: e.target.value })}>
            {DISCOUNT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount Value</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_value} onChange={(e) => updateForm({ discount_value: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Max Discount (optional)</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.max_discount ?? ''} onChange={(e) => updateForm({ max_discount: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid From</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.valid_from || ''} onChange={(e) => updateForm({ valid_from: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid To</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.valid_to || ''} onChange={(e) => updateForm({ valid_to: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => updateForm({ active: e.target.checked })} />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Rules</h2>
          <button type="button" onClick={addRule} className="text-sm rounded-md border px-3 py-1">
            Add Rule
          </button>
        </div>
        {!(f.rules || []).length ? (
          <div className="text-sm text-gray-500">No rules yet. Add one to target specific attractions or combos.</div>
        ) : null}
        <div className="space-y-4 mt-3">
          {(f.rules || []).map((rule, idx) => (
            <div key={`rule-${idx}`} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Rule #{idx + 1}</div>
                <button type="button" onClick={() => removeRule(idx)} className="text-xs text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Target Type</label>
                  <select className="w-full rounded-md border px-3 py-2" value={rule.target_type} onChange={(e) => updateRule(idx, { target_type: e.target.value })}>
                    {TARGET_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Target ID</label>
                  <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.target_id ?? ''} disabled={rule.applies_to_all} onChange={(e) => updateRule(idx, { target_id: e.target.value })} placeholder="Attraction/Combo ID" />
                </div>
                <div className="flex items-center gap-2">
                  <input id={`applies-${idx}`} type="checkbox" checked={!!rule.applies_to_all} onChange={(e) => updateRule(idx, { applies_to_all: e.target.checked })} />
                  <label htmlFor={`applies-${idx}`} className="text-xs text-gray-600">Applies to all of this type</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date From</label>
                  <input type="date" className="w-full rounded-md border px-3 py-2" value={rule.date_from || ''} onChange={(e) => updateRule(idx, { date_from: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date To</label>
                  <input type="date" className="w-full rounded-md border px-3 py-2" value={rule.date_to || ''} onChange={(e) => updateRule(idx, { date_to: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Time From</label>
                  <input type="time" className="w-full rounded-md border px-3 py-2" value={rule.time_from || ''} onChange={(e) => updateRule(idx, { time_from: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Time To</label>
                  <input type="time" className="w-full rounded-md border px-3 py-2" value={rule.time_to || ''} onChange={(e) => updateRule(idx, { time_to: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slot Type</label>
                  <select className="w-full rounded-md border px-3 py-2" value={rule.slot_type || ''} onChange={(e) => updateRule(idx, { slot_type: e.target.value })}>
                    <option value="">—</option>
                    <option value="attraction">Attraction</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slot ID</label>
                  <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.slot_id ?? ''} onChange={(e) => updateRule(idx, { slot_id: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.priority ?? 100} onChange={(e) => updateRule(idx, { priority: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rule Discount Type</label>
                  <select className="w-full rounded-md border px-3 py-2" value={rule.rule_discount_type || ''} onChange={(e) => updateRule(idx, { rule_discount_type: e.target.value })}>
                    <option value="">Use Offer Default</option>
                    {DISCOUNT_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rule Discount Value</label>
                  <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.rule_discount_value ?? ''} onChange={(e) => updateRule(idx, { rule_discount_value: e.target.value })} placeholder="Optional" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>

      {state.error ? <div className="mt-2 text-sm text-red-600">{state.error?.message || 'Error'}</div> : null}
    </form>
  );
}