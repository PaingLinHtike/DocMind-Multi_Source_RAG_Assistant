export const DUMMY_ACCOUNT = {
  email: 'user@gmail.com',
  password: 'userUSER1234@@',
}

export function validateCredentials(email, password) {
  return email.trim().toLowerCase() === DUMMY_ACCOUNT.email && password === DUMMY_ACCOUNT.password
}

export function getPasswordValidation(password) {
  const validation = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }

  return { ...validation, valid: Object.values(validation).every(Boolean) }
}
