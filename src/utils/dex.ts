import spriteData from '../data/sprites.json'
import {PokemonJson} from '../types/sprite'

export const badFormes = [
  '000',
  '000c0',
  '666',
  '669',
  '670',
  '671',
  '804a',
  '892',
  '1002a'
]

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

export function natureMap(nature: string) {
  const map: { [key: string]: number } = {
    'All': 0,
    'Serious': 1,
    'Lonely': 2,
    'Adamant': 3,
    'Naughty': 4,
    'Brave': 5,
    'Bold': 6,
    'Hardy': 7,
    'Impish': 8,
    'Lax': 9,
    'Relaxed': 10,
    'Modest': 11,
    'Mild': 12,
    'Bashful': 13,
    'Rash': 14,
    'Quiet': 15,
    'Calm': 16,
    'Gentle': 17,
    'Careful': 18,
    'Docile': 19,
    'Sassy': 20,
    'Timid': 21,
    'Hasty': 22,
    'Jolly': 23,
    'Naive': 24,
    'Quirky': 25,
  }

  return map[nature] !== undefined ? map[nature] : null
}