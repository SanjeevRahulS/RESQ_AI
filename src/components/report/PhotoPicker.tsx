import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_PHOTOS } from "@/lib/incidents/constants";
import { validatePhoto } from "@/lib/incidents/photos";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
}

export function PhotoPicker({ files, onChange, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const errors: string[] = [];
    const valid = incoming.filter((f) => {
      const err = validatePhoto(f);
      if (err) errors.push(err);
      return !err;
    });
    const room = MAX_PHOTOS - files.length;
    if (valid.length > room) errors.push(`You can attach up to ${MAX_PHOTOS} photos.`);
    onError(errors.length ? errors.join(" ") : null);
    onChange([...files, ...valid.slice(0, Math.max(0, room))]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {files.map((file, i) => (
          <figure key={`${file.name}-${i}`} className="relative size-24 overflow-hidden rounded-lg border bg-muted sm:size-28">
            <img src={previews[i]} alt={`Photo ${i + 1}: ${file.name}`} className="size-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-1 top-1 size-7 rounded-full border bg-background/90"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => {
                onError(null);
                onChange(files.filter((_, idx) => idx !== i));
              }}
              disabled={disabled}
            >
              <X aria-hidden className="size-4" />
            </Button>
          </figure>
        ))}
        {files.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50 sm:size-28"
          >
            <ImagePlus aria-hidden className="size-6" />
            Add photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        id="report-photos"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="Add photos"
        onChange={(e) => addFiles(e.target.files)}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        {files.length}/{MAX_PHOTOS} photos · JPG, PNG, WebP or HEIC, up to 8 MB each
      </p>
    </div>
  );
}
