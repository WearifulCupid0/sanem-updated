"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './navegation.module.css';
import authService from '../../../services/authService';
import {
  FaHome, FaBoxes, FaHandHoldingHeart, FaUsers, FaChartBar,
  FaCog, FaUser, FaQuestionCircle, FaShoppingCart, FaBars, FaTimes
} from 'react-icons/fa';

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    const user = authService.getUser();
    setRole(String(user?.role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  }, []);

  const isActive = (path) => path === '/home' ? pathname === path : pathname?.startsWith(path);
  const isAdministrator = role.includes('admin');
  const isEvaluator = role.includes('evaluator') || role.includes('avaliador');
  const isCollaborator = role.includes('attendant') || role.includes('atendente') || role.includes('colaborador') || role.includes('collaborator');

  const closeMenu = () => setIsOpen(false);
  const itemClass = (path) => `${styles.menuItem} ${isActive(path) ? styles.active : ''}`;

  return (
    <>
      <button
        type="button"
        className={styles.mobileMenuButton}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      {isOpen && <button type="button" className={styles.mobileOverlay} aria-label="Fechar menu" onClick={closeMenu} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoContainer}>
          <Image src="/logo-sanem.svg" alt="SANEM" width={80} height={80} />
        </div>
        <div className={styles.sectionTitle}>MENU</div>
        <nav className={styles.menuSection}>
          {!isEvaluator && (
            <>
              <Link href="/home" onClick={closeMenu} className={itemClass('/home')}><FaHome /> Home</Link>
              <Link href="/estoque" onClick={closeMenu} className={itemClass('/estoque')}><FaBoxes /> Estoque</Link>
              <Link href="/doacao/lista" onClick={closeMenu} className={itemClass('/doacao')}><FaHandHoldingHeart /> Doações</Link>
              <Link href="/retirada" onClick={closeMenu} className={itemClass('/retirada')}><FaShoppingCart /> Retirada</Link>
              <Link href="/cadastrodoador/lista" onClick={closeMenu} className={itemClass('/cadastrodoador')}><FaHandHoldingHeart /> Doadores</Link>
            </>
          )}
          <Link href="/cadastrobeneficiario/lista" onClick={closeMenu} className={itemClass('/cadastrobeneficiario')}><FaUsers /> Beneficiários</Link>
        </nav>
        <div className={styles.sectionTitle}>OUTROS</div>
        <nav className={styles.menuSection}>
          {!isEvaluator && <Link href="/relatorios" onClick={closeMenu} className={itemClass('/relatorios')}><FaChartBar /> Relatórios</Link>}
          {isAdministrator && <>
            <Link href="/configuracoes" onClick={closeMenu} className={itemClass('/configuracoes')}><FaCog /> Configurações</Link>
            <Link href="/usuarios" onClick={closeMenu} className={itemClass('/usuarios')}><FaUser /> Usuários</Link>
          </>}
          <Link href="/ajuda" onClick={closeMenu} className={itemClass('/ajuda')}><FaQuestionCircle /> Ajuda</Link>
        </nav>
        {!isAdministrator && !isEvaluator && !isCollaborator && (
          <p className={styles.roleNotice}>Perfil sem permissões configuradas. Contate um administrador.</p>
        )}
      </aside>
    </>
  );
}
