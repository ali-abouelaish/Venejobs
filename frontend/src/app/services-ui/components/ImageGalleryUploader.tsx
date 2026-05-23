'use client';

// Image gallery uploader for service listings. Uploads each image to R2 via
// /api/upload/presign, stores the resulting public URL, and exposes a flat
// string[] of URLs as the value. Up to 10 images, first one is treated as the
// hero / cover on the service detail page.

import * as React from 'react';
import { Icon } from './Icon';
import { IconButton } from './Primitives';
import { fileSize } from '../lib/format';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_BYTES = 20 * 1024 * 1024;

interface UploadEntry {
  id: string;            // local id (always set)
  url: string;           // empty while uploading
  filename: string;
  size: number;
  mime: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

export interface ImageGalleryUploaderProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  presignPath?: string;
}

export function ImageGalleryUploader({
  value, onChange, max = 10, presignPath = '/api/upload/presign',
}: ImageGalleryUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  // Local entries are uploaded-in-progress images. Once an upload finishes we
  // append its public URL to `value` and drop the local entry.
  const [pending, setPending] = React.useState<UploadEntry[]>([]);
  // Tracks the latest value across concurrent uploads. Without this, parallel
  // uploadOne calls close over the same stale `value` and only the last
  // onChange survives — so dropping N files at once produced just 1 URL.
  const valueRef = React.useRef(value);
  React.useEffect(() => { valueRef.current = value; }, [value]);
  const remaining = max - value.length - pending.length;
  const full = remaining <= 0;

  async function uploadOne(file: File) {
    const localId = Math.random().toString(36).slice(2);
    const baseEntry: UploadEntry = {
      id: localId,
      url: '',
      filename: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
      progress: 0,
      status: 'uploading',
    };
    setPending(p => [...p, baseEntry]);

    const fail = (msg: string) =>
      setPending(p => p.map(e => (e.id === localId ? { ...e, status: 'error', errorMessage: msg } : e)));

    if (!ALLOWED_MIME.includes(file.type)) {
      fail('Only JPG, PNG, GIF, or WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      fail('File is larger than 20MB.');
      return;
    }

    try {
      const presignRes = await fetch(presignPath, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok || !presignData?.presignedUrl || !presignData?.publicUrl) {
        throw new Error(presignData?.error || `Presign failed (${presignRes.status})`);
      }
      const publicUrl: string = presignData.publicUrl;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignData.presignedUrl, true);
        if (file.type) xhr.setRequestHeader('content-type', file.type);
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) {
            const pct = (ev.loaded / ev.total) * 100;
            setPending(p => p.map(e => (e.id === localId ? { ...e, progress: pct } : e)));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Upload network error'));
        xhr.send(file);
      });

      // Promote: drop local entry, append URL to value. Read from the ref
      // so concurrent uploads don't overwrite each other's appended URLs.
      setPending(p => p.filter(e => e.id !== localId));
      const next = [...valueRef.current, publicUrl];
      valueRef.current = next;
      onChange(next);
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e));
    }
  }

  async function ingest(list: FileList | File[]) {
    const arr: File[] = Array.from(list).slice(0, Math.max(0, remaining));
    await Promise.all(arr.map(uploadOne));
  }

  function move(index: number, delta: -1 | 1) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function dismissError(id: string) {
    setPending(p => p.filter(e => e.id !== id));
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); if (!full) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (full || !e.dataTransfer.files?.length) return;
          void ingest(e.dataTransfer.files);
        }}
        onClick={() => { if (!full) inputRef.current?.click(); }}
        style={{
          border: `2px dashed ${dragOver ? 'var(--brand, var(--client-primary))' : 'var(--border-4)'}`,
          borderRadius: 12,
          padding: 28,
          textAlign: 'center',
          cursor: full ? 'not-allowed' : 'pointer',
          opacity: full ? 0.5 : 1,
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
          <Icon name="image" size={20} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', fontWeight: 600 }}>
          {full
            ? `Maximum ${max} images reached`
            : <>Drop images here or <span style={{ color: 'var(--brand, var(--client-primary))' }}>browse</span></>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4 }}>
          {full ? 'Remove one to add another.' : `${value.length + pending.length} of ${max} used. JPG, PNG, GIF, WebP up to ${fileSize(MAX_BYTES)}.`}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME.join(',')}
          multiple
          onChange={e => { if (e.target.files) void ingest(e.target.files); e.target.value = ''; }}
          style={{ display: 'none' }}
        />
      </div>

      {(value.length > 0 || pending.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 12,
          }}
        >
          {value.map((url, i) => (
            <Thumbnail
              key={url}
              src={url}
              isCover={i === 0}
              canMoveLeft={i > 0}
              canMoveRight={i < value.length - 1}
              onMoveLeft={() => move(i, -1)}
              onMoveRight={() => move(i, 1)}
              onRemove={() => remove(i)}
            />
          ))}
          {pending.map(entry => (
            <PendingThumbnail key={entry.id} entry={entry} onDismiss={() => dismissError(entry.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Thumbnail({
  src, isCover, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight, onRemove,
}: {
  src: string;
  isCover: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${isCover ? 'var(--brand, var(--client-primary))' : 'var(--border-2)'}`,
        background: 'var(--bg-muted) center/cover',
        backgroundImage: `url(${src})`,
      }}
    >
      {isCover && (
        <span
          style={{
            position: 'absolute',
            top: 8, left: 8,
            background: 'var(--brand, var(--client-primary))',
            color: '#fff',
            fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 9999,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}
        >
          Cover
        </span>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 'auto 6px 6px 6px',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton
            icon="chevronLeft"
            title="Move left"
            size={26}
            disabled={!canMoveLeft}
            onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
          <IconButton
            icon="chevronRight"
            title="Move right"
            size={26}
            disabled={!canMoveRight}
            onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
        </div>
        <IconButton
          icon="trash"
          title="Remove"
          danger
          size={26}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ background: 'rgba(255,255,255,0.9)' }}
        />
      </div>
    </div>
  );
}

function PendingThumbnail({ entry, onDismiss }: { entry: UploadEntry; onDismiss: () => void }) {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${entry.status === 'error' ? 'var(--status-error)' : 'var(--border-2)'}`,
        background: 'var(--bg-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        textAlign: 'center',
      }}
    >
      {entry.status === 'uploading' && (
        <>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 8 }}>
            Uploading {Math.floor(entry.progress)}%
          </div>
          <div style={{ width: '80%', height: 4, background: '#fff', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${entry.progress}%`,
                height: '100%',
                background: 'var(--brand, var(--client-primary))',
                transition: 'width 200ms var(--ease-out)',
              }}
            />
          </div>
        </>
      )}
      {entry.status === 'error' && (
        <>
          <Icon name="alert" size={18} color="var(--status-error)" />
          <div style={{ fontSize: 11, color: 'var(--status-error)', marginTop: 4, lineHeight: 1.3 }}>
            {entry.errorMessage ?? 'Upload failed'}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              marginTop: 8,
              border: '1px solid var(--border-3)',
              background: '#fff',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
