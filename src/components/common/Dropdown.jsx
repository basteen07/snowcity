import React from 'react';

export default function Dropdown({
  button,
  children,
  align = 'left',
  className = ''
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={() => setOpen((v) => !v)}>{button}</div>
      {open ? (
        <div className={`absolute ${alignClass} top-full mt-2 w-64 rounded-xl border bg-white shadow-lg p-2 z-50`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}