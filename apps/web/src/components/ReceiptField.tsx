import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deleteReceipt, receiptUrl, uploadReceipt } from "../lib/receipts";

/**
 * Adjunta la foto de un recibo a un movimiento.
 *
 * Usa un input de archivo con `capture`, que en el telefono abre la camara
 * directamente y en el escritorio abre el explorador. Un plugin nativo habria
 * funcionado solo dentro del APK; esto sirve igual en la web, en el iPhone y en
 * la app, que son los tres sitios donde corre Rumbo.
 */
export function ReceiptField({
  userId,
  value,
  onChange
}: {
  userId: string;
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreview(null);
      return;
    }
    void receiptUrl(value).then((url) => {
      if (!cancelled) setPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    const path = await uploadReceipt(userId, file);
    setUploading(false);
    if (!path) {
      setError("No pudimos subir la foto. Intenta de nuevo.");
      return;
    }
    onChange(path);
  }

  async function clear() {
    if (value) await deleteReceipt(value);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="receipt-field">
      <span className="receipt-label">
        Foto del recibo <small>Opcional</small>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => void pick(event.target.files?.[0])}
      />

      {value ? (
        <div className="receipt-preview">
          {preview ? (
            <a href={preview} target="_blank" rel="noreferrer">
              <img src={preview} alt="Recibo adjunto" />
            </a>
          ) : (
            <span className="receipt-loading">Cargando...</span>
          )}
          <button type="button" className="table-action danger" onClick={() => void clear()}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="secondary receipt-button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="spin" /> Subiendo...
            </>
          ) : (
            <>
              <Camera size={16} /> Tomar o elegir foto
            </>
          )}
        </button>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
