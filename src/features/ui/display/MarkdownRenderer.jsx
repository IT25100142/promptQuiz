function MarkdownRenderer({ text, className = '' }) {
  if (!text) {
    return <div className={className} />
  }

  const escapeChar = (char) => {
    switch (char) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#39;'
      default: return char
    }
  }

  const out = []
  let i = 0
  let inBold = false
  let inItalic = false
  let inCode = false

  while (i < text.length) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '`') {
      if (inCode) {
        out.push('</code>')
        inCode = false
      } else {
        out.push('<code>')
        inCode = true
      }
      i++
      continue
    }

    if (!inCode) {
      if (char === '*' && nextChar === '*') {
        if (inBold) {
          out.push('</strong>')
          inBold = false
        } else {
          out.push('<strong>')
          inBold = true
        }
        i += 2
        continue
      }

      if (char === '*') {
        if (inItalic) {
          out.push('</em>')
          inItalic = false
        } else {
          out.push('<em>')
          inItalic = true
        }
        i++
        continue
      }

      if (char === '\n') {
        out.push('<br>')
        i++
        continue
      }
    }

    out.push(escapeChar(char))
    i++
  }

  if (inCode) out.push('</code>')
  if (inBold) out.push('</strong>')
  if (inItalic) out.push('</em>')

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: out.join('') }}
    />
  )
}

export default MarkdownRenderer
