import React from "react";

export default function FormInput({ label, error, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? "border-red-400" : ""}`} {...props} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
