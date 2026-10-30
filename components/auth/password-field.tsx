'use client'

import { useId, useState } from 'react'

type PasswordFieldProps = {
  autoComplete: 'current-password' | 'new-password'
  label: string
  minLength?: number
  onChange: (value: string) => void
  required?: boolean
  value: string
}

export function PasswordField({
  autoComplete,
  label,
  minLength,
  onChange,
  required = true,
  value,
}: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="text-sm text-slate-300">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          required={required}
          minLength={minLength}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field w-full pr-20"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          aria-controls={id}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-cyan-300 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  )
}
