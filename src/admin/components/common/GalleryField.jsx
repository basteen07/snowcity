import React from 'react';
import ImageUploader from './ImageUploader';

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return Array.isArray(value?.data) ? value.data : [];
}

export default function GalleryField({
  label = 'Gallery images',
  helper = 'Upload or paste multiple images to reuse across the page/blog.',
  value,
  onChange
}) {
  const list = normalizeList(value);

  const emit = React.useCallback(
    (next) => {
      const filtered = next.filter((item) => item && typeof item === 'string');
      onChange?.(filtered);
    },
    [onChange]
  );

  const updateItem = (idx, url) => {
    const next = [...list];
    next[idx] = url;
    emit(next);
  };

  const removeItem = (idx) => {
    const next = list.filter((_, i) => i !== idx);
    emit(next);
  };

  const addItem = () => {
    emit([...list, '']);
  };

  return (
    <div className="rounded-lg border dark:border-neutral-800 p-3 space-y-3">
      <div>
        <div className="text-sm font-medium text-gray-800 dark:text-neutral-100">{label}</div>
        {helper ? <div className="text-xs text-gray-500 dark:text-neutral-400">{helper}</div> : null}
      </div>

      {list.length === 0 ? (
        <div className="text-xs text-gray-500 dark:text-neutral-400">
          No images yet. Use "Add image" to upload multiple assets.
        </div>
      ) : null}

      {list.map((url, idx) => (
        <div key={`gallery-${idx}`} className="rounded-md border border-dashed dark:border-neutral-700 p-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-neutral-300">
            <span>Image #{idx + 1}</span>
            <button
              type="button"
              className="text-red-600 hover:underline"
              onClick={() => removeItem(idx)}
            >
              Remove
            </button>
          </div>
          <ImageUploader
            label=""
            value={url}
            onChange={(newUrl) => updateItem(idx, newUrl)}
          />
        </div>
      ))}

      <button
        type="button"
        className="px-3 py-2 rounded-md border text-sm"
        onClick={addItem}
      >
        Add image
      </button>
    </div>
  );
}
