import { describe, expect, it } from 'vitest'
import { DUMMY_ACCOUNT, getPasswordValidation, validateCredentials } from '../auth/auth.js'

describe('authentication helpers', () => {
  it('accepts the approved dummy credentials after normalizing only the email', () => {
    expect(DUMMY_ACCOUNT).toEqual({ email: 'user@gmail.com', password: 'userUSER1234@@' })
    expect(validateCredentials('  USER@GMAIL.COM ', 'userUSER1234@@')).toBe(true)
    expect(validateCredentials('user@gmail.com', ' userUSER1234@@ ')).toBe(false)
  })

  it('rejects incorrect dummy credentials', () => {
    expect(validateCredentials('other@gmail.com', 'userUSER1234@@')).toBe(false)
    expect(validateCredentials('user@gmail.com', 'userUSER1234@')).toBe(false)
  })

  it('accepts an eight-character password containing every required character class', () => {
    expect(getPasswordValidation('Aa1!aaaa')).toEqual({
      minLength: true,
      uppercase: true,
      lowercase: true,
      number: true,
      symbol: true,
      valid: true,
    })
  })

  it.each([
    ['minimum length', 'Aa1!aaa', 'minLength'],
    ['uppercase letter', 'aa1!aaaa', 'uppercase'],
    ['lowercase letter', 'AA1!AAAA', 'lowercase'],
    ['number', 'Aa!!aaaa', 'number'],
    ['symbol', 'Aa11aaaa', 'symbol'],
  ])('rejects a password missing the required %s', (_label, password, missingRule) => {
    const validation = getPasswordValidation(password)

    expect(validation[missingRule]).toBe(false)
    expect(validation.valid).toBe(false)
  })
})
