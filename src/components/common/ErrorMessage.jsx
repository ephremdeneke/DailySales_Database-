import React from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-red-600">
      <AlertCircle size={28} className="mb-2" />
      <p className="text-sm mb-3">{message || "Error"}</p>
      {onRetry && <button onClick={onRetry} className="btn-secondary">Retry</button>}
    </div>
  );
}
