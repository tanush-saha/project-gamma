import React, { useEffect, useId, useRef } from "react";

export function Button({ as: Element = "button", variant = "primary", className = "", ...props }) {
  return <Element className={`ui-button ui-button-${variant} ${className}`.trim()} {...props} />;
}

export function Input({ label, id, error, hint, ...props }) {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;
  const describedBy = [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined;
  return <label className="ui-input" htmlFor={inputId}>
    {label && <span>{label}</span>}
    <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
    {hint && <small id={`${inputId}-hint`}>{hint}</small>}
    {error && <small id={`${inputId}-error`} role="alert">{error}</small>}
  </label>;
}

export function Card({ as: Element = "article", className = "", ...props }) {
  return <Element className={`ui-card ${className}`.trim()} {...props} />;
}

export function Modal({ title, onClose, children, className = "" }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previousFocus = document.activeElement;
    dialog.querySelector("button, input, select, textarea, a[href]")?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]")];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return <div className="ui-modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose?.();
  }}>
    <section ref={dialogRef} className={`ui-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="ui-modal-close" onClick={onClose} aria-label="Close dialog">×</button>
      {children}
    </section>
  </div>;
}

export function Toast({ children, variant = "info", onDismiss, role }) {
  return <div className={`ui-toast ui-toast-${variant}`} role={role || (variant === "error" ? "alert" : "status")}>
    <span>{children}</span>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button>}
  </div>;
}

export function Tabs({ items, value, onChange, label, className = "", itemClassName = "" }) {
  function moveFocus(event, index) {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1
      : event.key === "Home" ? -index : event.key === "End" ? items.length - index - 1 : 0;
    if (!direction) return;
    event.preventDefault();
    const nextIndex = (index + direction + items.length) % items.length;
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
    onChange(items[nextIndex].value);
  }
  return <div className={`ui-tabs ${className}`.trim()} role="tablist" aria-label={label}>
    {items.map((item, index) => <button key={item.value} type="button" role="tab" aria-selected={value === item.value}
      tabIndex={value === item.value ? 0 : -1}
      className={`${itemClassName} ${value === item.value ? "is-active" : ""}`.trim()}
      onClick={() => onChange(item.value)} onKeyDown={(event) => moveFocus(event, index)}>{item.label}</button>)}
  </div>;
}

export function Badge({ children, variant = "default" }) {
  return <span className={`ui-badge ui-badge-${variant}`}>{children}</span>;
}

export function ProgressBar({ value, label, className = "" }) {
  const normalizedValue = Math.min(100, Math.max(0, Number(value) || 0));
  return <div className={`ui-progress ${className}`.trim()} role="progressbar" aria-label={label}
    aria-valuenow={normalizedValue} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${normalizedValue}%` }} />
  </div>;
}

export function EmptyState({ title, children, icon = "✳" }) {
  return <section className="ui-empty-state">
    <span aria-hidden="true">{icon}</span><h2>{title}</h2>{children && <p>{children}</p>}
  </section>;
}

export function Skeleton({ className = "", lines = 1 }) {
  return <div className={`ui-skeleton ${className}`.trim()} aria-hidden="true">
    {Array.from({ length: lines }, (_, index) => <span key={index} />)}
  </div>;
}

export function ThemeToggle({ theme, onChange, className = "" }) {
  const nextTheme = theme === "focus" ? "day" : "focus";
  return <button type="button" className={`theme-toggle ${className}`.trim()} aria-pressed={theme === "focus"}
    onClick={() => onChange(nextTheme)}>{theme === "focus" ? "☼ Day study" : "◐ Focus mode"}</button>;
}
