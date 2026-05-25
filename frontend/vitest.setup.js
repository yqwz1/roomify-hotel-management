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

// Motion and layout utilities can call browser-only scrolling APIs that JSDOM
// does not implement. Keep them as harmless no-ops for stable test teardown.
const noop = () => {}
globalThis.scrollTo = noop
window.scrollTo = noop

if (window.HTMLElement && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = noop
}

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16)
}
if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}
window.requestAnimationFrame = globalThis.requestAnimationFrame
window.cancelAnimationFrame = globalThis.cancelAnimationFrame
