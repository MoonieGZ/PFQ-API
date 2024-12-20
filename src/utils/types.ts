import {User} from '../types/user'

export function getTypeList() {
  return [
    'normal', 'fire', 'water', 'electric', 'grass',
    'ice', 'fighting', 'poison', 'ground', 'flying',
    'psychic', 'bug', 'rock', 'ghost', 'dragon',
    'dark', 'steel', 'fairy'
  ]
}

export function computeType(user: User): string[] {
  const typeList = getTypeList()

  const now = new Date()
  const today = [now.getFullYear(), now.getMonth() + 1]
  
  const todayMonth = today[0] * 12 + today[1]
  const seriesOffset = Math.floor(todayMonth / 18) - 1348

  let seed = user.id * seriesOffset
  const rand = (max: number): number => {
    seed = Math.imul(0x41C64E6D, seed) + 0x00006073
    seed = seed >>> 0
    return (seed >>> 16) % (max + 1)
  }

  const shuffle = (array: string[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = rand(i);
      [array[i], array[j]] = [array[j], array[i]]
    }
  }

  shuffle(typeList)
  return typeList
}
