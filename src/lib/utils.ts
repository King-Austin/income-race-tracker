export function parseDescription(description: string | null) {
  if (!description) return { text: 'Logged Income', images: [] }
  if (description.includes(' ||| ')) {
    const [text, imagesPart] = description.split(' ||| ')
    return {
      text: text || 'Logged Income',
      images: imagesPart ? imagesPart.split(' | ').filter(Boolean) : []
    }
  }
  return { text: description, images: [] }
}

export function fmt(n: number) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  return `₦${formatted}`
}
