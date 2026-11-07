import { buttonClasses } from './buttonStyles.js'

export default function Button({ className = '', variant = 'primary', size = 'default', ...props }) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />
}
