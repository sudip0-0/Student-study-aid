import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FileUploaderProps {
  folderId: string | null;
  onClose: () => void;
}

const ACCEPTED_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

export default function FileUploader({ folderId, onClose }: FileUploaderProps) {
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const uploadFile = useCallback(async (file: File) => {
    const type = ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES];
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

      setProgress("Saving...");
      await api.post("/upload/file", {
        name: file.name,
        type,
        dataUrl,
        size: file.size,
        folderId: folderId || null,
      });

      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File uploaded");
      onClose();
    } catch (err: unknown) {
      const message = typeof err === "object" && err && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(message || "Upload failed");
      toast.error(message || "Upload failed");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card border rounded-lg p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload File</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            {uploading ? progress : "Drag and drop a file here"}
          </p>
          <p className="text-xs text-muted-foreground mb-3">or</p>
          <label className="inline-block cursor-pointer">
            <span className="text-sm text-primary hover:underline">Browse files</span>
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
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
