import { NgxCurrencyConfig } from "ngx-currency";

export const PAGINATION_OPTIONS: number[] = [5, 10, 50, 100];
export const PAGINATION_DEFAULT_OPTION: number = 5;

export type EnumType = {
  key: string,
  value: string
}

export type ModalType<C> = {
  title: 'string',
  content?: C
  component: any
}

export type UserDTO = {
  email: string | null,
  password: string | null,
  username: string | null,
  type: string | null,
}

export type AccessUser = {
  accessToken: string;
  username?: string;
  type?: string;
}

export const CONFIG_CURRENCY: Partial<NgxCurrencyConfig> = { prefix: 'R$', thousands: '.', decimal: ',', align: 'left' };
