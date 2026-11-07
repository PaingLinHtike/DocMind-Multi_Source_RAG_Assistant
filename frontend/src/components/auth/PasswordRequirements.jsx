import { getPasswordValidation } from '../../auth/auth.js'
import Icon from '../ui/Icon.jsx'

const rules = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'uppercase', label: 'One uppercase letter' },
  { key: 'lowercase', label: 'One lowercase letter' },
  { key: 'number', label: 'One number' },
  { key: 'symbol', label: 'One symbol' },
]

export default function PasswordRequirements({ password }) {
  const validation = getPasswordValidation(password)

  return (
    <ul aria-atomic="false" aria-label="Password requirements" aria-live="polite" className="space-y-1 text-sm leading-5">
      {rules.map(({ key, label }) => {
        const met = validation[key]
        return (
          <li className={`flex items-start gap-2 ${met ? 'text-success' : 'text-text-muted'}`} key={key}>
            <Icon className="mt-0.5 shrink-0" name={met ? 'check' : 'circle'} size={16} />
            <span className="min-w-0">
              <span className="sr-only">{met ? 'Met: ' : 'Not met: '}</span>
              {label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
