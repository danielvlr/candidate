export type CandidateDTO = {
  id?: number;
  nome: string;
  profissao: string;
  habilidades: string;
  observacao?: string;
  pretensaoSalarial: number;
  telefone: string;
  linkedin: string;
  historicoDeContato: CandidateHistoricDTO[];
};

export type CandidateHistoricDTO = {
  id?: number;
  data: string | null | undefined;
  headhunter: string | null | undefined;
  descricao: string | null | undefined;
};
