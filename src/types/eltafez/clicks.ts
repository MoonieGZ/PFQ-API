export type ClickBoostResponse = {
  staff: number;
  staff_sub: number;
  joined: Date;
  dob?: Date;
  ultimate?: Date;
}

export type ClickBoostResult = {
  hypermode: boolean;
  wikieditor: boolean;
  helpinghand: boolean;
  birthday: boolean;
  nitroboost: boolean;
}