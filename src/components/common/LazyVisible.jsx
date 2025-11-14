import React from 'react';

export default function LazyVisible({
  rootMargin = '200px',
  once = true,
  minHeight = 0,
  placeholder = null,
  className = '',
  children
}) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let obs;
    if (ref.current && !visible) {
      obs = new IntersectionObserver(
        (entries) => {
          const ent = entries[0];
          if (ent.isIntersecting) {
            setVisible(true);
            if (once && obs) obs.disconnect();
          }
        },
        { root: null, rootMargin, threshold: 0.01 }
      );
      obs.observe(ref.current);
    }
    return () => obs && obs.disconnect();
  }, [visible, rootMargin, once]);

  const style = minHeight ? { minHeight } : undefined;
  return (
    <div ref={ref} className={className} style={style}>
      {visible ? children : placeholder}
    </div>
  );
}