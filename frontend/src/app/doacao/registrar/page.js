"use client";

import React, { useEffect, useMemo, useState } from 'react';
import MenuBar from '../../components/menubar/menubar';
import Navigation from '../../components/navegation/navegation';
import { useRouter } from 'next/navigation';
import styles from './registrar.module.css';
import apiService from '../../../services/api';
import { useNotification } from '../../../components/notifications/NotificationProvider';
import { mapDonorFromBackend, mapItemFromBackend } from '../../../services/dataMapper';
import authService from '../../../services/authService';
import { FaPlus, FaTrash, FaMinus } from 'react-icons/fa';

const CONSERVATION_STATES = [
  { value: 'NEW', label: 'Novo' },
  { value: 'GOOD', label: 'Bom' },
  { value: 'FAIR', label: 'Regular' },
  { value: 'POOR', label: 'Ruim' }
];

export default function RegistrarDoacaoPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [donors, setDonors] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchDonor, setSearchDonor] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const [donorData, itemData, categoryData] = await Promise.all([
          apiService.getDonors(),
          apiService.getItems(),
          apiService.getCategories()
        ]);
        if (!active) return;
        setDonors((donorData || []).map(mapDonorFromBackend));
        setItems((itemData || []).map(mapItemFromBackend));
        setCategories(categoryData || []);
      } catch (error) {
        console.error('Erro ao carregar opções da doação:', error);
        showNotification(error.message || 'Não foi possível carregar os dados da doação.', 'error');
      }
    };
    loadOptions();
    return () => { active = false; };
  // Os dados de formulário são carregados uma vez ao abrir a tela.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDonors = useMemo(() => donors.filter((donor) =>
    donor.nomeCompleto?.toLowerCase().includes(searchDonor.toLowerCase())
    || donor.cpf?.includes(searchDonor)), [donors, searchDonor]);

  const filteredItems = useMemo(() => items.filter((item) =>
    item.nome?.toLowerCase().includes(searchItem.toLowerCase())), [items, searchItem]);

  const addExistingItem = (item) => {
    // Linhas separadas permitem classificar unidades do mesmo item com categorias/estados distintos.
    setSelectedItems((current) => [...current, {
      lineId: `item-${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      isNew: false,
      itemId: item.id,
      name: item.nome,
      quantity: 1,
      categoryId: '',
      conservationState: 'GOOD'
    }]);
  };

  const addNewItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    setSelectedItems((current) => [...current, {
      lineId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      isNew: true,
      itemId: null,
      name,
      quantity: 1,
      categoryId: '',
      conservationState: 'GOOD'
    }]);
    setNewItemName('');
  };

  const updateLine = (lineId, changes) => {
    setSelectedItems((current) => current.map((line) =>
      line.lineId === lineId ? { ...line, ...changes } : line));
  };

  const removeLine = (lineId) => {
    setSelectedItems((current) => current.filter((line) => line.lineId !== lineId));
  };

  const updateQuantity = (line, amount) => {
    updateLine(line.lineId, { quantity: Math.max(1, line.quantity + amount) });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDonor) {
      showNotification('Selecione o doador da entrada.', 'error');
      return;
    }
    if (selectedItems.length === 0) {
      showNotification('Adicione pelo menos um item à doação.', 'error');
      return;
    }
    const incompleteLine = selectedItems.find((line) => !line.categoryId || !line.conservationState);
    if (incompleteLine) {
      showNotification(`Informe a categoria e o estado de conservação de "${incompleteLine.name}".`, 'error');
      return;
    }
    const user = authService.getUser();
    if (!user?.id) {
      showNotification('Sessão inválida. Entre novamente no sistema.', 'error');
      authService.logout();
      return;
    }

    setSubmitting(true);
    try {
      const donationData = {
        donationDate: new Date().toISOString(),
        donorId: selectedDonor.id,
        attendantUserId: user.id,
        items: selectedItems.map((line) => ({
          itemId: line.isNew ? null : line.itemId,
          newItemName: line.isNew ? line.name : null,
          quantity: Number(line.quantity),
          categoryId: Number(line.categoryId),
          conservationState: line.conservationState
        }))
      };

      await apiService.createDonation(donationData);
      showNotification('Doação registrada e estoque atualizado com sucesso!', 'success');
      router.push('/doacao/lista');
    } catch (error) {
      console.error('Erro ao registrar doação:', error);
      showNotification(error.message || 'Não foi possível registrar a doação.', 'error');
      setSubmitting(false);
    }
  };

  const totalItems = selectedItems.reduce((total, line) => total + line.quantity, 0);

  return (
    <div className={styles.containerGeral}>
      <MenuBar />
      <Navigation />
      <main className={styles.contentWrapper}>
        <section className={styles.formContainer}>
          <h1 className={styles.titulo}>Registrar Doação</h1>
          <div className={styles.decoracao} />

          <form onSubmit={handleSubmit}>
            <section className={styles.section}>
              <h2>1. Doador</h2>
              <label htmlFor="donor-search">Buscar doador por nome ou CPF</label>
              <input
                id="donor-search"
                type="search"
                placeholder="Digite o nome ou CPF do doador..."
                value={searchDonor}
                onChange={(event) => setSearchDonor(event.target.value)}
                className={styles.searchInput}
                disabled={!!selectedDonor}
              />
              {!selectedDonor && searchDonor && (
                <div className={styles.dropdown}>
                  {filteredDonors.length === 0 ? (
                    <div className={styles.dropdownItem}>Nenhum doador encontrado.</div>
                  ) : filteredDonors.map((donor) => (
                    <button
                      type="button"
                      key={donor.id}
                      className={styles.dropdownItem}
                      onClick={() => { setSelectedDonor(donor); setSearchDonor(''); }}
                    >
                      <strong>{donor.nomeCompleto}</strong>
                      <span>CPF/CNPJ: {donor.cpf || 'Não informado'}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedDonor && (
                <div className={styles.selectedBeneficiary}>
                  <div>
                    <strong>{selectedDonor.nomeCompleto}</strong>
                    <span>Documento: {selectedDonor.cpf || 'Não informado'}</span>
                  </div>
                  <button type="button" className={styles.removeButton} onClick={() => setSelectedDonor(null)} aria-label="Remover doador">
                    <FaTrash />
                  </button>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2>2. Itens recebidos</h2>
              <label htmlFor="item-search">Adicionar item já cadastrado</label>
              <input
                id="item-search"
                type="search"
                placeholder="Buscar item no estoque..."
                value={searchItem}
                onChange={(event) => setSearchItem(event.target.value)}
                className={styles.searchInput}
              />
              {searchItem && (
                <div className={styles.dropdown}>
                  {filteredItems.length === 0 ? (
                    <div className={styles.dropdownItem}>Nenhum item encontrado.</div>
                  ) : filteredItems.map((item) => (
                    <button type="button" key={item.id} className={styles.dropdownItem} onClick={() => { addExistingItem(item); setSearchItem(''); }}>
                      <strong>{item.nome}</strong>
                      <span>Estoque atual: {item.quantidade ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.divider}><span>OU CADASTRE UM NOVO ITEM</span></div>
              <div className={styles.newItemInputGroup}>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  placeholder="Nome do novo item..."
                  className={styles.searchInput}
                  maxLength={200}
                />
                <button type="button" className={styles.addSecondaryButton} onClick={addNewItem} disabled={!newItemName.trim()}>
                  <FaPlus /> Adicionar
                </button>
              </div>

              {selectedItems.length > 0 && (
                <div className={styles.selectedItems}>
                  <h3>Itens selecionados</h3>
                  {selectedItems.map((line) => (
                    <article key={line.lineId} className={styles.selectedItem}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitleRow}>
                          <strong>{line.name}</strong>
                          {line.isNew && <span className={styles.newItemBadge}>Novo item</span>}
                        </div>
                        <div className={styles.itemMetadata}>
                          <label>
                            Categoria *
                            <select value={line.categoryId} onChange={(event) => updateLine(line.lineId, { categoryId: event.target.value })} required>
                              <option value="">Selecione uma categoria</option>
                              {categories.map((category) => (
                                <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Estado de conservação *
                            <select value={line.conservationState} onChange={(event) => updateLine(line.lineId, { conservationState: event.target.value })} required>
                              {CONSERVATION_STATES.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
                            </select>
                          </label>
                        </div>
                      </div>
                      <div className={styles.itemControls}>
                        <button type="button" className={styles.quantityButton} onClick={() => updateQuantity(line, -1)} disabled={line.quantity <= 1} aria-label={`Diminuir quantidade de ${line.name}`}><FaMinus /></button>
                        <span className={styles.quantity}>{line.quantity}</span>
                        <button type="button" className={styles.quantityButton} onClick={() => updateQuantity(line, 1)} aria-label={`Aumentar quantidade de ${line.name}`}><FaPlus /></button>
                        <button type="button" className={styles.removeButton} onClick={() => removeLine(line.lineId)} aria-label={`Remover ${line.name}`}><FaTrash /></button>
                      </div>
                    </article>
                  ))}
                  <div className={styles.total}><strong>Total de unidades recebidas: {totalItems}</strong></div>
                </div>
              )}
              {categories.length === 0 && <p role="status" className={styles.helperText}>Nenhuma categoria cadastrada. Solicite ao administrador o cadastro de categorias.</p>}
            </section>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={() => router.push('/doacao/lista')}>Cancelar</button>
              <button type="submit" className={styles.submitButton} disabled={submitting || !selectedDonor || selectedItems.length === 0 || categories.length === 0}>
                {submitting ? 'Registrando...' : 'Registrar doação'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
