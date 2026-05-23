'use client';

import * as React from 'react';
import { Icon, IconName } from './Icon';
import { IconButton } from './Primitives';
import { fileSize, mimeKind, parsePrice, formatPrice } from '../lib/format';

// ---------------------------- FormField ----------------------------
interface FormFieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  side?: React.ReactNode;
}
export function FormField({ label, hint, error, required, htmlFor, children, side }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || side) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {label && (
            <label
              htmlFor={htmlFor}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', fontFamily: 'DM Sans' }}
            >
              {label}
              {required && <span style={{ color: 'var(--status-error)', marginLeft: 4 }}>*</span>}
            </label>
          )}
          {side && <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>{side}</div>}
        </div>
      )}
      {children}
      {error ? (
        <div style={{ fontSize: 12, color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="alert" size={12} /> {error}
        </div>
      ) : hint ? (
        <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>{hint}</div>
      ) : null}
    </div>
  );
}

const INPUT_BASE: React.CSSProperties = {
  height: 44, padding: '0 14px', borderRadius: 8,
  border: '1px solid var(--border-4)', background: '#fff',
  fontFamily: 'DM Sans', fontSize: 14, color: 'var(--fg-1)',
  width: '100%', boxSizing: 'border-box',
  transition: 'border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)',
  outline: 'none',
};

function applyFocus(el: HTMLElement) {
  el.style.borderColor = 'var(--brand, var(--client-primary))';
  el.style.boxShadow = '0 0 0 3px var(--brand-soft, var(--client-primary-soft))';
}
function clearFocus(el: HTMLElement) {
  el.style.borderColor = 'var(--border-4)';
  el.style.boxShadow = 'none';
}

// ---------------------------- TextInput ----------------------------
interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: IconName;
  suffix?: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
  maxLength?: number;
}
export function TextInput({ value, onChange, placeholder, type = 'text', icon, suffix, error, disabled, id, autoFocus, maxLength }: TextInputProps) {
  const borderColor = error ? 'var(--status-error)' : 'var(--border-4)';
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', pointerEvents: 'none' }}>
          <Icon name={icon} size={16} />
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onFocus={e => applyFocus(e.target)}
        onBlur={e => clearFocus(e.target)}
        style={{
          ...INPUT_BASE,
          borderColor,
          paddingLeft: icon ? 38 : 14,
          paddingRight: suffix ? 50 : 14,
          opacity: disabled ? 0.65 : 1,
          background: disabled ? 'var(--bg-muted)' : '#fff',
        }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontSize: 13, fontWeight: 500 }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

// ---------------------------- Textarea ----------------------------
interface TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  maxLength?: number;
}
export function Textarea({ value, onChange, placeholder, rows = 4, error, disabled, id, maxLength }: TextareaProps) {
  const borderColor = error ? 'var(--status-error)' : 'var(--border-4)';
  return (
    <textarea
      id={id}
      value={value ?? ''}
      rows={rows}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      onFocus={e => applyFocus(e.target)}
      onBlur={e => clearFocus(e.target)}
      style={{
        ...INPUT_BASE,
        height: 'auto', padding: '12px 14px', lineHeight: 1.55,
        resize: 'vertical', borderColor,
        opacity: disabled ? 0.65 : 1,
        background: disabled ? 'var(--bg-muted)' : '#fff',
      }}
    />
  );
}

// ---------------------------- Select ----------------------------
export interface SelectOption { value: string; label: string }
interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export function Select({ value, onChange, options, placeholder, error, disabled, id, style }: SelectProps) {
  const borderColor = error ? 'var(--status-error)' : 'var(--border-4)';
  return (
    <div style={{ position: 'relative', ...style }}>
      <select
        id={id}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        onFocus={e => applyFocus(e.target)}
        onBlur={e => clearFocus(e.target)}
        disabled={disabled}
        style={{
          ...INPUT_BASE, borderColor,
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          paddingRight: 38, cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
          background: disabled ? 'var(--bg-muted)' : '#fff',
        }}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o =>
          typeof o === 'string' ? (
            <option key={o} value={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>{o.label}</option>
          ),
        )}
      </select>
      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-4)' }}>
        <Icon name="chevronDown" size={16} />
      </div>
    </div>
  );
}

