import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="neo-empty max-w-sm p-8 text-center">
        <h1 className="mb-2 font-heading text-5xl font-black">404</h1>
        <p className="mb-4 font-bold text-muted-foreground">Page not found</p>
        <Link to="/" className="inline-flex min-h-11 items-center rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-extrabold text-foreground shadow-neoSm">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
