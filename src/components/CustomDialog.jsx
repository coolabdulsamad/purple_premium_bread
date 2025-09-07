// components/CustomDialog.jsx
import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const CustomDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-container">
        <div className="dialog-header">
          <div className="dialog-icon">
            <FaExclamationTriangle />
          </div>
          <h3>{title}</h3>
          <button className="dialog-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;