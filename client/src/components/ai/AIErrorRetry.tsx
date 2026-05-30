import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";

interface AIErrorRetryProps {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}

export default function AIErrorRetry({ message, onRetry, disabled }: AIErrorRetryProps) {
  return (
    <div className="space-y-2">
      <p className="rounded-md border-2 border-border bg-danger-soft px-3 py-2 text-xs font-bold text-foreground">
        {message}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        disabled={disabled}
        className="h-8 text-xs"
      >
        <RotateCcw className="mr-1 h-3 w-3" />
        Retry
      </Button>
    </div>
  );
}
