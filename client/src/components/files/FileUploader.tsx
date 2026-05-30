import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "../../lib/utils";
import api, { getApiErrorMessage } from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FileUploaderProps {
  folderId: string | null;
  onClose: () => void;
}

const ACCEPTED_TYPES: Record<string, "pdf" | "docx" | "txt"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

function resolveFileType(file: File): "pdf" | "docx" | "txt" | null {
  const byMime = ACCEPTED_TYPES[file.type];
  if (byMime) return byMime;

  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

export default function FileUploader({ folderId, onClose }: FileUploaderProps) {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const uploadFile = useCallback(async (file: File) => {
    const type = resolveFileType(file);
    if (!type) {
      setError("Unsupported file type. Use PDF, DOCX, or TXT.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      setProgress("Uploading...");

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setProgress("Saving and extracting text...");
      await api.post("/upload/file", {
        name: file.name,
        type,
        dataUrl,
        size: file.size,
        folderId: folderId || null,
      });

      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File uploaded — text extraction runs in the background");
      onClose();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Upload failed");
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      setProgress("");
    }
  }, [folderId, queryClient, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="neo-box w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-file-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="upload-file-title" className="text-lg font-extrabold">Upload File</h3>
          <button onClick={onClose} className="rounded-md border-2 border-transparent p-1 hover:border-border hover:bg-accent" aria-label="Close upload dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-neoLg border-[3px] border-dashed p-8 text-center transition-colors",
            dragging ? "border-border bg-primary-soft" : "border-border bg-surface",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md border-2 border-border bg-accent shadow-neoSm">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mb-1 text-sm font-extrabold">
            {uploading ? progress : "Drag and drop a file here"}
          </p>
          {uploading && (
            <div className="mx-auto my-3 h-3 max-w-56 overflow-hidden rounded-full border-2 border-border bg-surface-muted">
              <div className="h-full w-2/3 animate-pulse bg-primary" />
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-3">or</p>
          <label className="inline-block cursor-pointer">
            <span className="inline-flex min-h-10 items-center rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-extrabold shadow-neoSm transition-transform hover:translate-x-0.5 hover:translate-y-0.5">Browse files</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-muted-foreground mt-3">PDF, DOCX, TXT — up to 20MB</p>
        </div>

        {error && (
          <p className="mt-3 rounded-md border-2 border-border bg-danger-soft px-3 py-2 text-sm font-bold text-foreground">{error}</p>
        )}
      </div>
    </div>
  );
}
