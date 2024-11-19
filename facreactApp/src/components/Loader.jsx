// src/components/Loader.jsx
import React from "react";
import PropTypes from 'prop-types';

export default function Loader({ message }) {
  return (
    <div id="loading">
      <p>{message}</p>
      <div className="spinner"></div>
    </div>
  );
}

Loader.propTypes = {
  message: PropTypes.string,
};
