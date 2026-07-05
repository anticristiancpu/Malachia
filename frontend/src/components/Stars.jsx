import React from 'react';

export default function Stars({ rating, onChange, max = 5 }) {
  return (
    <span className="m-stars">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`m-star${i < rating ? '' : ' empty'}`}
          style={{ cursor: onChange ? 'pointer' : 'default', fontSize: 16 }}
          onClick={() => onChange?.(i + 1)}
          title={`${i + 1} stelle`}
        >★</span>
      ))}
    </span>
  );
}
