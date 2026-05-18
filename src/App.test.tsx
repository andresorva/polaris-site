import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('redirects from / and renders the POLARIS login when not authenticated', async () => {
    window.history.pushState({}, '', '/')
    window.localStorage.removeItem('polaris_session')

    render(<App />)

    // Lazy-loaded login page resolves async — wait for it.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'POLARIS' })).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: /entrar/i }),
    ).toBeInTheDocument()
  })
})
