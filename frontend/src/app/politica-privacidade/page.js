"use client";

import { useState } from 'react';
import Link from 'next/link';
import authService from '../../services/authService';
import apiService from '../../services/api';

export default function PoliticaPrivacidadePage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const revokeConsent = async () => {
    if (!authService.isAuthenticated()) {
      setStatus('Entre no sistema para solicitar a revogação do consentimento.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await apiService.revokePrivacyConsent();
      const user = authService.getUser() || {};
      authService.updateUser({ ...user, privacyConsent: false });
      setStatus('Consentimento revogado. A sessão será encerrada.');
      setTimeout(() => authService.logout(), 1200);
    } catch (error) {
      setStatus(error.message || 'Não foi possível revogar o consentimento.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '24px', background: '#fff', borderRadius: 12, lineHeight: 1.65 }}>
      <h1>Política de Privacidade — SANEM</h1>
      <p><strong>Versão:</strong> SANEM-PRIVACY-1.0</p>
      <p>
        Esta política descreve o tratamento de dados pessoais realizado pelo sistema de gerenciamento
        do brechó beneficente da SANEM. Antes da publicação, a organização responsável deve revisar
        este texto, preencher seus canais oficiais de contato e confirmar as bases legais aplicáveis.
      </p>

      <h2>1. Dados tratados</h2>
      <p>O sistema pode tratar nome, login, endereço de e-mail, credenciais protegidas por hash, perfil de acesso e registros de atividade necessários à operação da conta.</p>

      <h2>2. Finalidades</h2>
      <p>Os dados são utilizados para autenticação, gerenciamento de usuários, aplicação de permissões, segurança, auditoria operacional e comunicação relacionada ao funcionamento do sistema.</p>

      <h2>3. Segurança</h2>
      <p>As senhas são armazenadas por hash, as rotas autenticadas verificam o perfil do usuário e a publicação deve ocorrer por HTTPS. O acesso aos dados deve ser limitado às pessoas que necessitam deles para suas atividades.</p>

      <h2>4. Compartilhamento e retenção</h2>
      <p>Os dados não devem ser compartilhados fora das finalidades informadas, salvo obrigação legal ou outra hipótese legal aplicável. O período de retenção deve ser definido pela SANEM conforme a finalidade e as obrigações pertinentes.</p>

      <h2>5. Direitos do titular</h2>
      <p>O titular pode solicitar confirmação do tratamento, acesso, correção, informações sobre compartilhamento e, quando cabível, eliminação ou anonimização. Também pode revogar o consentimento, sem afetar tratamentos baseados em outras hipóteses legais.</p>

      <h2>6. Contato</h2>
      <p>A SANEM deve disponibilizar aqui um endereço de e-mail ou canal oficial para solicitações dos titulares e contato com o encarregado, quando aplicável.</p>

      <p style={{ marginTop: 24 }}><Link href="/home">Voltar ao sistema</Link></p>
      <button type="button" onClick={revokeConsent} disabled={busy} style={{ marginTop: 16, padding: '11px 16px', background: '#b42318', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}>
        {busy ? 'Processando...' : 'Revogar consentimento e encerrar sessão'}
      </button>
      {status && <p role="status" style={{ marginTop: 12 }}>{status}</p>}
    </main>
  );
}
