import React from 'react';
import { useSelector } from 'react-redux';

export default function PermissionGate({ anyOf = [], allOf = [], children, fallback = null }) {
  const perms = useSelector((s) => s.adminAuth?.perms || []);
  const roles = useSelector((s) => s.adminAuth?.user?.roles || []);
  const roleSet = new Set((roles || []).map((r) => String(r).toLowerCase()));

  // Root (and optionally superadmin) bypass all UI checks
  if (roleSet.has('root') || roleSet.has('superadmin')) return children;

  const hasAll = allOf.length ? allOf.every((p) => perms.includes(p)) : true;
  const hasAny = anyOf.length ? anyOf.some((p) => perms.includes(p)) : true;
  if (hasAll && hasAny) return children;
  return fallback || null;
}