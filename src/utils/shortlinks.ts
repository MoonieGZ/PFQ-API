export function encodeShortLink(id: number): string {
  const ab = '0JbyY7pLxMVG6kjR-sCz4Fhl_Ttw2qgNX5ZQn9S1v8fc3PDdrKHBmW'
  let result = ''
  const base = ab.length
  let iterations = 6

  while (id && iterations) {
    result = ab[id % base] + result
    id = Math.floor(id / base)
    iterations--
  }

  if (id) {
    throw new Error('Failed to process ID')
  }

  return result
}

export function decodeShortLink(shortLink: string): number {
  const ab = '0JbyY7pLxMVG6kjR-sCz4Fhl_Ttw2qgNX5ZQn9S1v8fc3PDdrKHBmW'
  const base = ab.length
  let id = 0

  for (let i = 0; i < shortLink.length; i++) {
    const index = ab.indexOf(shortLink[i])
    if (index === -1) {
      throw new Error('Invalid character in short link')
    }
    id = id * base + index
  }

  return id
}
