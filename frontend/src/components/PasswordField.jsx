import { useState } from 'react';

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  maxLength,
  required = true
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <span className="auth-password-control">
        <input
          className="auth-input"
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={id}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.3 0 9 5.1 9 7a9.8 9.8 0 0 1-2.1 3.2M6.2 6.2C4.2 7.6 3 9.7 3 12c0 1.9 3.7 7 9 7 1.1 0 2.1-.2 3-.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </span>
    </>
  );
}

export default PasswordField;
