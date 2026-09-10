"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  accept,
  label = "Click or drag a file here",
  hint,
  onFile,
  disabled,
}: {
  accept?: string;
  label?: string;
  hint?: string;
  onFile: (file: File) => Promise<void> | void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handle = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      setBusy(true);
      setError("");
      try {
        await onFile(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [onFile, disabled]
  );

  return (
    <div>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-blue-500 bg-blue-50" : "border-stone-200 bg-stone-50 hover:border-blue-300",
          (disabled || busy) && "opacity-60"
        )}
      >
        <Upload className="h-8 w-8 text-blue-700" />
        <span className="text-sm font-medium text-stone-800">
          {busy ? "Uploading…" : label}
        </span>
        {hint && <span className="text-xs text-stone-500">{hint}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
