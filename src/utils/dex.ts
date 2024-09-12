import spriteData from '../data/sprites.json'
import {PokemonJson} from '../types/sprite'

export const badFormes = ['666', '669', '670', '671', '000c0', '892']

export function getSprite(formeid: string) {
  try {
    const data: PokemonJson = spriteData
    if (data && data[formeid] && data[formeid].sprites['m-icon']) {
      return data[formeid].sprites['m-icon'].split('').join('/') + '.png'
    } else {
      return null
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error('Error fetching sprite data: ' + err.message)
    }
    throw new Error('Error fetching sprite data')
  }
}