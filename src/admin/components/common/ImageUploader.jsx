import React from 'react';
import adminApi from '../../services/adminApi';

const ENDPOINT = import.meta.env?.VITE_ADMIN_UPLOAD_ENDPOINT || '/api/admin/uploads';
const CLOUD_PRESET = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export default function ImageUploader({
  label = 'Image',
  value,
  onChange,
  fieldName = 'file',
  extra = {},
  accept = 'image/*',
  requiredPerm = null
}) {
  const inputId = React.useId();
  const [file, setFile] = React.useState(null);
  const [fileName, setFileName] = React.useState('');
  const [preview, setPreview] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle|loading|done|error
  const [errMsg, setErrMsg] = React.useState('');
  const canUpload = true;

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name || '');
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = (e) => {
    const f = e.target.files?.[0] || null;
    setErrMsg('');
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0] || null;
    if (f) {
      setErrMsg('');
      setFile(f);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearSelected = () => {
    setFile(null);
    setPreview('');
    setFileName('');
  };

  const upload = async () => {
    if (!file) return;
    if (!ENDPOINT) {
      setErrMsg('Upload endpoint not configured.');
      return;
    }

    setStatus('loading');
    setErrMsg('');
    try {
      const isCloudinary = /cloudinary\.com/i.test(ENDPOINT);
      const data = { ...(extra || {}) };
      if (isCloudinary && CLOUD_PRESET && !data.upload_preset) data.upload_preset = CLOUD_PRESET;

      const res = await adminApi.upload(ENDPOINT, file, { fieldName, data });
      const url = res?.url || res?.url_path || res?.secure_url || res?.location || res?.data?.url || '';
      if (!url) throw new Error(res?.message || 'Upload response missing URL');

      onChange?.(url);
      setStatus('done');
      clearSelected();
    } catch (err) {
      setStatus('error');
      setErrMsg(err?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">{label}</label>

      {/* URL field */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          placeholder="https://..."
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>

      {/* Drop zone + Choose */}
      <div
        className="mt-2 rounded-md border border-dashed px-3 py-3 text-sm text-gray-600 dark:text-neutral-300 dark:border-neutral-700"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Input is sr-only, activated by label for reliability */}
          <input
            id={inputId}
            type="file"
            accept={accept}
            onChange={onPick}
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm cursor-pointer dark:border-neutral-700 dark:text-neutral-200"
            role="button"
          >
            Choose
          </label>

          <button
            className="inline-flex items-center rounded-md bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50"
            onClick={upload}
            disabled={!file || status === 'loading'}
            type="button"
          >
            {status === 'loading' ? 'Uploading…' : 'Upload'}
          </button>

          {fileName ? <span className="text-xs text-gray-500 dark:text-neutral-400">Selected: {fileName}</span> : null}
          {file ? (
            <button
              className="inline-flex items-center rounded-md border px-2 py-1 text-xs dark:border-neutral-700 dark:text-neutral-200"
              onClick={clearSelected}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
          Drag a file here, or click Choose to select.
        </div>
      </div>

      {/* Previews */}
      <div className="mt-2 flex items-center gap-3">
        {preview ? <img src={preview} alt="preview" className="h-16 w-16 object-cover rounded-md border dark:border-neutral-800" /> : null}
        {value ? <img src={value} alt="current" className="h-16 w-16 object-cover rounded-md border dark:border-neutral-800" /> : null}
      </div>

      {/* Errors */}
      {errMsg ? <div className="text-xs text-red-600 mt-2">{errMsg}</div> : null}
    </div>
  );
}