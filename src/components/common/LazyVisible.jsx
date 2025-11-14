import React from 'react';

export default function LazyVisible({ rootMargin = '200px', once = true, children }) {
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

  return <div ref={ref}>{visible ? children : null}</div>;
}