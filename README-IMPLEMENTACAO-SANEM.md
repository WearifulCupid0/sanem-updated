# Implementação dos requisitos — SANEM

Este documento acompanha o pacote de atualização para o repositório `gerenciamento-doacoes-SANEM`.

## 1. Requisitos implementados no pacote

### RF — Registro de doações

- Cada linha de uma doação passa a armazenar categoria e estado de conservação (`NEW`, `GOOD`, `FAIR`, `POOR`), além do item e da quantidade.
- O backend valida quantidade positiva, categoria existente e estado de conservação.
- O registro de doação utiliza o usuário autenticado, em vez de confiar no ID do atendente enviado pelo navegador.
- A tela de registro carrega as categorias e exige categoria e conservação para cada linha.
- É possível registrar o mesmo item em linhas diferentes, por exemplo, unidades em bom e em estado regular. A migração remove a restrição antiga que impedia linhas repetidas para o mesmo item dentro da doação.
- O lançamento continua integrado ao livro de transações do estoque.

### RF — Perfis de acesso

Os perfis já existentes são preservados e mapeados para autoridades do Spring Security:

| Perfil cadastrado | Autoridade interna | Permissões principais |
|---|---|---|
| `Administrator` | `ROLE_ADMINISTRATOR` | Administração de usuários e perfis, configurações e exclusões |
| `Attendant` | `ROLE_COLLABORATOR` | Operação de doações, itens, doadores, retiradas e consultas |
| `Evaluator` | `ROLE_EVALUATOR` | Avaliação de beneficiários |

O `JwtFilter` carrega as permissões atuais diretamente do banco em cada requisição autenticada. A interface oculta os menus administrativos dos demais perfis, mas a autorização decisiva é feita no backend.

### RNF — Interface responsiva

- O menu lateral passa a funcionar como gaveta em telas estreitas, com botão de abertura e fundo de fechamento.
- A barra superior e os contêineres das páginas são ajustados para telas menores.
- Os módulos CSS existentes recebem ajustes de largura e margens para evitar que o menu fixo cubra o conteúdo.
- O formulário de doação reorganiza os campos em uma coluna em dispositivos móveis.

### RNF — LGPD

- A tabela `app_user` recebe campos de consentimento, data de aceite, data de revogação e versão da política.
- O aceite é solicitado no primeiro acesso autenticado após a atualização.
- O backend permite as rotas de aceite/revogação sem consentimento, mas exige `ROLE_PRIVACY_ACCEPTED` para as demais rotas.
- A tela de política inclui uma ação para revogar o consentimento e encerrar a sessão.
- A senha permanece protegida por BCrypt; o filtro JWT deixa de imprimir o token ou dados de autenticação no console.
- A chave JWT passa a vir de `JWT_SECRET`, em vez de permanecer fixa no código.

**Atenção jurídica e operacional:** esta implementação oferece controles técnicos, mas não torna o sistema automaticamente “em conformidade integral com a LGPD”. A SANEM ainda precisa validar a política com seu responsável, preencher os canais oficiais de contato, determinar as bases legais e prazos de retenção de cada conjunto de dados (inclusive doadores e beneficiários), definir processos de atendimento aos titulares e documentar os operadores/compartilhamentos aplicáveis.

### RNF — HTTPS

- O Docker Compose adiciona Caddy como proxy reverso público.
- O Caddy direciona `/api/*` ao backend e o restante ao frontend, redirecionando HTTP para HTTPS e gerenciando certificados automaticamente quando o domínio público está configurado.
- Frontend e backend deixam de publicar suas portas diretamente no host; somente o proxy publica 80/443.

## 2. Instalação e inicialização

Este ZIP já contém o projeto completo com as alterações integradas. Extraia os arquivos e execute os comandos a partir da pasta que contém `docker-compose.yml`. Não é necessário executar `apply_changes.py`.

```bash
docker compose config
docker compose up -d --build
```

O fluxo padrão usa Flyway para inicializar o banco: V7 cria perfis, usuários e dados de demonstração; V8 cria os campos de categoria/conservação e consentimento, preservando a chave estrangeira de `donation_id`; V9 classifica os itens doados e torna `category_id` obrigatório. O script `db/script-insert-values.sql` é opcional e não é montado no entrypoint do MySQL. Não o execute sobre o banco de demonstração padrão, pois a V7 já cria os dados.

## 3. Recriação limpa do banco em desenvolvimento

Use esta opção somente quando puder perder os dados atuais. Ela remove apenas o volume do MySQL, mantendo os volumes do Caddy.

1. Pare os serviços sem remover os volumes:

   ```bash
   docker compose down
   ```

2. Descubra o nome do volume de dados do MySQL:

   ```bash
   docker volume ls
   ```

   Remova somente o volume associado a `mysql_data` (normalmente termina em `_mysql_data`):

   ```bash
   docker volume rm NOME_EXATO_DO_VOLUME_MYSQL
   ```

3. Reconstrua e inicie os serviços:

   ```bash
   docker compose up -d --build
   docker compose ps -a
   docker compose logs --tail=200 backend
   ```

Na inicialização, o MySQL cria as tabelas base; o backend executa V2 até V9. Não execute `flyway repair` em uma base recém-recriada.

## 4. Publicação HTTPS

Defina `SANEM_DOMAIN` para um domínio que aponte para o servidor e mantenha as portas TCP 80 e 443 acessíveis pela internet. Exemplo de variáveis de ambiente (substitua todos os valores):

```bash
export SANEM_DOMAIN=doacoes.exemplo.org.br
export MYSQL_ROOT_PASSWORD='uma-senha-forte-e-unica'
export DB_USER=sanem
export DB_PASSWORD='outra-senha-forte-e-unica'
export JWT_SECRET="$(openssl rand -base64 48)"
```

Depois execute `docker compose up --build -d`. O Caddy solicitará e renovará certificados automaticamente para um domínio público válido. Em `localhost`, o Caddy usa sua autoridade certificadora local; isso serve para desenvolvimento, mas o navegador pode exigir que a CA local seja confiada manualmente. Não use `localhost` como domínio de produção.

## 5. Verificações recomendadas

Execute no projeto atualizado:

```bash
cd backend && mvn clean test
cd ../frontend && npm ci && npm run build
cd .. && docker compose config
```

O pacote foi preparado a partir do código consultado no GitHub, mas não foi possível executar Maven, npm ou Docker contra a cópia integral neste ambiente. Portanto, não interprete a entrega como build/teste aprovado; rode os comandos acima no ambiente do projeto antes de publicar.
