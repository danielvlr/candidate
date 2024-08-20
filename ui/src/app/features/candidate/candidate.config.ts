import { EnumType } from "../../utils/interfaces/global.interface";

export enum CandidateColumnsEnum {
  nome = 'Nome',
  profissao = 'Profissão',
  habilidades = 'Habilidades',
  observacao = 'Observação'
}

export const CandidateColumns: EnumType[] = Object.entries(CandidateColumnsEnum).map(([key, value]) => ({key, value}) );

export enum CandidateHistoricColumnsEnum {
  data = 'Data',
  headhunter = 'Headhunter',
  descricao = 'Descrição',
  actions = ''
}

export const CandidateHistoricColumns: EnumType[] = Object.entries(CandidateHistoricColumnsEnum).map(([key, value]) => ({key, value}) );

export enum FeedbackHistoricTableEditableEnum {
  data = 'Inserir data de contato...',
  headhunter = 'Inserir nome do Headhunter...',
  descricao = 'Descrição geral...',
}

export enum IconsHistoricTableEditableEnum {
  data = 'fa-regular fa-calendar-check',
  headhunter = 'fa-solid fa-chalkboard-user',
  descricao = 'fa-regular fa-rectangle-list',
}
