"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '../services/authService';
import apiService from '../services/api';

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [consentRequired, setConsentRequired] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const authenticated = await authService.validateToken();
        if (!active) return;
        setIsAuthenticated(authenticated);
        if (!authenticated) {
          router.replace('/');
          return;
        }
        const user = authService.getUser();
        setConsentRequired(user?.privacyConsent !== true);
      } catch (authError) {
        console.error('Erro na verificação de autenticação:', authError);
        if (active) router.replace('/');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    checkAuth();
    return () => { active = false; };
  }, [router]);

  const acceptConsent = async () => {
    setConsentBusy(true);
    setError('');
    try {
      await apiService.acceptPrivacyConsent();
      const user = authService.getUser() || {};
      authService.updateUser({ ...user, privacyConsent: true, privacyConsentVersion: 'SANEM-PRIVACY-1.0' });
      setConsentRequired(false);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível registrar o consentimento.');
    } finally {
      setConsentBusy(false);
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Carregando...</div>;
  }
  if (!isAuthenticated) return null;

  return (
    <>
      {children}
      {consentRequired && (
        <div role="dialog" aria-modal="true" aria-labelledby="privacy-title" style={overlayStyle}>
          <section style={dialogStyle}>
            <h2 id="privacy-title">Privacidade e proteção de dados</h2>
            <p>
              Para continuar usando o sistema, leia a Política de Privacidade da SANEM.
              Ela explica quais dados da conta são utilizados, para quais finalidades,
              como são protegidos e como solicitar informações ou a revogação do consentimento.
            </p>
            <p style={{ marginTop: 12 }}>
              O consentimento será registrado com data, horário e versão da política.
              A recusa impede o acesso às funcionalidades autenticadas, mas não apaga automaticamente
              registros que precisem ser mantidos por outra base legal.
            </p>
            <p style={{ marginTop: 14 }}>
              <Link href="/politica-privacidade" target="_blank" rel="noreferrer">Ler a Política de Privacidade</Link>
            </p>
            {error && <p role="alert" style={{ color: '#b42318', marginTop: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => authService.logout()} style={secondaryButtonStyle}>Não aceito / Sair</button>
              <button type="button" onClick={acceptConsent} disabled={consentBusy} style={primaryButtonStyle}>
                {consentBusy ? 'Registrando...' : 'Li e aceito'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: 16, background: 'rgba(15, 23, 42, 0.68)'
};
const dialogStyle = {
  width: 'min(100%, 560px)', maxHeight: '90vh', overflowY: 'auto', padding: 28,
  borderRadius: 16, background: '#fff', color: '#1f2937', boxShadow: '0 20px 60px rgba(0,0,0,.25)'
};
const primaryButtonStyle = {
  border: 0, borderRadius: 8, padding: '12px 18px', color: '#fff', background: '#1976d2',
  fontWeight: 700, cursor: 'pointer'
};
const secondaryButtonStyle = {
  border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 18px', color: '#334155',
  background: '#fff', fontWeight: 600, cursor: 'pointer'
};
