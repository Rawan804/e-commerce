

export type ValidationResult = string | null



export function required(value: unknown, label = 'This field'): ValidationResult {
  if (value === null || value === undefined) return `${label} is required.`
  if (typeof value === 'string' && value.trim() === '') return `${label} is required.`
  return null
}

export function minLength(
  value: string,
  min: number,
  label = 'This field',
): ValidationResult {
  if (value.length < min) return `${label} must be at least ${min} characters.`
  return null
}

export function maxLength(
  value: string,
  max: number,
  label = 'This field',
): ValidationResult {
  if (value.length > max) return `${label} must be at most ${max} characters.`
  return null
}



const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function email(value: string): ValidationResult {
  if (!EMAIL_RE.test(value)) return 'Please enter a valid email address.'
  return null
}



export function password(value: string): ValidationResult {
  if (value.length < 8) return 'Password must be at least 8 characters.'
  return null
}

export function passwordConfirmation(
  value: string,
  original: string,
): ValidationResult {
  if (value !== original) return 'Passwords do not match.'
  return null
}



export function positiveNumber(value: number, label = 'This field'): ValidationResult {
  if (isNaN(value) || value <= 0) return `${label} must be a positive number.`
  return null
}


export function compose(
  ...validators: (() => ValidationResult)[]
): ValidationResult {
  for (const validate of validators) {
    const result = validate()
    if (result !== null) return result
  }
  return null
}
