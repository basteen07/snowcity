import React from 'react';
import DOMPurify from 'dompurify';
import parse, { domToReact } from 'html-react-parser';

const sanitizeCfg = { ADD_ATTR: ['target','rel','style'] };

export default function HtmlContent({ html, className = 'prose max-w-none' }) {
  const safe = React.useMemo(() => DOMPurify.sanitize(html || '', sanitizeCfg), [html]);
  const options = {
    replace: (node) => {
      if (node.type === 'tag' && node.name === 'a') {
        const href = node.attribs?.href || '';
        const external = /^https?:\/\//i.test(href);
        const props = {
          ...node.attribs,
          rel: node.attribs?.rel || (external ? 'noopener noreferrer' : undefined),
          target: node.attribs?.target || (external ? '_blank' : undefined),
        };
        return <a {...props}>{domToReact(node.children, options)}</a>;
      }
      return undefined;
    },
  };
  return <div className={className}>{parse(safe, options)}</div>;
}