// ---------------------------- NumberInput ----------------------------
interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: boolean;
  disabled?: boolean;
}
export function NumberInput({ value, onChange, min, max, step = 1, error, disabled }: NumberInputProps) {
  const inc = () => onChange(Math.min(max ?? Infinity, (Number(value) || 0) + step));
  const dec = () => onChange(Math.max(min ?? -Infinity, (Number(value) || 0) - step));
  const iconBtn: React.CSSProperties = {
    width: 36, height: '100%', border: 'none', background: 'transparent',
    color: 'var(--fg-3)', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'grid', placeItems: 'center',
  };
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', height: 44,
        border: `1px solid ${error ? 'var(--status-error)' : 'var(--border-4)'}`,
        borderRadius: 8, overflow: 'hidden', background: '#fff',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <button type="button" onClick={dec} disabled={disabled} style={iconBtn}>
        <Icon name="minus" size={14} />
      </button>
      <input
        type="number"
        value={value ?? 0}
        onChange={e => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{
          width: 60, textAlign: 'center', border: 'none', outline: 'none',
          fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)',
          background: 'transparent',
        }}
      />
      <button type="button" onClick={inc} disabled={disabled} style={iconBtn}>
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

// ---------------------------- PriceInput ----------------------------
// Stores integer pence. Displays the dollar amount with two decimals on blur.
interface PriceInputProps {
  value: number;
  onChange: (pence: number) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
}
export function PriceInput({ value, onChange, placeholder = '0.00', error, disabled, id }: PriceInputProps) {
  const [text, setText] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => {
    if (focused) return;
    if (value == null || value === 0) setText('');
    else setText((value / 100).toFixed(2));
  }, [value, focused]);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--fg-3)', fontWeight: 600, fontSize: 14, pointerEvents: 'none',
      }}>$</div>
      <input
        id={id}
        inputMode="decimal"
        value={text}
        disabled={disabled}
        onChange={e => {
          const v = e.target.value.replace(/[^0-9.]/g, '');
          setText(v);
          onChange(parsePrice(v));
        }}
        onFocus={e => { setFocused(true); applyFocus(e.target); }}
        onBlur={e => {
          setFocused(false);
          clearFocus(e.target);
          if (value) setText((value / 100).toFixed(2));
        }}
        placeholder={placeholder}
        style={{
          ...INPUT_BASE,
          paddingLeft: 28,
          borderColor: error ? 'var(--status-error)' : 'var(--border-4)',
          opacity: disabled ? 0.65 : 1,
          background: disabled ? 'var(--bg-muted)' : '#fff',
        }}
      />
    </div>
  );
}

// ---------------------------- Checkbox / Radio ----------------------------
export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; disabled?: boolean }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span
        style={{
          width: 18, height: 18, borderRadius: 5,
          background: checked ? 'var(--brand, var(--client-primary))' : '#fff',
          border: `1.5px solid ${checked ? 'var(--brand, var(--client-primary))' : 'var(--border-4)'}`,
          display: 'grid', placeItems: 'center', flexShrink: 0,
          transition: 'all 120ms var(--ease-out)',
        }}
      >
        {checked && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      {label && <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>{label}</span>}
    </label>
  );
}

export function Radio({ checked, onChange, label, name }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; name?: string }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
      <span
        style={{
          width: 18, height: 18, borderRadius: '50%',
          border: `1.5px solid ${checked ? 'var(--brand, var(--client-primary))' : 'var(--border-4)'}`,
          display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1,
          transition: 'all 120ms var(--ease-out)',
        }}
      >
        {checked && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand, var(--client-primary))' }} />}
      </span>
      <input
        type="radio"
        name={name}
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      {label && <span style={{ fontSize: 14, color: 'var(--fg-2)' }}>{label}</span>}
    </label>
  );
}

