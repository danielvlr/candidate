# Migração BUG-27 (b): `clients.description` e `clients.notes` de `oid` para `text`

Runbook para converter as colunas que o Hibernate criou como `oid` (large object, por causa do `@Lob` em `String`) para `text`. **Não foi aplicada em nenhum ambiente**: a entidade `Client` ainda usa `@Lob`. A mudança de código fica para depois da migração (seção 6).

## 1. Por que

Com `@Lob String` no PostgreSQL, o Hibernate grava o texto como large object e guarda só o `oid` na coluna. Consequências: leitura fora de transação falha ("Large Objects may not be used in auto-commit mode"), `lower()`/`LIKE` não funcionam sobre o conteúdo e cada UPDATE deixa um large object órfão (o Hibernate nunca faz `lo_unlink`).

## 2. Backup (obrigatório)

```bash
pg_dump --format=custom --file=camarmo_antes_bug27_$(date +%F).dump "$DATABASE_URL"
```

`pg_dump` inclui os large objects no formato custom. Guarde o arquivo antes de seguir.

## 3. Verificar o tipo atual

```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name IN ('description', 'notes');
```

- `data_type = 'oid'`: precisa migrar (seguir adiante).
- `data_type = 'text'`: já migrado, não faça nada.

Conferência prévia (todos os `oid` não nulos devem apontar para large objects existentes; `lo_get` falha se não existir):

```sql
SELECT count(*) AS descricoes_sem_lo
FROM clients c
WHERE c.description IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM pg_largeobject_metadata m WHERE m.oid = c.description);

SELECT count(*) AS notas_sem_lo
FROM clients c
WHERE c.notes IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM pg_largeobject_metadata m WHERE m.oid = c.notes);
```

Se algum for maior que zero, trate essas linhas (por exemplo `UPDATE clients SET description = NULL WHERE ...`) antes da migração.

## 4. Migração (uma transação)

Rode com a aplicação parada ou em janela de baixo uso, porque o `ALTER TABLE` pega lock exclusivo na tabela.

```sql
BEGIN;

-- Guarda os oids antigos para a limpeza dos large objects no fim.
CREATE TEMP TABLE _clients_lob_antigos ON COMMIT DROP AS
SELECT id, description AS old_description, notes AS old_notes
FROM clients;

ALTER TABLE clients
    ALTER COLUMN description TYPE text USING convert_from(lo_get(description), 'UTF8'),
    ALTER COLUMN notes       TYPE text USING convert_from(lo_get(notes), 'UTF8');

-- Confere: mesma quantidade de nulos e nenhum texto perdido.
SELECT
    (SELECT count(*) FROM clients WHERE description IS NULL) AS description_nulos,
    (SELECT count(*) FROM _clients_lob_antigos WHERE old_description IS NULL) AS description_nulos_antes,
    (SELECT count(*) FROM clients WHERE notes IS NULL) AS notes_nulos,
    (SELECT count(*) FROM _clients_lob_antigos WHERE old_notes IS NULL) AS notes_nulos_antes;

-- Remove os large objects que ficaram órfãos com a conversão.
SELECT lo_unlink(old_description) FROM _clients_lob_antigos WHERE old_description IS NOT NULL;
SELECT lo_unlink(old_notes)       FROM _clients_lob_antigos WHERE old_notes IS NOT NULL;

-- Se algo na conferência estiver errado: ROLLBACK; em vez de COMMIT;
COMMIT;
```

Opcional, para limpar large objects órfãos históricos (de UPDATEs antigos): `vacuumlo <banco>`. **Só use se nenhuma outra coluna do banco guarda `oid` de large object** (ele apaga qualquer large object sem referência). Rode `vacuumlo -n` antes (modo simulação).

Depois do `COMMIT`, valide: `SELECT id, left(description, 60), left(notes, 60) FROM clients LIMIT 10;` e a tela de clientes.

## 5. Rollback

- **Antes do `COMMIT`**: `ROLLBACK;` desfaz tudo (inclusive os `lo_unlink`).
- **Depois do `COMMIT`**: restaurar o dump da seção 2 (caminho seguro, recupera os large objects originais):
  `pg_restore --clean --if-exists --dbname "$DATABASE_URL" camarmo_antes_bug27_<data>.dump`
- **Reversão lógica** (se o dump não puder ser usado e o código ainda estiver com `@Lob`): recria large objects novos a partir do texto, com oids diferentes dos originais:

```sql
BEGIN;
ALTER TABLE clients
    ALTER COLUMN description TYPE oid USING CASE WHEN description IS NULL THEN NULL
        ELSE lo_from_bytea(0, convert_to(description, 'UTF8')) END,
    ALTER COLUMN notes TYPE oid USING CASE WHEN notes IS NULL THEN NULL
        ELSE lo_from_bytea(0, convert_to(notes, 'UTF8')) END;
COMMIT;
```

## 6. Mudança de código (só depois da migração em produção)

Em `backend/src/main/java/com/empresa/sistema/domain/entity/Client.java`, trocar:

```java
@Lob
private String description;

@Lob
private String notes;
```

por:

```java
@Column(columnDefinition = "TEXT")
private String description;

@Column(columnDefinition = "TEXT")
private String notes;
```

Remover o import de `jakarta.persistence.Lob` se ficar sem uso. Ordem de deploy: migrar o banco primeiro, depois subir a versão com a entidade nova. Com `ddl-auto=update` o Hibernate não altera o tipo de colunas existentes, então não há conflito. Se o código novo subir antes da migração, a leitura de `oid` como `text` quebra.

Depois do deploy, confirme na versão em execução (logs) e rode `ClientLobPostgresIntegrationTest` contra um Postgres descartável.
