// src/components/Loader.jsx
import React from "react";

export default function Loader({ message }) {
  return (
    <div id="loading">
      <p>{message}</p>
      <div className="spinner"></div>
    </div>
  );
}
