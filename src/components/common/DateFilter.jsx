import React from "react";

export default function DateFilter({ value, onChange }) {
  return (
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="input w-auto" />
  );
}
