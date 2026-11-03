-- Classifica os itens de doações já existentes, inclusive os registros de demonstração
-- criados pela V7 antes da existência das colunas category_id e conservation_state.
-- Itens sem correspondência específica recebem a categoria "Outros".
UPDATE item_donated AS donated
JOIN item AS inventory_item
    ON inventory_item.item_id = donated.item_id
JOIN category AS resolved_category
    ON resolved_category.name = CASE
        WHEN LOWER(inventory_item.description) LIKE '%arroz%'
          OR LOWER(inventory_item.description) LIKE '%feij%'
          OR LOWER(inventory_item.description) LIKE '%macarr%'
          OR LOWER(inventory_item.description) LIKE '%oleo%'
          OR LOWER(inventory_item.description) LIKE '%leite%'
          OR LOWER(inventory_item.description) LIKE '%farinha%'
          OR LOWER(inventory_item.description) LIKE '%acucar%'
          OR LOWER(inventory_item.description) LIKE '%alimento%'
            THEN 'Alimentos'
        WHEN LOWER(inventory_item.description) LIKE '%sabonete%'
          OR LOWER(inventory_item.description) LIKE '%creme dental%'
          OR LOWER(inventory_item.description) LIKE '%fralda%'
          OR LOWER(inventory_item.description) LIKE '%shampoo%'
          OR LOWER(inventory_item.description) LIKE '%higiene%'
            THEN 'Higiene'
        WHEN LOWER(inventory_item.description) LIKE '%tenis%'
          OR LOWER(inventory_item.description) LIKE '%sapato%'
          OR LOWER(inventory_item.description) LIKE '%sandalia%'
          OR LOWER(inventory_item.description) LIKE '%chinelo%'
          OR LOWER(inventory_item.description) LIKE '%calcado%'
            THEN 'Calçados'
        WHEN LOWER(inventory_item.description) LIKE '%camiseta%'
          OR LOWER(inventory_item.description) LIKE '%camisa%'
          OR LOWER(inventory_item.description) LIKE '%calca%'
          OR LOWER(inventory_item.description) LIKE '%roupa%'
          OR LOWER(inventory_item.description) LIKE '%vestido%'
          OR LOWER(inventory_item.description) LIKE '%blusa%'
          OR LOWER(inventory_item.description) LIKE '%casaco%'
            THEN 'Vestuário'
        WHEN LOWER(inventory_item.description) LIKE '%prato%'
          OR LOWER(inventory_item.description) LIKE '%panela%'
          OR LOWER(inventory_item.description) LIKE '%talher%'
          OR LOWER(inventory_item.description) LIKE '%copo%'
          OR LOWER(inventory_item.description) LIKE '%caneca%'
          OR LOWER(inventory_item.description) LIKE '%utensilio%'
            THEN 'Utensílios domésticos'
        ELSE 'Outros'
    END
SET donated.category_id = resolved_category.category_id,
    donated.conservation_state = CASE
        -- Variação determinística para exercitar estados diferentes nos dados de demonstração.
        WHEN donated.donation_id IN (1, 4, 8) THEN 'NEW'
        WHEN donated.donation_id IN (3, 6, 10) THEN 'FAIR'
        ELSE 'GOOD'
    END
WHERE donated.category_id IS NULL;

-- Após o preenchimento, toda linha de doação precisa possuir uma categoria.
ALTER TABLE item_donated
    MODIFY COLUMN category_id INT NOT NULL;
