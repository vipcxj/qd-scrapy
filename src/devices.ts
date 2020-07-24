export enum Devices {
  MuMu = 'MuMu',
}

type Codes = {
  [device in Devices]: string;
}

export const CODES: Codes = {
  MuMu: '98000000',
};
