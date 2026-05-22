import { expect } from 'vitest'
globalThis.expect = expect

import '@testing-library/jest-dom'
import './src/i18n'

// JSDOM does not implement IntersectionObserver, which scroll-reveal animations
// in the marketing/home components rely on. Stub it so those components mount.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver = IntersectionObserverStub
window.IntersectionObserver = IntersectionObserverStub

// JSDOM also lacks ResizeObserver, used by responsive/layout components.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub
window.ResizeObserver = ResizeObserverStub
