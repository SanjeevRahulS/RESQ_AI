import { ImageOff } from "lucide-react";

import { useSignedPhotoUrls } from "@/hooks/useSignedPhotoUrls";

export function PhotoGallery({ paths }: { paths: string[] }) {
  const { data, isLoading, isError } = useSignedPhotoUrls(paths);
  if (paths.length === 0) return <p className="text-sm text-muted-foreground">No photos attached.</p>;
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {paths.map((p) => (
          <div key={p} className="aspect-square animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }
  if (isError || !data?.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageOff aria-hidden className="size-4" /> Photos could not be loaded.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-2">
      {data.map((url, i) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border">
            <img src={url} alt={`Report photo ${i + 1}`} className="aspect-square w-full object-cover" loading="lazy" />
          </a>
        </li>
      ))}
    </ul>
  );
}
