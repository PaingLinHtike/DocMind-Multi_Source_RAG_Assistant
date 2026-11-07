import Field from '../ui/Field.jsx'

export default function AuthField({ icon, ...props }) {
  return <Field controlClassName="auth-field-control min-h-12 focus-within:border-focus" inputClassName="auth-input min-h-12" leadingIcon={icon} {...props} />
}
