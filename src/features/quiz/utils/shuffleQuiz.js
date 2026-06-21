export function shuffleArray(array, keepFirst = false) {
  const shuffled = [...array]
  if (keepFirst && shuffled.length > 1) {
    const first = shuffled.shift()
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    shuffled.unshift(first)
  } else {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
  }
  return shuffled
}
