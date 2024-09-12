export interface SpriteSet {
  egg?: string;
  m?: string;
  ms?: string;
  ma?: string;
  mm?: string;
  f?: string;
  fs?: string;
  fa?: string;
  fm?: string;
  'm-icon'?: string;
  'ms-icon'?: string;
  'ma-icon'?: string;
  'mm-icon'?: string;
  'f-icon'?: string;
  'fs-icon'?: string;
  'fa-icon'?: string;
  'fm-icon'?: string;
}

export interface PokemonData {
  name: string;
  sprites: SpriteSet;
  female: boolean;
  egg: boolean;
}

export interface PokemonJson {
  [key: string]: PokemonData;
}