import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QuizProvider } from '../contexts/QuizContext.jsx'
import DecksPage from './DecksPage.jsx'
import { exportLibrarySnapshot } from '../shared/services/indexedDB.js'

vi.mock('../shared/services/indexedDB.js', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    exportLibrarySnapshot: vi.fn(async () => ({
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      decks: [],
    })),
  }
})

let origAnchorClick

beforeEach(() => {
  vi.mocked(exportLibrarySnapshot).mockClear()
  origAnchorClick = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = vi.fn()
})

afterEach(() => {
  HTMLAnchorElement.prototype.click = origAnchorClick
})

function renderDecks() {
  return render(
    <QuizProvider>
      <MemoryRouter>
        <DecksPage />
      </MemoryRouter>
    </QuizProvider>,
  )
}

describe('DecksPage library backup', () => {
  it('calls exportLibrarySnapshot when Export library is clicked', async () => {
    const user = userEvent.setup()
    renderDecks()

    await user.click(screen.getByRole('button', { name: /export library/i }))
    expect(exportLibrarySnapshot).toHaveBeenCalledTimes(1)
  })
})
