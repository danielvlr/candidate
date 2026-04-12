-- =============================================
-- SISTEMA DE BANCO DE TALENTOS - DDL
-- =============================================

-- Extensões para busca avançada
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- =============================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- =============================================
-- EMPRESAS E HEADHUNTERS
-- =============================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) UNIQUE, -- CNPJ
    email VARCHAR(255),
    phone VARCHAR(20),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_country VARCHAR(50),
    address_zipcode VARCHAR(20),
    website VARCHAR(255),
    industry VARCHAR(100),
    size_range VARCHAR(50), -- 1-10, 11-50, 51-200, etc
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE headhunters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL CHECK (level IN ('JUNIOR', 'PLENO', 'SENIOR')),
    specialization TEXT, -- área de atuação
    commission_rate DECIMAL(5,2), -- porcentagem de comissão
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CANDIDATOS E CURRÍCULOS
-- =============================================

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),

    -- Localização
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_country VARCHAR(50),
    is_willing_to_relocate BOOLEAN DEFAULT false,

    -- Dados profissionais
    current_position VARCHAR(255),
    current_company VARCHAR(255),
    seniority_level VARCHAR(20) CHECK (seniority_level IN ('ESTAGIARIO', 'JUNIOR', 'PLENO', 'SENIOR', 'ESPECIALISTA', 'LIDER')),
    years_of_experience INTEGER,

    -- Disponibilidade
    availability_status VARCHAR(20) DEFAULT 'DISPONIVEL' CHECK (availability_status IN ('DISPONIVEL', 'EMPREGADO_ABERTO', 'EMPREGADO_FECHADO', 'INDISPONIVEL')),
    availability_date DATE,

    -- Pretensão salarial
    salary_expectation_min DECIMAL(10,2),
    salary_expectation_max DECIMAL(10,2),
    salary_currency VARCHAR(3) DEFAULT 'BRL',

    -- Preferências de trabalho
    work_model_preference VARCHAR(20) CHECK (work_model_preference IN ('REMOTO', 'PRESENCIAL', 'HIBRIDO', 'QUALQUER')),
    contract_type_preference VARCHAR(20) CHECK (contract_type_preference IN ('CLT', 'PJ', 'CONTRACTOR', 'QUALQUER')),

    -- Dados para busca
    summary TEXT, -- resumo/bio do candidato
    search_vector TSVECTOR, -- vetor de busca gerado automaticamente

    -- LGPD
    consent_given BOOLEAN DEFAULT false,
    consent_date TIMESTAMP,
    consent_source VARCHAR(100), -- 'FORMULARIO', 'LINKEDIN_IMPORT', etc
    data_retention_until DATE,

    -- Metadados
    source VARCHAR(50), -- 'MANUAL', 'LINKEDIN', 'INDICACAO', etc
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'LINGUAGEM', 'FRAMEWORK', 'FERRAMENTA', 'SOFT_SKILL'
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE candidate_skills (
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('BASICO', 'INTERMEDIARIO', 'AVANCADO', 'ESPECIALISTA')),
    years_of_experience INTEGER,
    PRIMARY KEY (candidate_id, skill_id)
);

CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'Português', 'Inglês', etc
    code VARCHAR(5) UNIQUE NOT NULL -- 'pt-BR', 'en-US', etc
);

CREATE TABLE candidate_languages (
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('BASICO', 'INTERMEDIARIO', 'AVANCADO', 'NATIVO')),
    PRIMARY KEY (candidate_id, language_id)
);

CREATE TABLE resume_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    extracted_text TEXT, -- texto extraído do PDF
    text_search_vector TSVECTOR, -- vetor de busca do texto extraído
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- HISTÓRICO DE CONTATOS
-- =============================================

CREATE TABLE contact_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'EMAIL', 'WHATSAPP', 'LIGACAO', 'NOTA_INTERNA'
    icon VARCHAR(50),
    color VARCHAR(7) -- hex color
);

CREATE TABLE candidate_contact_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    contact_type_id INTEGER REFERENCES contact_types(id),
    contacted_by UUID REFERENCES users(id),

    subject VARCHAR(255),
    content TEXT NOT NULL,
    contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Campos específicos por tipo
    email_to VARCHAR(255),
    email_cc VARCHAR(500),
    phone_number VARCHAR(20),

    -- Metadados
    external_message_id VARCHAR(255), -- ID do provedor de email/WhatsApp
    delivery_status VARCHAR(20), -- 'SENT', 'DELIVERED', 'READ', 'FAILED'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- VAGAS E CANDIDATURAS
-- =============================================

