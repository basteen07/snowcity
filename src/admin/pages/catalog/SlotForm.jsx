import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

export default function SlotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      attraction_id: '',
      date: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      capacity: 0,
      duration_minutes: 60,
      price: '',
      available: true
    }
  });
  const [attractions, setAttractions] = React.useState([]);

  React.useEffect(() => {
    // load attractions for dropdown
    (async () => {
      try {
        const res = await adminApi.get(A.attractions());
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setAttractions(items);
      } catch {}
    })();
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(A.slotById(id));
        const s = res || {};
        setState((st) => ({ ...st, status: 'idle', form: {
          attraction_id: s.attraction_id || '',
          date: s.start_date || '',
          start_date: s.start_date || '',
          end_date: s.end_date || '',
          start_time: s.start_time_12h || s.start_time || '',
          end_time: s.end_time_12h || s.end_time || '',
          capacity: s.capacity || 0,
          duration_minutes: st.form.duration_minutes,
          price: s.price ?? st.form.price,
          available: !!s.available
        }}));
      } catch (err) {
        setState((st) => ({ ...st, status: 'failed', error: err }));
      }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // For edit, support updating any field directly
        const payload = { ...state.form };
        if (!payload.start_date && payload.date) payload.start_date = payload.date;
        if (!payload.end_date && payload.start_date) payload.end_date = payload.start_date;
        await adminApi.put(A.slotById(id), payload);
      } else {
        const f = state.form;
        // Single day create uses `date`
        const hasSingle = f.date && f.start_time && f.end_time;
        const hasRange = f.start_date && f.end_date && f.start_time && f.end_time;
        const dur = Number(f.duration_minutes || 0);
        if (hasRange && dur > 0) {
          const payload = {
            attraction_id: f.attraction_id,
            start_date: f.start_date,
            end_date: f.end_date,
            start_time: f.start_time,
            end_time: f.end_time,
            duration_minutes: dur,
            capacity: Number(f.capacity || 0),
            price: f.price === '' ? null : Number(f.price),
            available: !!f.available,
          };
          await adminApi.post(A.slotsBulk(), payload);
        } else if (hasSingle) {
          const payload = {
            attraction_id: f.attraction_id,
            date: f.date,
            start_time: f.start_time,
            end_time: f.end_time,
            capacity: Number(f.capacity || 0),
            price: f.price === '' ? null : Number(f.price),
            available: !!f.available
          };
          await adminApi.post(A.slots(), payload);
        } else {
          alert('Please fill Date, Start Time, End Time and Capacity');
          return;
        }
      }
      navigate('/admin/catalog/slots');
    } catch (err) {
      setState((st) => ({ ...st, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;
  return (
    <form onSubmit={save} className="max-w-2xl bg-white border rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Slot</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Attraction</label>
          <select className="w-full rounded-md border px-3 py-2" value={f.attraction_id} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, attraction_id: e.target.value } }))} required>
            <option value="">— Select attraction —</option>
            {attractions.map((a) => (
              <option key={a.attraction_id} value={a.attraction_id}>{a.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Capacity</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={f.capacity} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, capacity: Number(e.target.value || 0) } }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Price (optional)</label>
          <input type="number" step="0.01" className="w-full rounded-md border px-3 py-2" value={f.price} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, price: e.target.value } }))} />
        </div>
        {!isEdit ? (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Duration Minutes (for range bulk)</label>
              <input type="number" className="w-full rounded-md border px-3 py-2" value={f.duration_minutes} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, duration_minutes: Number(e.target.value || 0) } }))} />
            </div>
          </>
        ) : null}
        {isEdit ? (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input type="date" className="w-full rounded-md border px-3 py-2" value={f.start_date} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, start_date: e.target.value } }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input type="date" className="w-full rounded-md border px-3 py-2" value={f.end_date} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, end_date: e.target.value } }))} />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input type="date" className="w-full rounded-md border px-3 py-2" value={f.date} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, date: e.target.value } }))} />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Time</label>
          <input type="text" placeholder="01.00pm" className="w-full rounded-md border px-3 py-2" value={f.start_time} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, start_time: e.target.value } }))} />
          <div className="text-xs text-gray-500 mt-1">Use 12-hour (01.00pm) or 24-hour (13:00)</div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Time</label>
          <input type="text" placeholder="02.00pm" className="w-full rounded-md border px-3 py-2" value={f.end_time} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, end_time: e.target.value } }))} />
        </div>
        <div className="flex items-center gap-2">
          <input id="available" type="checkbox" checked={!!f.available} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, available: e.target.checked } }))} />
          <label htmlFor="available" className="text-sm text-gray-700">Available</label>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}