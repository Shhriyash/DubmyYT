// ui.js
import React from "react";

// Reusable Button component
export function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 20px",
        backgroundColor: "#007BFF",
        color: "white",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// Reusable Input component
export function Input(props) {
  return (
    <input
      {...props}
      style={{
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        backgroundColor: "#333",
        color: "white",
      }}
    />
  );
}
