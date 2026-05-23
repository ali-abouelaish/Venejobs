// Forms — FormField wrapper plus TextInput, Textarea, Select, NumberInput,
// PriceInput, Checkbox, Radio.
//
// Visual rules from the design system preview:
//  height: 44px, padding 0 16px, border 1px var(--border-4), radius 8px,
//  background white, font 14px DM Sans, focus border var(--border-5) with a
//  2px brand ring at 2px offset.

function FormField({ label, hint, error, required, htmlFor, children, side }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {(label || side) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {label && (
            <label htmlFor={htmlFor} style={{
              fontSize: 13, fontWeight: 600, color: "var(--fg-2)",
              fontFamily: "DM Sans",
            }}>
              {label}
              {required && <span style={{ color: "var(--status-error)", marginLeft: 4 }}>*</span>}
            </label>
          )}
          {side && <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{side}</div>}
        </div>
      )}
      {children}
      {error
        ? <div style={{ fontSize: 12, color: "var(--status-error)", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="alert" size={12}/> {error}
          </div>
        : hint && <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{hint}</div>}
    </div>
  );
}

const inputBase = {
  height: 44, padding: "0 14px", borderRadius: 8,
  border: "1px solid var(--border-4)", background: "white",
  fontFamily: "DM Sans", fontSize: 14, color: "var(--fg-1)",
  width: "100%", boxSizing: "border-box",
  transition: "border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)",
  outline: "none",
};

function applyFocus(e) {
  e.target.style.borderColor = "var(--brand, var(--client-primary))";
  e.target.style.boxShadow = "0 0 0 3px var(--brand-soft, var(--client-primary-soft))";
}
function clearFocus(e) {
  e.target.style.borderColor = "var(--border-4)";
  e.target.style.boxShadow = "none";
}

function TextInput({ value, onChange, placeholder, type = "text", icon, suffix, error, ...rest }) {
  const border = error ? "var(--status-error)" : "var(--border-4)";
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {icon && (
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-4)", pointerEvents: "none" }}>
          <Icon name={icon} size={16}/>
        </div>
      )}
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        onFocus={applyFocus} onBlur={clearFocus}
        {...rest}
        style={{ ...inputBase, borderColor: border, paddingLeft: icon ? 38 : 14, paddingRight: suffix ? 50 : 14 }}
      />
      {suffix && (
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-4)", fontSize: 13, fontWeight: 500 }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, error, ...rest }) {
  const border = error ? "var(--status-error)" : "var(--border-4)";
  return (
    <textarea
      value={value ?? ""} rows={rows}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      onFocus={applyFocus} onBlur={clearFocus}
      {...rest}
      style={{
        ...inputBase, height: "auto", padding: "12px 14px", lineHeight: 1.55,
        resize: "vertical", borderColor: border,
      }}
    />
  );
}

function Select({ value, onChange, options = [], placeholder, error, ...rest }) {
  const border = error ? "var(--status-error)" : "var(--border-4)";
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value ?? ""}
        onChange={e => onChange?.(e.target.value)}
        onFocus={applyFocus} onBlur={clearFocus}
        {...rest}
        style={{
          ...inputBase, borderColor: border, appearance: "none",
          paddingRight: 38, cursor: "pointer",
        }}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => (
          typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-4)" }}>
        <Icon name="chevronDown" size={16}/>
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, error }) {
  const inc = () => onChange?.(Math.min(max ?? Infinity, (Number(value) || 0) + step));
  const dec = () => onChange?.(Math.max(min ?? -Infinity, (Number(value) || 0) - step));
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", height: 44,
      border: `1px solid ${error ? "var(--status-error)" : "var(--border-4)"}`,
      borderRadius: 8, overflow: "hidden", background: "white",
    }}>
      <button type="button" onClick={dec} style={iconBtnInGroup}>
        <Icon name="minus" size={14}/>
      </button>
      <input
        type="number" value={value ?? 0}
        onChange={e => onChange?.(Number(e.target.value))}
        min={min} max={max} step={step}
        style={{
          width: 60, textAlign: "center", border: "none", outline: "none",
          fontFamily: "DM Sans", fontSize: 14, fontWeight: 600, color: "var(--fg-1)",
          background: "transparent",
        }}
      />
      <button type="button" onClick={inc} style={iconBtnInGroup}>
        <Icon name="plus" size={14}/>
      </button>
    </div>
  );
}
const iconBtnInGroup = {
  width: 36, height: "100%", border: "none", background: "transparent",
  color: "var(--fg-3)", cursor: "pointer", display: "grid", placeItems: "center",
};