CREATE TABLE job_openings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    headhunter_id UUID REFERENCES headhunters(id),

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,

    -- Detalhes contratuais
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('CLT', 'PJ', 'CONTRACTOR', 'ESTAGIO', 'TERCEIRIZADO')),
    work_model VARCHAR(20) NOT NULL CHECK (work_model IN ('REMOTO', 'PRESENCIAL', 'HIBRIDO')),

    -- Localização
    work_city VARCHAR(100),
    work_state VARCHAR(50),
    work_country VARCHAR(50),

    -- Datas importantes
    expected_hire_date DATE,
    start_date DATE,
    application_deadline DATE,

    -- Faixa salarial
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_currency VARCHAR(3) DEFAULT 'BRL',

    -- Status e metadados
    status VARCHAR(20) DEFAULT 'ABERTA' CHECK (status IN ('RASCUNHO', 'ABERTA', 'EM_TRIAGEM', 'PAUSADA', 'FECHADA', 'CANCELADA')),
    priority_level VARCHAR(10) DEFAULT 'MEDIA' CHECK (priority_level IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),

    -- Campos para busca
    search_vector TSVECTOR,

    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_skills (
    job_id UUID REFERENCES job_openings(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('BASICO', 'INTERMEDIARIO', 'AVANCADO', 'ESPECIALISTA')),
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE job_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 'TRIAGEM', 'ENTREVISTA_RH', 'ENTREVISTA_TECNICA', 'OFERTA', 'CONTRATADO'
    order_position INTEGER NOT NULL,
    color VARCHAR(7), -- hex color para kanban
    is_final BOOLEAN DEFAULT false -- indica se é um estágio final
);

CREATE TABLE job_opening_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_openings(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    current_stage_id INTEGER REFERENCES job_stages(id),

    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50), -- 'INDICACAO', 'HEADHUNTER', 'SITE', 'LINKEDIN'

    -- Dados específicos da candidatura
    cover_letter TEXT,
    expected_salary DECIMAL(10,2),
    available_start_date DATE,

    -- Status da candidatura
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'REJEITADO', 'RETIRADO', 'CONTRATADO')),
    rejection_reason TEXT,

    -- Avaliações
    internal_notes TEXT,
    hr_rating INTEGER CHECK (hr_rating >= 1 AND hr_rating <= 5),
    technical_rating INTEGER CHECK (technical_rating >= 1 AND technical_rating <= 5),

    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(job_id, candidate_id)
);

CREATE TABLE job_candidate_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_candidate_id UUID REFERENCES job_opening_candidates(id) ON DELETE CASCADE,
    from_stage_id INTEGER REFERENCES job_stages(id),
    to_stage_id INTEGER REFERENCES job_stages(id),
    changed_by UUID REFERENCES users(id),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- =============================================
-- ARQUIVOS E ANEXOS
-- =============================================

CREATE TABLE job_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_openings(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- MENSAGENS E ALERTAS
-- =============================================

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('EMAIL', 'WHATSAPP')),
    subject VARCHAR(255), -- apenas para email
    content TEXT NOT NULL,
    variables JSON, -- lista de variáveis disponíveis
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'CANDIDATE', 'JOB', 'APPLICATION'
    entity_id UUID NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('EMAIL', 'WHATSAPP')),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    sender_id UUID REFERENCES users(id),

    subject VARCHAR(255),
    content TEXT NOT NULL,
    template_id UUID REFERENCES message_templates(id),

    -- IDs externos dos provedores
    external_message_id VARCHAR(255),
    provider_name VARCHAR(50), -- 'POSTMARK', 'SES', 'WHATSAPP_CLOUD'

    status VARCHAR(20) DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,

    -- Contexto
    related_entity_type VARCHAR(50), -- 'CANDIDATE', 'JOB', 'APPLICATION'
    related_entity_id UUID
);

-- =============================================
-- CONSENTIMENTO E AUDITORIA (LGPD)
-- =============================================

CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'DATA_PROCESSING', 'MARKETING', 'SHARING'
    granted BOOLEAN NOT NULL,
    granted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_date TIMESTAMP,
    source VARCHAR(100), -- onde o consentimento foi dado
    ip_address INET,
    user_agent TEXT,
    legal_basis VARCHAR(100), -- base legal para o tratamento
    purpose TEXT -- finalidade do tratamento
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT'
    entity_type VARCHAR(50) NOT NULL, -- 'CANDIDATE', 'JOB', etc
    entity_id UUID,
    entity_data JSON, -- dados anteriores (para UPDATE/DELETE)
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para busca full-text
CREATE INDEX idx_candidates_search_vector ON candidates USING GIN(search_vector);
CREATE INDEX idx_resume_text_search_vector ON resume_files USING GIN(text_search_vector);
CREATE INDEX idx_jobs_search_vector ON job_openings USING GIN(search_vector);

