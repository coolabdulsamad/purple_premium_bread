import React from 'react';
import '../../styles/dashboard.css'; // New stylesheet for dashboard

const MetricCard = ({ title, value, icon, color }) => {
  return (
    <div className="metric-card" style={{ '--card-color': color }}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-value">{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;