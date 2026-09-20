export const hslToRgb = (h, s, l) => {
  const normalizedSaturation = s / 100
  const normalizedLightness = l / 100
  const a = normalizedSaturation * Math.min(normalizedLightness, 1 - normalizedLightness)
  const channel = (offset) => {
    const k = (offset + h / 30) % 12
    const color = normalizedLightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }
  return [channel(0), channel(8), channel(4)]
}

export const hslToHex = (h, s, l) => {
  const [r, g, b] = hslToRgb(h, s, l)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
}
