// src/components/cms/CMSBlock.jsx
import React from 'react';
import HtmlContent from './HtmlContent';

export default function CMSBlock({ html, className }) {
  return <HtmlContent html={html} className={className} />;
}