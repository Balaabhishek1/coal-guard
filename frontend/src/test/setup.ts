import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia if not implemented in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill ResizeObserver for headless jsdom testing
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as any).ResizeObserver = ResizeObserverMock;
window.ResizeObserver = ResizeObserverMock as any;

// Polyfill IntersectionObserver for headless jsdom testing
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as any).IntersectionObserver = IntersectionObserverMock;
window.IntersectionObserver = IntersectionObserverMock as any;

// Polyfill requestAnimationFrame and cancelAnimationFrame for headless jsdom testing
if (!globalThis.requestAnimationFrame) {
  (globalThis as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16) as unknown as number;
  };
}
if (!globalThis.cancelAnimationFrame) {
  (globalThis as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Polyfill window.scrollTo for headless jsdom testing
window.scrollTo = vi.fn();
