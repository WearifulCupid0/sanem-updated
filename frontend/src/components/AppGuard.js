"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProtectedRoute from './ProtectedRoute';
import authService from '../services/authService';

const PUBLIC_PATHS = ['/', '/politica-privacidade', '/sucesso'];
const ADMIN_PATHS = ['/usuarios', '/configuracoes'];
const EVALUATOR_RESTRICTED_PATHS = ['/home', '/estoque', '/doacao', '/retirada', '/cadastrodoador', '/relatorios'];

export default function AppGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState('');
  const [roleLoaded, setRoleLoaded] = useState(false);

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname?.startsWith(`${path}/`)));

  useEffect(() => {
    if (isPublic) return;
    const user = authService.getUser();
    setRole(String(user?.role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
    setRoleLoaded(true);
  }, [isPublic, pathname]);

  const isAdministrator = role.includes('admin');
  const isEvaluator = role.includes('evaluator') || role.includes('avaliador');
  const requiresAdministrator = ADMIN_PATHS.some((path) => pathname?.startsWith(path));
  const restrictedForEvaluator = EVALUATOR_RESTRICTED_PATHS.some((path) => pathname?.startsWith(path));
  const denied = (requiresAdministrator && !isAdministrator) || (isEvaluator && restrictedForEvaluator);

  useEffect(() => {
    if (!isPublic && roleLoaded && denied) {
      router.replace(isEvaluator ? '/cadastrobeneficiario/lista' : '/home');
    }
  }, [denied, isEvaluator, isPublic, roleLoaded, router]);

  if (isPublic) return children;
  if (denied) return null;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
