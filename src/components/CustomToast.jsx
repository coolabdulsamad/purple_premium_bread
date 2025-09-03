// src/components/CustomToast.jsx
import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

export default function CustomToast({ id, type, message }) {
  return (
    <div className={`toast toast--${type}`}>
      <span className="toast__icon">{icons[type]}</span>
      <span className="toast__msg">{message}</span>
    </div>
  );
}