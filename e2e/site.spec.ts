import { test, expect, Page } from '@playwright/test'

const watch = (page: Page) => {
  const errs: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push(String(e)))
  page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`) })
  return errs
}
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
const cells = (page: Page) => page.evaluate(() => [...document.querySelectorAll('.l-mascot button > span > span')].map((l) => getComputedStyle(l).backgroundPosition + '|' + getComputedStyle(l).opacity))

test.describe('landing + mascot', () => {
  test('loads clean, sheets served, no overflow', async ({ page }) => {
    const errs = watch(page); await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('When the game')
    expect(await noOverflow(page)).toBe(true)
    for (const f of ['seam-directions.webp', 'seam-reactions.webp']) { const r = await page.request.get(`/mascots/${f}`); expect(r.status()).toBe(200) }
    await page.waitForTimeout(400); expect(errs).toEqual([])
  })
  test('gaze follows the cursor in all eight directions and re-centres', async ({ page }) => {
    await page.goto('/'); const b = page.locator('.l-mascot button'); const box = (await b.boundingBox())!
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2, d = 260
    const expect_: [number, number, string][] = [[d, 0, '100% 50%'], [-d, 0, '0% 50%'], [0, -d, '50% 0%'], [0, d, '50% 100%'], [d, -d, '100% 0%'], [-d, -d, '0% 0%'], [d, d, '100% 100%'], [-d, d, '0% 100%']]
    for (const [dx, dy, pos] of expect_) { await page.mouse.move(cx + dx, cy + dy); await page.waitForTimeout(60); expect((await cells(page))[0].startsWith(pos)).toBe(true) }
    await page.mouse.move(cx + 10, cy + 10); await page.waitForTimeout(60); expect((await cells(page))[0].startsWith('50% 50%')).toBe(true)
  })
  test('click shows a reaction then returns; rapid clicks go dizzy', async ({ page }) => {
    await page.goto('/'); const b = page.locator('.l-mascot button')
    await b.click(); await page.waitForTimeout(150); expect((await cells(page))[1].endsWith('|1')).toBe(true)
    await page.waitForTimeout(700); expect((await cells(page))[1].endsWith('|0')).toBe(true)
    await page.waitForTimeout(1700) // let the boop window reset
    await page.evaluate(() => { const el = document.querySelector('.l-mascot button') as HTMLButtonElement; for (let i = 0; i < 4; i++) el.click() })
    await page.waitForTimeout(100)
    expect((await cells(page))[1].startsWith('50% 100%')).toBe(true) // 4 pokes inside 1.6s = dizzy (reactions index 7)
  })
  test('touch device: no tracking, mascot stays centred', async ({ browser }) => {
    const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } }); const page = await ctx.newPage()
    await page.goto('/'); expect((await cells(page))[0].startsWith('50% 50%')).toBe(true)
    expect(await noOverflow(page)).toBe(true); await ctx.close()
  })
  test('CTA navigates (keyboard) and methodology link jumps to Pressure', async ({ page }) => {
    await page.goto('/'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.getByRole('link', { name: /Explore the analysis/ }).focus(); await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/analysis$/); await expect(page.getByRole('heading', { level: 1 })).toContainText('Twenty players')
    await page.goto('/'); await page.getByRole('link', { name: 'Methodology', exact: true }).click()
    await expect(page).toHaveURL(/#\/analysis\/pressure/); await page.waitForTimeout(500)
    expect(await page.evaluate(() => Math.abs(document.getElementById('pressure')!.getBoundingClientRect().top))).toBeLessThan(120)
  })
  test('reduced motion: transition is instant and still navigates', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const page = await ctx.newPage(); await page.goto('/')
    await page.getByRole('link', { name: /Explore the analysis/ }).click(); await expect(page).toHaveURL(/#\/analysis/)
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true); await ctx.close()
  })
})

test.describe('analysis', () => {
  test('nav anchors reach every section', async ({ page }) => {
    const errs = watch(page); await page.goto('/#/analysis')
    for (const id of ['results', 'pressure', 'performance', 'rating', 'why', 'evidence', 'limits', 'ask']) {
      await page.locator(`nav.nav a[href="#/analysis/${id}"]`).click(); await page.waitForTimeout(700)
      expect(await page.evaluate((i) => Math.abs(document.getElementById(i)!.getBoundingClientRect().top), id)).toBeLessThan(150)
    }
    expect(errs).toEqual([])
  })
  test('batter/bowler switch and sorting', async ({ page }) => {
    await page.goto('/#/analysis/results'); await expect(page.locator('.hero-r h3')).toHaveText('Abhishek Sharma')
    await page.getByRole('button', { name: 'Bowlers', exact: true }).first().click(); await expect(page.locator('.hero-r h3')).toHaveText('Jasprit Bumrah')
    await expect(page.locator('.ledger tr.row')).toHaveCount(9)
    await page.getByRole('button', { name: 'Pressure balls', exact: true }).click()
    const balls = await page.locator('.ledger tr.row td:nth-child(4)').allTextContents(); const n = balls.map((t) => parseInt(t)); expect(n).toEqual([...n].sort((a, b) => b - a))
    await page.getByRole('button', { name: 'Stability' }).click()
    const pr = (await page.locator('.ledger tr.row td:nth-child(7)').allTextContents()).map((t) => parseInt(t)); expect(pr).toEqual([...pr].sort((a, b) => b - a))
  })
  test('every one of the 20 dossiers opens with correct data; esc closes; prev/next work', async ({ page }) => {
    const errs = watch(page); await page.goto('/#/analysis/why'); await page.waitForTimeout(300)
    const buttons = page.locator('#why li button'); await expect(buttons).toHaveCount(20)
    for (let i = 0; i < 20; i++) {
      await buttons.nth(i).click(); const dlg = page.getByRole('dialog'); await expect(dlg).toBeVisible()
      const label = await dlg.getAttribute('aria-label'); expect(label).toContain('Evidence for')
      await expect(dlg.locator('h3')).toBeVisible(); await expect(dlg.locator('.why li')).toHaveCount(5)
      await page.keyboard.press('Escape'); await expect(dlg).toHaveCount(0)
    }
    await buttons.nth(0).click(); await page.getByRole('button', { name: 'Next player' }).click(); await expect(page.getByRole('dialog').locator('h3')).toHaveText('Suryakumar Yadav')
    await page.getByRole('button', { name: 'Previous player' }).click(); await expect(page.getByRole('dialog').locator('h3')).toHaveText('Abhishek Sharma')
    expect(errs).toEqual([])
  })
  test('dossier numbers equal the CSV (spot check Bumrah)', async ({ page }) => {
    await page.goto('/#/player/2933/bowl'); const d = page.getByRole('dialog'); await expect(d).toBeVisible()
    await expect(d.locator('h3')).toHaveText('Jasprit Bumrah'); const t = await d.innerText(); expect(t).toContain('480'); expect(t).toContain('39'); expect(t).toContain('+41.5'); expect(t).toContain('+18.9'); expect(t).toContain('100%')
  })
  test('ask the data answers a comparison deterministically', async ({ page }) => {
    await page.goto('/#/analysis/ask'); await page.getByLabel('Question').fill('Compare Abhishek Sharma and Suryakumar Yadav'); await page.getByRole('button', { name: 'Ask' }).click()
    await expect(page.locator('.stat h3')).toHaveText('Abhishek Sharma vs Suryakumar Yadav'); await expect(page.locator('.stat table tr', { hasText: 'High-pressure balls' })).toContainText('224')
  })
  test('before/after slider is keyboard operable and changes player', async ({ page }) => {
    await page.goto('/#/analysis/performance'); const s = page.getByLabel('Slide between baseline and pressure result'); await s.focus(); const v0 = await s.inputValue(); await page.keyboard.press('ArrowRight'); expect(await s.inputValue()).not.toBe(v0)
    await page.locator('#performance select').selectOption('bowl-2933'); await expect(page.locator('#performance .ba')).toContainText('+19')
  })
  test('charts render with data and no overflow at desktop/tablet/mobile', async ({ browser }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 820, height: 1100 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport: vp }); const page = await ctx.newPage(); const errs = watch(page); await page.goto('/#/analysis')
      await page.waitForTimeout(500); expect(await noOverflow(page), `overflow @${vp.width}`).toBe(true)
      expect(await page.locator('#evidence svg circle').count()).toBeGreaterThan(100)
      expect(await page.locator('svg[role=img]').count()).toBeGreaterThan(8); expect(errs).toEqual([]); await ctx.close()
    }
  })
})

test('player photos load and the rest fall back to monograms', async ({ page }) => {
  const errs: string[] = []; page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`) })
  await page.goto('/#/analysis/results'); await page.waitForTimeout(800)
  const imgs = page.locator('img.portrait'); const n = await imgs.count(); expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) { const im = imgs.nth(i); await im.scrollIntoViewIfNeeded(); await expect.poll(() => im.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0), { timeout: 8000 }).toBe(true) }
  await page.goto('/#/analysis/why'); await page.waitForTimeout(500)
  expect(await page.locator('#why img.portrait').count()).toBe(12); expect(await page.locator('#why .portrait.mono-p').count()).toBe(8); expect(errs).toEqual([])
})