// PriceInput — accepts integer pence, renders dollars with two decimals. Stores
// integer pence on change. Used wherever the user sets money in the UI.
function PriceInput({ value, onChange, placeholder = "0.00", error }) {
  const [text, setText] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => {
    if (focused) return;
    if (value == null || value === 0) setText("");
    else setText((value / 100).toFixed(2));
  }, [value, focused]);
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        color: "var(--fg-3)", fontWeight: 600, fontSize: 14, pointerEvents: "none",
      }}>$</div>
      <input
        inputMode="decimal"
        value={text}
        onChange={e => {
          const v = e.target.value.replace(/[^0-9.]/g, "");
          setText(v);
          onChange?.(parsePrice(v));
        }}
        onFocus={e => { setFocused(true); applyFocus(e); }}
        onBlur={e => {
          setFocused(false);
          clearFocus(e);
          // normalize display
          if (value) setText((value / 100).toFixed(2));
        }}
        placeholder={placeholder}
        style={{
          ...inputBase, paddingLeft: 28,
          borderColor: error ? "var(--status-error)" : "var(--border-4)",
        }}
      />
    </div>
  );
}

function Checkbox({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5,
        background: checked ? "var(--brand, var(--client-primary))" : "white",
        border: `1.5px solid ${checked ? "var(--brand, var(--client-primary))" : "var(--border-4)"}`,
        display: "grid", placeItems: "center", flexShrink: 0,
        transition: "all 120ms var(--ease-out)",
      }}>
        {checked && <Icon name="check" size={12} color="white" strokeWidth={3}/>}
      </span>
      <input type="checkbox" checked={!!checked} disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}/>
      {label && <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{label}</span>}
    </label>
  );
}

function Radio({ checked, onChange, label, name }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `1.5px solid ${checked ? "var(--brand, var(--client-primary))" : "var(--border-4)"}`,
        display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1,
        transition: "all 120ms var(--ease-out)",
      }}>
        {checked && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand, var(--client-primary))" }}/>}
      </span>
      <input type="radio" name={name} checked={!!checked}
        onChange={e => onChange?.(e.target.checked)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}/>
      {label && <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{label}</span>}
    </label>
  );
}

