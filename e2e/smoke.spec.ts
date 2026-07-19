import { expect, test } from '@playwright/test'

test('opens every primary productivity section', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Poojitha/i })).toBeVisible()
  for (const section of ['Today','Habits','Planner','Calendar','GATE','AI Roadmap','Semester 5','Projects','Learning Hub','Focus Mode','Achievements','Analytics','Reviews','Settings']) {
    await page.getByRole('link', { name: section, exact: true }).click()
    await expect(page.locator('main')).toBeVisible()
  }
})

test('creates a habit and records a completion', async ({ page }) => {
  await page.goto('/habits')
  await page.getByRole('button', { name: 'New habit' }).click()
  await page.getByLabel('Habit name').fill('Playwright habit')
  await page.getByRole('button', { name: 'Save habit' }).click()
  const card=page.locator('article').filter({ hasText: 'Playwright habit' })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'Done' }).click()
  await expect(card.getByRole('button', { name: 'Done' })).toHaveClass(/active/)
})
