import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App.jsx'

// Mock health check service
vi.mock('./services/healthService', () => ({
  checkHealth: vi.fn().mockResolvedValue({ status: 'UP', timestamp: Date.now() })
}))

// Mock matchMedia for JSDOM
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('App', () => {
  it('renders title', async () => {
    render(<App />)
    expect(screen.getAllByText(/Roomify/i).length).toBeGreaterThan(0)
    expect(
      screen.getByRole('heading', {
        name: /Run rooms, reservations, staff, and billing from one polished PMS\./i,
      })
    ).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /Sign In/i }).length).toBeGreaterThan(0)
  })
})
