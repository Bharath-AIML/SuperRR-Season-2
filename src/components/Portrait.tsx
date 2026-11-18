import credits from '../data/photo_credits.json'

const C = credits as Record<string, { title: string; file: string; file_url: string; artist: string; license: string; license_url: string }>
export const hasPhoto = (id: number) => !!C[String(id)]
export const photoCredit = (id: number) => C[String(id)]
const initials = (n: string) => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('')

/** Portrait from Wikimedia Commons where a freely licensed image exists; otherwise an orange monogram (never a guessed photo). */
export function Portrait({ id, name, size = 56, ratio = '4 / 5' }: { id: number; name: string; size?: number; ratio?: string }) {
  const style = { width: size, aspectRatio: ratio, flexShrink: 0, fontSize: Math.round(size * 0.34) } as const
  return hasPhoto(id)
    ? <img className="portrait" style={style} src={`${import.meta.env.BASE_URL}players/${id}.jpg`} alt={`Portrait of ${name}`} loading="lazy" width={size} />
    : <span className="portrait mono-p" style={style} role="img" aria-label={`${name} (no free-licence portrait available)`}>{initials(name)}</span>
}
