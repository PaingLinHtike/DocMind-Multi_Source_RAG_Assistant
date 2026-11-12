import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetCsrfState } from '../api/client.js'

afterEach(() => {
  cleanup()
  resetCsrfState()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  window.sessionStorage.clear()
  window.localStorage.clear()
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
})
