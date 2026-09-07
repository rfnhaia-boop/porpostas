'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy } from 'lucide-react';

// Renderiza o QR (a partir do payload BR Code) + botão "copia e cola".
export function PixQRCode({
  payload,
  size = 200,
  className = '',
}: {
  payload: string;
  size?: number;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(false);
    QRCode.toDataURL(payload, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [payload, size]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado — ignora */
    }
  };

  if (error) {
    return <p className={`text-xs text-red-500 ${className}`}>Não foi possível gerar o QR do PIX.</p>;
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="rounded-2xl bg-white p-3" style={{ width: size + 24, height: size + 24 }}>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR Code PIX" width={size} height={size} />
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-black/10" />
        )}
      </div>
      <button
        onClick={copy}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--foreground)] transition hover:bg-white/10"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copiado' : 'PIX copia e cola'}
      </button>
    </div>
  );
}
