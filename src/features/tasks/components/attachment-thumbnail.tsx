import { useState, useEffect } from "react";
import { FileText, ImageIcon, Download, X, Eye, Upload } from "lucide-react";

export function getAttachmentFileName(url: string, index?: number): string {
  if (url.startsWith("data:image/")) return `Image ${(index ?? 0) + 1}`;
  if (url.startsWith("data:")) return `File ${(index ?? 0) + 1}`;

  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/\/o\/(.+)$/);
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const basename = storagePath.split("/").pop();
      if (basename) return basename;
    }
  } catch {
    // fall through
  }

  const segment = url.split("/").pop()?.split("?")[0] || `File ${(index ?? 0) + 1}`;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function isLikelyImageUrl(url: string): boolean {
  if (url.startsWith("data:image/")) return true;
  if (/\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|heic)(\?|#|$)/i.test(url)) return true;
  const name = getAttachmentFileName(url);
  if (/\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|heic)$/i.test(name)) return true;
  // Firebase download URLs — try rendering as image; onError falls back to icon
  if (url.includes("firebasestorage.googleapis.com") && url.includes("alt=media")) return true;
  return false;
}

interface AttachmentThumbnailProps {
  url: string;
  index?: number;
  onPreview: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function AttachmentThumbnail({ url, index, onPreview, onDelete }: AttachmentThumbnailProps) {
  const [imgError, setImgError] = useState(false);
  const fileName = getAttachmentFileName(url, index);
  const showCover = isLikelyImageUrl(url) && !imgError;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(e) => e.key === "Enter" && onPreview()}
      className="group relative rounded-xl border border-default-200/80 overflow-hidden bg-content1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-[4/3] bg-default-100 overflow-hidden">
        {showCover ? (
          <img
            src={url}
            alt={fileName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-default-100 to-default-50">
            <div className="p-3 rounded-xl bg-content1 shadow-sm border border-default-200/60">
              <FileText className="w-8 h-8 text-default-400" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-semibold text-default-400 uppercase tracking-wide">Document</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-foreground text-[11px] font-bold shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            View
          </span>
        </div>

        {showCover && (
          <span className="absolute top-2 left-2 p-1 rounded-md bg-black/40 text-white">
            <ImageIcon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <div className="px-3 py-2.5 border-t border-default-100 bg-content1">
        <p className="text-xs font-semibold text-foreground truncate" title={fileName}>
          {fileName}
        </p>
      </div>

      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-lg bg-content1/95 backdrop-blur-sm border border-default-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm"
          aria-label="Download"
        >
          <Download className="w-4 h-4" />
        </a>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="w-8 h-8 rounded-lg bg-content1/95 backdrop-blur-sm border border-default-200 flex items-center justify-center hover:bg-danger hover:text-white hover:border-danger transition-colors shadow-sm"
            aria-label="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PendingFileThumbnail({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImgError(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const showCover = isImage && previewUrl && !imgError;

  return (
    <div className="group relative rounded-xl border border-dashed border-primary/30 overflow-hidden bg-primary-50/20 hover:border-primary/50 transition-colors">
      <div className="relative aspect-[4/3] bg-default-100 overflow-hidden">
        {showCover ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-default-100 to-default-50 p-3">
            <FileText className="w-8 h-8 text-default-400" strokeWidth={1.5} />
            <span className="text-[10px] font-semibold text-default-500 uppercase">Pending</span>
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold">
          New
        </span>
      </div>
      <div className="px-3 py-2 border-t border-primary/20 bg-content1/90">
        <p className="text-xs font-semibold text-foreground truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-default-400">{(file.size / 1024).toFixed(1)} KB</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-content1/95 border border-default-200 flex items-center justify-center hover:bg-danger hover:text-white hover:border-danger transition-colors shadow-sm"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface AttachmentUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  fileCount?: number;
}

export function AttachmentUploadZone({
  onFilesSelected,
  disabled,
  fileCount = 0,
}: AttachmentUploadZoneProps) {
  const inputId = "task-attachment-input";

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    onFilesSelected(Array.from(fileList));
  };

  return (
    <label
      htmlFor={inputId}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-4 transition-all cursor-pointer ${
        disabled
          ? "opacity-50 pointer-events-none border-default-200"
          : "border-default-200 hover:border-primary/50 hover:bg-primary-50/30"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="p-3 rounded-full bg-primary/10 text-primary">
        <Upload className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-foreground">Click or drag files to upload</p>
      <p className="text-xs text-default-400">Optional — images, PDFs, and documents</p>
      {fileCount > 0 && (
        <p className="text-xs font-bold text-primary mt-1">{fileCount} file{fileCount !== 1 ? "s" : ""} selected</p>
      )}
    </label>
  );
}