-- Índices para busca por trigrama (nomes similares)
CREATE INDEX idx_candidates_name_trgm ON candidates USING GIN((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_candidates_email_trgm ON candidates USING GIN(email gin_trgm_ops);

-- Índices compostos para filtros comuns
CREATE INDEX idx_candidates_location ON candidates(address_city, address_state, address_country);
CREATE INDEX idx_candidates_availability ON candidates(availability_status, availability_date);
CREATE INDEX idx_candidates_seniority ON candidates(seniority_level, years_of_experience);

CREATE INDEX idx_jobs_status_date ON job_openings(status, expected_hire_date, start_date);
CREATE INDEX idx_jobs_company ON job_openings(company_id, status);

CREATE INDEX idx_job_candidates_stage ON job_opening_candidates(current_stage_id, status);
CREATE INDEX idx_contact_history_candidate ON candidate_contact_history(candidate_id, contact_date DESC);

-- Índices para auditoria e performance
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_outbox_events_status ON outbox_events(status, scheduled_for);

-- =============================================
-- TRIGGERS PARA SEARCH VECTORS
-- =============================================

-- Função para atualizar search_vector de candidatos
CREATE OR REPLACE FUNCTION update_candidate_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.current_position, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.current_company, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.summary, '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.address_city, '')), 'D') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.address_state, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_candidate_search_vector_update
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_candidate_search_vector();

-- Função para atualizar search_vector de vagas
CREATE OR REPLACE FUNCTION update_job_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.requirements, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.work_city, '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.work_state, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_search_vector_update
    BEFORE INSERT OR UPDATE ON job_openings
    FOR EACH ROW EXECUTE FUNCTION update_job_search_vector();

-- Função para atualizar search_vector de currículos
CREATE OR REPLACE FUNCTION update_resume_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.text_search_vector := to_tsvector('portuguese', COALESCE(NEW.extracted_text, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_resume_search_vector_update
    BEFORE INSERT OR UPDATE ON resume_files
    FOR EACH ROW EXECUTE FUNCTION update_resume_search_vector();

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Roles básicos
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Administrador do sistema'),
('HEADHUNTER', 'Headhunter/Recrutador'),
('CLIENT', 'Cliente - visualização limitada de suas vagas');

-- Tipos de contato
INSERT INTO contact_types (name, icon, color) VALUES
('EMAIL', 'mail', '#3B82F6'),
('WHATSAPP', 'message-circle', '#10B981'),
('LIGACAO', 'phone', '#F59E0B'),
('NOTA_INTERNA', 'file-text', '#6B7280'),
('REUNIAO', 'calendar', '#8B5CF6');

-- Estágios de vaga padrão
INSERT INTO job_stages (name, order_position, color, is_final) VALUES
('TRIAGEM', 1, '#6B7280', false),
('ENTREVISTA_RH', 2, '#3B82F6', false),
('ENTREVISTA_TECNICA', 3, '#F59E0B', false),
('OFERTA', 4, '#8B5CF6', false),
('CONTRATADO', 5, '#10B981', true),
('REJEITADO', 6, '#EF4444', true);

-- Idiomas básicos
INSERT INTO languages (name, code) VALUES
('Português', 'pt-BR'),
('Inglês', 'en-US'),
('Espanhol', 'es-ES'),
('Francês', 'fr-FR'),
('Alemão', 'de-DE'),
('Italiano', 'it-IT'),
('Japonês', 'ja-JP'),
('Chinês', 'zh-CN'),
('Russo', 'ru-RU');

-- Skills básicas de tecnologia
INSERT INTO skills (name, category) VALUES
('Java', 'LINGUAGEM'),
('JavaScript', 'LINGUAGEM'),
('TypeScript', 'LINGUAGEM'),
('Python', 'LINGUAGEM'),
('C#', 'LINGUAGEM'),
('Go', 'LINGUAGEM'),
('Rust', 'LINGUAGEM'),
('PHP', 'LINGUAGEM'),
('Ruby', 'LINGUAGEM'),
('Kotlin', 'LINGUAGEM'),
('Swift', 'LINGUAGEM'),
('Dart', 'LINGUAGEM'),

('Spring Boot', 'FRAMEWORK'),
('React', 'FRAMEWORK'),
('Angular', 'FRAMEWORK'),
('Vue.js', 'FRAMEWORK'),
('Next.js', 'FRAMEWORK'),
('Express.js', 'FRAMEWORK'),
('Django', 'FRAMEWORK'),
('Flask', 'FRAMEWORK'),
('.NET Core', 'FRAMEWORK'),
('Laravel', 'FRAMEWORK'),
('Ruby on Rails', 'FRAMEWORK'),
('Flutter', 'FRAMEWORK'),

('PostgreSQL', 'FERRAMENTA'),
('MySQL', 'FERRAMENTA'),
('MongoDB', 'FERRAMENTA'),
('Redis', 'FERRAMENTA'),
('Docker', 'FERRAMENTA'),
('Kubernetes', 'FERRAMENTA'),
('AWS', 'FERRAMENTA'),
('Azure', 'FERRAMENTA'),
('GCP', 'FERRAMENTA'),
('Git', 'FERRAMENTA'),
('Jenkins', 'FERRAMENTA'),
('Terraform', 'FERRAMENTA'),

('Liderança', 'SOFT_SKILL'),
('Comunicação', 'SOFT_SKILL'),
('Trabalho em Equipe', 'SOFT_SKILL'),
('Resolução de Problemas', 'SOFT_SKILL'),
('Pensamento Crítico', 'SOFT_SKILL'),
('Adaptabilidade', 'SOFT_SKILL'),
('Gestão de Tempo', 'SOFT_SKILL'),
('Mentoria', 'SOFT_SKILL');