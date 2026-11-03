-- Detalhes da linha de doação: categoria e estado de conservação.
-- O category_id começa nullable para permitir a migração dos registros existentes.
ALTER TABLE item_donated
    ADD COLUMN category_id INT NULL,
    ADD COLUMN conservation_state VARCHAR(16) NOT NULL DEFAULT 'GOOD';

-- fk_item_donated_donation utiliza donation_id como coluna filha.
-- Criar um índice simples antes de remover o índice UNIQUE composto evita
-- que o MySQL bloqueie a remoção por dependência da chave estrangeira.
CREATE INDEX idx_item_donated_donation ON item_donated(donation_id);

-- Permite registrar o mesmo item em mais de uma linha da mesma doação,
-- por exemplo, unidades novas e usadas separadamente.
ALTER TABLE item_donated DROP INDEX uk_item_donated;

CREATE INDEX idx_item_donated_category ON item_donated(category_id);

ALTER TABLE item_donated
    ADD CONSTRAINT fk_item_donated_category
    FOREIGN KEY (category_id) REFERENCES category(category_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Consentimento do titular para tratamento dos dados da conta de usuário.
-- Contas existentes ficam sem consentimento e precisarão aceitar a política.
ALTER TABLE app_user
    ADD COLUMN privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN privacy_consent_at TIMESTAMP(6) NULL,
    ADD COLUMN privacy_consent_revoked_at TIMESTAMP(6) NULL,
    ADD COLUMN privacy_consent_version VARCHAR(40) NULL;

-- Categorias utilizadas pelo formulário de doações e pela migração dos registros antigos.
INSERT INTO category (name)
SELECT 'Vestuário' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Vestuário');
INSERT INTO category (name)
SELECT 'Calçados' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Calçados');
INSERT INTO category (name)
SELECT 'Utensílios domésticos' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Utensílios domésticos');
INSERT INTO category (name)
SELECT 'Higiene' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Higiene');
INSERT INTO category (name)
SELECT 'Alimentos' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Alimentos');
INSERT INTO category (name)
SELECT 'Outros' WHERE NOT EXISTS (SELECT 1 FROM category WHERE name = 'Outros');
