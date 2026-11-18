import { Mascot } from 'page-mascot'

const base = import.meta.env.BASE_URL
/** "Cap" by koboyo (free character from koboyo.com/page-mascot). The gaze, click-squash, reduced-motion and touch behaviour come from page-mascot itself. */
export function Cap({ size = 420, label = 'Cap, the scout' }: { size?: number; label?: string }) {
  return <Mascot directions={`${base}mascots/cap-directions.webp`} reactions={`${base}mascots/cap-reactions.webp`} size={size} label={label} />
}