// ---------------------------- AttachmentUploader ----------------------------
// Real R2 flow: 1) POST /api/upload/presign  -> { url, r2Key, ... }
//               2) PUT the file to `url`
//               3) Collect { r2Key, filename, size, mime } and send on submit.
export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  mime: string;
  r2Key: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
}
export interface AttachmentUploaderProps {
  files: UploadedFile[];
  onChange: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  presignPath?: string;
  maxSize?: number;
  accept?: string;
}
export function AttachmentUploader({
  files, onChange, presignPath = '/api/upload/presign',
  maxSize = 20 * 1024 * 1024, accept,
}: AttachmentUploaderProps) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const ingest = React.useCallback(async (list: FileList | File[]) => {
    const arr: File[] = Array.from(list);
    for (const file of arr) {
      const localId = Math.random().toString(36).slice(2);
      const placeholder: UploadedFile = {
        id: localId,
        filename: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        r2Key: '',
        progress: 0,
        status: 'uploading',
      };
      onChange(prev => [...prev, placeholder]);

      if (file.size > maxSize) {
        onChange(prev => prev.map(f => f.id === localId ? { ...f, status: 'error', errorMessage: 'File is larger than the allowed size.' } : f));
        continue;
      }

      try {
        const presignRes = await fetch(presignPath, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          }),
        });
        const presignData = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok || !presignData?.presignedUrl || !presignData?.key) {
          throw new Error(presignData?.error || `Presign failed (${presignRes.status})`);
        }
        const r2Key: string = presignData.key;
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presignData.presignedUrl, true);
          if (file.type) xhr.setRequestHeader('content-type', file.type);
          xhr.upload.onprogress = ev => {
            if (ev.lengthComputable) {
              const pct = (ev.loaded / ev.total) * 100;
              onChange(prev => prev.map(f => f.id === localId ? { ...f, progress: pct, r2Key } : f));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error('Upload network error'));
          xhr.send(file);
        });
        onChange(prev => prev.map(f => f.id === localId ? { ...f, progress: 100, status: 'done', r2Key } : f));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        onChange(prev => prev.map(f => f.id === localId ? { ...f, status: 'error', errorMessage: msg } : f));
      }
    }
  }, [onChange, presignPath, maxSize]);

  const remove = (id: string) => onChange(prev => prev.filter(f => f.id !== id));

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void ingest(e.dataTransfer.files);
        }}
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--brand, var(--client-primary))' : 'var(--border-4)'}`,
          borderRadius: 12, padding: 28, textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'var(--brand-soft, var(--client-primary-soft))' : 'var(--bg-subtle)',
          transition: 'all 120ms var(--ease-out)',
        }}
      >
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--brand-tint, var(--client-primary-tint))',
            color: 'var(--brand, var(--client-primary))',
            display: 'grid', placeItems: 'center', margin: '0 auto 10px',
          }}
        >
          <Icon name="upload" size={20} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', fontWeight: 600 }}>
          Drop files here or <span style={{ color: 'var(--brand, var(--client-primary))' }}>browse</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4 }}>
          Up to {fileSize(maxSize)} per file.
        </div>
        <input
          ref={ref}
          type="file"
          multiple
          accept={accept}
          onChange={e => { if (e.target.files) void ingest(e.target.files); e.target.value = ''; }}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {files.map(f => (
            <div
              key={f.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                border: `1px solid ${f.status === 'error' ? 'var(--status-error)' : 'var(--border-2)'}`,
                borderRadius: 10, background: '#fff',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'var(--bg-muted)', color: 'var(--fg-3)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}
              >
                <Icon name={mimeKind(f.mime) === 'image' ? 'image' : 'file'} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.filename}
                </div>
                <div style={{ fontSize: 12, color: f.status === 'error' ? 'var(--status-error)' : 'var(--fg-4)' }}>
                  {fileSize(f.size)}
                  {f.status === 'uploading' && ` · Uploading ${Math.floor(f.progress)}%`}
                  {f.status === 'done' && ' · Uploaded'}
                  {f.status === 'error' && (f.errorMessage ? ` · ${f.errorMessage}` : ' · Upload failed')}
                </div>
                {f.status === 'uploading' && (
                  <div style={{ marginTop: 6, height: 3, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${f.progress}%`, height: '100%', background: 'var(--brand, var(--client-primary))', transition: 'width 200ms var(--ease-out)' }} />
                  </div>
                )}
              </div>
              {f.status === 'done' && <Icon name="checkCircle" size={18} color="var(--status-success)" />}
              <IconButton icon="trash" title="Remove" onClick={() => remove(f.id)} danger />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------- AddonRow ----------------------------
export interface AddonLike {
  id: string;
  type?: string;
  name: string;
  description?: string | null;
  price: number;
  allowMulti?: boolean;
  deliveryDelta?: number;
}
export function AddonRow({
  addon, quantity, onQuantityChange, max = 5, currency,
}: {
  addon: AddonLike;
  quantity: number;
  onQuantityChange: (n: number) => void;
  max?: number;
  currency?: string;
}) {
  const checked = quantity > 0;
  const toggle = () => onQuantityChange(checked ? 0 : 1);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: 10,
        border: `1px solid ${checked ? 'var(--brand, var(--client-primary))' : 'var(--border-2)'}`,
        background: checked ? 'var(--brand-soft, var(--client-primary-soft))' : '#fff',
        transition: 'all 120ms var(--ease-out)',
        flexWrap: 'wrap',
      }}
    >
      <Checkbox checked={checked} onChange={toggle} />
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{addon.name}</div>
        {addon.description && <div style={{ fontSize: 13, color: 'var(--fg-4)', marginTop: 2 }}>{addon.description}</div>}
        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {addon.type && <span style={{ textTransform: 'capitalize' }}>{addon.type.replace('_', ' ')}</span>}
          {addon.deliveryDelta ? <span>{addon.deliveryDelta > 0 ? '+' : ''}{addon.deliveryDelta}d delivery</span> : null}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {checked && addon.allowMulti && (
          <NumberInput value={quantity} onChange={onQuantityChange} min={1} max={max} />
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)', minWidth: 64, textAlign: 'right' }}>
          {formatPrice(addon.price * (checked ? quantity : 1), { currency })}
        </div>
      </div>
    </div>
  );
}
