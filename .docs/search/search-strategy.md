# Estratégia de Busca Inteligente

## Componentes da Busca

### 1. Campos tsvector para Full-Text Search
- **candidates.search_vector**: Nome, posição atual, empresa, resumo, localização
- **resume_files.text_search_vector**: Texto extraído dos PDFs de currículo
- **job_openings.search_vector**: Título, descrição, requisitos, localização

### 2. Índices de Trigrama para Similaridade
- **Nomes similares**: `gin_trgm_ops` em `(first_name || ' ' || last_name)`
- **Emails similares**: Para detectar duplicatas

### 3. Ranking e Boost
- **ts_rank**: Score base do PostgreSQL full-text search
- **skill_match_boost**: Multiplicador quando skills batem exatamente
- **location_match_boost**: Boost para candidatos na mesma cidade/estado
- **experience_boost**: Peso baseado em anos de experiência

## Query de Exemplo

```sql
-- Busca: "Java AND Spring AND Fortaleza"
WITH search_query AS (
  SELECT
    plainto_tsquery('portuguese', 'Java Spring') as text_query,
    'Java' as required_skill,
    'Fortaleza' as preferred_city
),
candidate_scores AS (
  SELECT
    c.*,
    -- Score base do full-text search
    ts_rank_cd(c.search_vector, sq.text_query) as base_score,

    -- Boost por skill match exata
    CASE WHEN EXISTS(
      SELECT 1 FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = c.id
      AND LOWER(s.name) = LOWER(sq.required_skill)
    ) THEN 2.0 ELSE 1.0 END as skill_boost,

    -- Boost por localização
    CASE WHEN c.address_city ILIKE ('%' || sq.preferred_city || '%')
         THEN 1.5 ELSE 1.0 END as location_boost,

    -- Boost por experiência (peso para seniors)
    CASE WHEN c.seniority_level IN ('SENIOR', 'ESPECIALISTA', 'LIDER')
         THEN 1.3 ELSE 1.0 END as experience_boost,

    -- Boost por texto do currículo
    COALESCE(MAX(ts_rank_cd(rf.text_search_vector, sq.text_query)), 0) as resume_score

  FROM candidates c
  CROSS JOIN search_query sq
  LEFT JOIN resume_files rf ON c.id = rf.candidate_id AND rf.is_active = true
  WHERE
    c.is_active = true
    AND c.search_vector @@ sq.text_query
  GROUP BY c.id, sq.text_query, sq.required_skill, sq.preferred_city
)
SELECT
  cs.*,
  -- Score final combinado
  (cs.base_score * cs.skill_boost * cs.location_boost * cs.experience_boost + cs.resume_score) as final_score,

  -- Destacar termos que fizeram match
  ts_headline('portuguese',
    COALESCE(cs.summary, ''),
    (SELECT text_query FROM search_query),
    'MaxWords=35, MinWords=15, MaxFragments=3'
  ) as highlighted_summary

FROM candidate_scores cs
ORDER BY final_score DESC, cs.created_at DESC
LIMIT 20;
```

## Implementação de Filtros Estruturados

```sql
-- Combinando busca textual com filtros
SELECT c.*, final_score
FROM (
  -- Query de busca acima
) ranked_candidates c
WHERE
  -- Filtros estruturados aplicados após o ranking
  ($1::text IS NULL OR c.seniority_level = ANY($1::text[]))
  AND ($2::text IS NULL OR c.address_city ILIKE '%' || $2 || '%')
  AND ($3::integer IS NULL OR c.salary_expectation_min >= $3)
  AND ($4::integer IS NULL OR c.salary_expectation_max <= $4)
  AND ($5::text IS NULL OR c.availability_status = ANY($5::text[]))
  AND (
    $6::integer[] IS NULL OR EXISTS(
      SELECT 1 FROM candidate_skills cs
      WHERE cs.candidate_id = c.id
      AND cs.skill_id = ANY($6::integer[])
    )
  )
ORDER BY final_score DESC;
```

## Detecção de Duplicatas

```sql
-- Buscar candidatos similares por email/LinkedIn
SELECT
  c1.id as candidate1_id,
  c2.id as candidate2_id,
  similarity(c1.email, c2.email) as email_similarity,
  similarity(c1.linkedin_url, c2.linkedin_url) as linkedin_similarity
FROM candidates c1
JOIN candidates c2 ON c1.id < c2.id  -- evita duplicatas na comparação
WHERE
  c1.is_active = true AND c2.is_active = true
  AND (
    similarity(c1.email, c2.email) > 0.8
    OR (c1.linkedin_url IS NOT NULL
        AND c2.linkedin_url IS NOT NULL
        AND similarity(c1.linkedin_url, c2.linkedin_url) > 0.9)
  );
```

## Configurações de Performance

```sql
-- Configurações recomendadas no postgresql.conf
SET default_text_search_config = 'portuguese';
SET shared_preload_libraries = 'pg_trgm';

-- Para melhor performance em buscas
SET work_mem = '256MB';  -- durante buscas complexas
SET effective_cache_size = '4GB';  -- ajustar conforme RAM disponível
```

## Análise de Performance

```sql
-- Query para analisar performance das buscas
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... -- query de busca

-- Monitorar uso dos índices
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('candidates', 'resume_files')
ORDER BY idx_scan DESC;
```

## Melhorias Futuras

1. **Elasticsearch** (opcional): Para volumes muito grandes (>100k candidatos)
2. **Machine Learning**: Score de compatibilidade candidato-vaga
3. **Busca semântica**: Usando embeddings para buscar conceitos similares
4. **Auto-complete**: Sugestões de busca baseadas em histórico
5. **Busca por imagens**: OCR em currículos escaneados