test('screenshots', async ({ browser }) => {
  const shot = async (name: string, vp: { width: number; height: number }, steps: (p: Page) => Promise<void>, full = false) => {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600, isMobile: vp.width < 600 }); const p = await ctx.newPage(); await steps(p); await p.waitForTimeout(700); await p.screenshot({ path: `screenshots/${name}.png`, fullPage: full }); await ctx.close()
  }
  const D = { width: 1440, height: 900 }, M = { width: 390, height: 844 }
  const go = (hash: string, sel?: string) => async (p: Page) => { await p.goto('/' + hash); await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); if (sel) { await p.waitForTimeout(500); await p.evaluate((s) => { const el = document.querySelector(s)!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70) }, sel) } }
  await shot('desktop-01-landing', D, go(''))
  await shot('desktop-02-results', D, go('#/analysis/results', '#results'))
  await shot('desktop-03-pressure', D, go('#/analysis/pressure', '#pressure .two'))
  await shot('desktop-04-performance', D, go('#/analysis/performance', '#performance .plates'))
  await shot('desktop-05-rating', D, go('#/analysis/rating', '#rating'))
  await shot('desktop-06-evidence-scatter', D, go('#/analysis/evidence', '#evidence .two'))
  await shot('desktop-07-certainty', D, go('#/analysis/limits', '#limits .limits'))
  await shot('desktop-08-ask', D, go('#/analysis/ask', '#ask'))
  await shot('desktop-09-dossier', D, go('#/player/6281/bat'))
  await shot('mobile-01-landing', M, go(''))
  await shot('mobile-02-results', M, go('#/analysis/results', '#results .hero-r'))
  await shot('mobile-03-pressure', M, go('#/analysis/pressure', '#pressure .two'))
  await shot('mobile-04-dossier', M, go('#/player/2933/bowl'))
  await shot('tablet-01-results', { width: 820, height: 1100 }, go('#/analysis/results', '#results .ledger'))
})