// AttachmentUploader — simulates the R2 presign + upload flow.
// In production: 1) POST /api/upload/presign → { url, r2Key } 2) PUT file to url
// 3) collect { r2Key, filename, size, mime } and send to the deliver endpoint.
function AttachmentUploader({ files = [], onChange, maxSize = 25 * 1024 * 1024 }) {
  const ref = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const ingest = list => {
    const next = Array.from(list).map(f => ({
      id: Math.random().toString(36).slice(2),
      filename: f.name, size: f.size, mime: f.type || "application/octet-stream",
      r2Key: `service-deliveries/${Date.now()}-${f.name.replace(/\s+/g, "_")}`,
      progress: 0, status: "uploading",
    }));
    onChange?.([...files, ...next]);
    // simulate upload
    next.forEach(item => {
      let p = 0;
      const tick = () => {
        p += 12 + Math.random() * 22;
        if (p >= 100) {
          onChange?.(prev => prev.map(x => x.id === item.id ? { ...x, progress: 100, status: "done" } : x));
          // because onChange is called with the latest closure list, simulate via timeout
        } else {
          onChange?.(prev => prev.map(x => x.id === item.id ? { ...x, progress: p } : x));
          setTimeout(tick, 220);
        }
      };
      // we need to use functional updates via a wrapping setter — host components
      // should pass `onChange` that supports functional updates (we use useState directly).
      setTimeout(tick, 200);
    });
  };

  const remove = id => onChange?.(files.filter(f => f.id !== id));

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files);
        }}
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--brand, var(--client-primary))" : "var(--border-4)"}`,
          borderRadius: 12, padding: 28, textAlign: "center", cursor: "pointer",
          background: dragOver ? "var(--brand-soft, var(--client-primary-soft))" : "var(--bg-subtle)",
          transition: "all 120ms var(--ease-out)",
        }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--brand-tint, var(--client-primary-tint))",
          color: "var(--brand, var(--client-primary))",
          display: "grid", placeItems: "center", margin: "0 auto 10px",
        }}>
          <Icon name="upload" size={20}/>
        </div>
        <div style={{ fontSize: 14, color: "var(--fg-2)", fontWeight: 600 }}>
          Drop files here or <span style={{ color: "var(--brand, var(--client-primary))" }}>browse</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4 }}>
          Up to {fileSize(maxSize)} per file. PDF, ZIP, images, and common doc formats.
        </div>
        <input
          ref={ref} type="file" multiple
          onChange={e => e.target.files && ingest(e.target.files)}
          style={{ display: "none" }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", border: "1px solid var(--border-2)",
              borderRadius: 10, background: "white",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: "var(--bg-muted)", color: "var(--fg-3)",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <Icon name={mimeKind(f.mime) === "image" ? "image" : "file"} size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.filename}
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-4)" }}>
                  {fileSize(f.size)}
                  {f.status === "uploading" && ` • Uploading ${Math.floor(f.progress)}%`}
                  {f.status === "done" && " • Uploaded"}
                </div>
                {f.status === "uploading" && (
                  <div style={{ marginTop: 6, height: 3, background: "var(--bg-muted)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${f.progress}%`, height: "100%", background: "var(--brand, var(--client-primary))", transition: "width 200ms var(--ease-out)" }}/>
                  </div>
                )}
              </div>
              {f.status === "done" && <Icon name="checkCircle" size={18} color="var(--status-success)"/>}
              <IconButton icon="trash" title="Remove" onClick={() => remove(f.id)} danger/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AddonRow — selectable row used in checkout and order detail.
function AddonRow({ addon, quantity, onQuantityChange, max = 5 }) {
  const checked = quantity > 0;
  const toggle = () => onQuantityChange?.(checked ? 0 : 1);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: 14, borderRadius: 10,
      border: `1px solid ${checked ? "var(--brand, var(--client-primary))" : "var(--border-2)"}`,
      background: checked ? "var(--brand-soft, var(--client-primary-soft))" : "white",
      transition: "all 120ms var(--ease-out)",
      flexWrap: "wrap",
    }}>
      <Checkbox checked={checked} onChange={toggle} />
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{addon.name}</div>
        {addon.description && <div style={{ fontSize: 13, color: "var(--fg-4)", marginTop: 2 }}>{addon.description}</div>}
        <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {addon.type && <span style={{ textTransform: "capitalize" }}>{addon.type.replace("_", " ")}</span>}
          {addon.deliveryDelta && <span>+{addon.deliveryDelta}d delivery</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {checked && addon.allowMulti && (
          <NumberInput value={quantity} onChange={onQuantityChange} min={1} max={max}/>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-1)", minWidth: 64, textAlign: "right" }}>
          {formatPrice(addon.price * (checked ? quantity : 1))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  FormField, TextInput, Textarea, Select, NumberInput, PriceInput,
  Checkbox, Radio, AttachmentUploader, AddonRow,
});
