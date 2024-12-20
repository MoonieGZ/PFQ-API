export interface DexEntry {
  region_name?: string;
  formeid: string;
  name: string;
  formename: string;
  sprite?: string;
}

export interface PkmnEntry {
  id: number;
  formeid: string;
  name: string;
  color: string;
  count: number;
}