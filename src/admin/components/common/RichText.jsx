import React from 'react';
import uploadAdminMedia from '../../utils/uploadMedia';

export default function RichText({ value, onChange, placeholder = 'Type here…', height = 260 }) {
  const ref = React.useRef({ Editor: null });
  const quillRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const [, force] = React.useReducer((x) => x + 1, 0);
  const [uploading, setUploading] = React.useState(false);
  const [uploadErr, setUploadErr] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [imageWidth, setImageWidth] = React.useState(100);
  const dragStateRef = React.useRef({ index: null, src: null });
  const [editorReady, setEditorReady] = React.useState(false);
  const [dragHint, setDragHint] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer 'react-quill-new' (present in deps)
        const mod2 = await import('react-quill-new');
        try { await import('react-quill-new/dist/quill.snow.css'); } catch {}
        if (mounted) {
          ref.current.Editor = mod2.default || mod2;
          force();
          setEditorReady(true);
          return;
        }
      } catch (e) {
        console.warn('RichText: editor not available. Using textarea fallback.', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSelectImage = React.useCallback(() => {
    setUploadErr('');
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadErr('');
      const url = await uploadAdminMedia(file);
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const range = quill.getSelection(true);
      const insertAt = range ? range.index : quill.getLength();
      quill.insertEmbed(insertAt, 'image', url, 'user');
      quill.setSelection(insertAt + 1);
    } catch (err) {
      setUploadErr(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const applyWidth = React.useCallback(
    (node, pct) => {
      if (!node) return;
      const clamped = Math.min(100, Math.max(20, pct));
      node.style.width = `${clamped}%`;
      node.style.maxWidth = '100%';
      node.dataset.widthPct = String(clamped);
    },
    []
  );

  const onSelectionChange = React.useCallback(
    (range) => {
      if (!range) {
        setSelectedImage(null);
        return;
      }
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const [leaf] = quill.getLeaf(range.index);
      if (leaf && leaf.domNode && leaf.domNode.tagName === 'IMG') {
        setSelectedImage(leaf.domNode);
        const pct = Number(leaf.domNode.dataset.widthPct || 100);
        setImageWidth(Number.isFinite(pct) ? pct : 100);
      } else {
        setSelectedImage(null);
      }
    },
    []
  );

  const onWidthChange = (pct) => {
    setImageWidth(pct);
    applyWidth(selectedImage, pct);
  };

  React.useEffect(() => {
    if (!editorReady) return undefined;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return undefined;
    const root = quill.root;
    const getRangeFromPoint = (event) => {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(event.clientX, event.clientY);
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
          const range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
          return range;
        }
      }
      return null;
    };

    const handleDragStart = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.tagName !== 'IMG') return;
      const quillInstance = quillRef.current?.getEditor?.();
      if (!quillInstance) return;
      const QuillConstructor = quillInstance.constructor;
      const blot = QuillConstructor.find(event.target, true);
      if (!blot) return;
      const index = quillInstance.getIndex(blot);
      dragStateRef.current = { index, src: event.target.getAttribute('src') };
      event.dataTransfer?.setData('text/plain', 'drag-image');
      event.dataTransfer?.setDragImage(event.target, event.target.width / 2, event.target.height / 2);
    };

    const handleDragOver = (event) => {
      if (!dragStateRef.current.src) return;
      event.preventDefault();
    };

    const handleDrop = (event) => {
      const { index: fromIndex, src } = dragStateRef.current;
      if (fromIndex == null || !src) return;
      event.preventDefault();
      const quillInstance = quillRef.current?.getEditor?.();
      if (!quillInstance) return;
      const range = getRangeFromPoint(event);
      let insertIndex = quillInstance.getLength();
      if (range) {
        const QuillConstructor = quillInstance.constructor;
        const blot = QuillConstructor.find(range.startContainer, true);
        if (blot) insertIndex = quillInstance.getIndex(blot);
      }
      let targetIndex = insertIndex;
      if (targetIndex > fromIndex) targetIndex -= 1;
      quillInstance.deleteText(fromIndex, 1, 'user');
      quillInstance.insertEmbed(targetIndex, 'image', src, 'user');
      quillInstance.setSelection(targetIndex + 1, 0, 'user');
      dragStateRef.current = { index: null, src: null };
    };

    const handleMouseOver = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.tagName !== 'IMG') return;
      event.target.setAttribute('draggable', 'true');
      const imageRect = event.target.getBoundingClientRect();
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      if (!wrapperRect) return;
      setDragHint({
        left: imageRect.left - wrapperRect.left + wrapperRef.current.scrollLeft,
        top: imageRect.top - wrapperRect.top + wrapperRef.current.scrollTop - 30,
        width: imageRect.width,
      });
    };

    const handleMouseOut = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.tagName !== 'IMG') return;
      setDragHint(null);
    };

    root.addEventListener('dragstart', handleDragStart);
    root.addEventListener('dragover', handleDragOver);
    root.addEventListener('drop', handleDrop);
    root.addEventListener('mouseover', handleMouseOver);
    root.addEventListener('mouseout', handleMouseOut);
    return () => {
      root.removeEventListener('dragstart', handleDragStart);
      root.removeEventListener('dragover', handleDragOver);
      root.removeEventListener('drop', handleDrop);
      root.removeEventListener('mouseover', handleMouseOver);
      root.removeEventListener('mouseout', handleMouseOut);
    };
  }, [editorReady]);

  const modules = React.useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: {
          image: handleSelectImage,
        }
      }
    }),
    [handleSelectImage]
  );

  const EditorComponent = ref.current.Editor;

  if (!EditorComponent) {
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

  return (
    <div ref={wrapperRef} className="richtext space-y-2 relative">
      <EditorComponent
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(v) => onChange?.(v)}
        onChangeSelection={onSelectionChange}
        placeholder={placeholder}
        style={{ minHeight: height }}
        modules={modules}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploading ? <div className="text-xs text-gray-500">Uploading image…</div> : null}
      {uploadErr ? <div className="text-xs text-red-600">{uploadErr}</div> : null}
      {selectedImage ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed p-2 text-sm">
          <div className="font-medium">Selected image controls</div>
          <label className="text-xs">Width: {imageWidth}%</label>
          <input
            type="range"
            min={20}
            max={100}
            value={imageWidth}
            onChange={(e) => onWidthChange(Number(e.target.value))}
          />
          <div className="flex gap-2 text-xs">
            <button type="button" className="px-2 py-1 rounded-md border" onClick={() => onWidthChange(100)}>
              Reset width
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-md border"
              onClick={() => selectedImage && applyWidth(selectedImage, 50)}
            >
              50%
            </button>
          </div>
        </div>
      ) : null}
      {dragHint ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: dragHint.left, top: Math.max(0, dragHint.top) }}
        >
          <div className="rounded-full bg-gray-900/80 text-white text-xs px-3 py-1 shadow">
            Drag image to reposition
          </div>
        </div>
      ) : null}
    </div>
  );
}