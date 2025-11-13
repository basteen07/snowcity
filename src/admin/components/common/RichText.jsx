import React from 'react';

export default function RichText({ value, onChange, placeholder = 'Type here…', height = 260 }) {
  const ref = React.useRef({ Editor: null });
  const [, force] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer 'react-quill-new' if available (present in deps)
        const mod2 = await import('react-quill-new');
        try { await import('react-quill-new/dist/quill.snow.css'); } catch {}
        if (mounted) {
          ref.current.Editor = mod2.default || mod2;
          force();
          return;
        }
      } catch { /* fallback to react-quill (optional) */ }

      try {
        // Fallback: attempt official 'react-quill' without letting Vite prebundle it
        const name = 'react-quill';
        const mod = await import(/* @vite-ignore */ name);
        try { await import(/* @vite-ignore */ `${name}/dist/quill.snow.css`); } catch {}
        if (mounted) {
          ref.current.Editor = mod.default || mod;
          force();
          return;
        }
      } catch (e) {
        console.warn('RichText: editor not available. Using textarea fallback.', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!ref.current.Editor) {
    // Fallback: simple textarea (editable, no toolbar)
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: height }}
        className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
      />
    );
  }

  const ReactQuill = ref.current.Editor;
  return (
    <div className="richtext">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={(v) => onChange?.(v)}
        placeholder={placeholder}
        style={{ minHeight: height }}
      />
    </div>
  );
}