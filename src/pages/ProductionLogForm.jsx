import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Form, Modal } from "react-bootstrap";
import {
  Package,
  Recycle,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast"; // ✅ same as SalesOutPage
import "../assets/styles/productionLogForm.css";

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.id;
    } catch {
      return null;
    }
  }
  return null;
};

function ProductionLogForm() {
  const [products, setProducts] = useState([]);
  const [productionCounts, setProductionCounts] = useState({});
  const [wasteCounts, setWasteCounts] = useState({});
  const [shift, setShift] = useState("Morning");
  const [productionDate, setProductionDate] = useState(() => new Date().toISOString().split("T")[0]); // manual production date, defaults to today
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // confirmation dialog before saving

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/products`);
        const list = Array.isArray(res.data) ? res.data : [];
        setProducts(list);

        const init = list.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
        setProductionCounts(init);
        setWasteCounts(init);
      } catch (err) {
        // toast(
        //   <CustomToast
        //     type="error"
        //     message="Failed to load products. Try again."
        //   />
        // );
        toast(<CustomToast id={`error-products-${Date.now()}`} type="error" message="Failed to load products. Try again." />, {
          toastId: 'products-error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleCountChange = (id, value, type) => {
    const num = Math.max(0, Number(value || 0));
    if (type === "production") {
      setProductionCounts((prev) => ({ ...prev, [id]: num }));
    } else {
      setWasteCounts((prev) => ({ ...prev, [id]: num }));
    }
  };

  // Build the list of products that actually have quantities entered
  const buildPayload = () =>
    products
      .map((p) => ({
        productId: p.id,
        name: p.name,
        quantityProduced: productionCounts[p.id] || 0,
        wasteQuantity: wasteCounts[p.id] || 0,
      }))
      .filter((item) => item.quantityProduced > 0 || item.wasteQuantity > 0);

  // Step 1: validate and open the confirmation dialog
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = buildPayload();
    if (payload.length === 0) {
      // toast(<CustomToast type="info" message="Enter at least one quantity to log." />);
      toast(<CustomToast id={`info-quantity-${Date.now()}`} type="info" message="Enter at least one quantity to log." />, {
        toastId: 'quantity-info'
      });
      return;
    }

    setShowConfirm(true);
  };

  // Step 2: user confirmed the details in the dialog — save to the server
  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast(<CustomToast id={`error-login-${Date.now()}`} type="error" message="Not authenticated. Please login." />, {
        toastId: 'login-error'
      });
      setSubmitting(false);
      return;
    }

    const payload = buildPayload().map(({ name, ...item }) => item);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/production/log`,
        { productionData: payload, shift, production_date: productionDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // toast(
      //   <CustomToast
      //     type="success"
      //     message={
      //       res?.data?.batchNumber
      //         ? `Production logged ✅ Batch: ${res.data.batchNumber}`
      //         : "Production logged successfully ✅"
      //     }
      //   />
      // );
      toast(<CustomToast id={`success-log-${Date.now()}`} type="success" message={
        res?.data?.batchNumber
          ? `Production logged ✅ Batch: ${res.data.batchNumber}`
          : "Production logged successfully ✅"
      } />, {
        toastId: 'log-success'
      });

      // reset
      const init = products.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      setProductionCounts(init);
      setWasteCounts(init);
      setShowConfirm(false);
    } catch (err) {
      const msg =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err.message;
      // toast(<CustomToast type="error" message={`Failed to log production. ${msg}`} />);
      toast(<CustomToast id={`error-log-${Date.now()}`} type="error" message={`Failed to log production. ${msg}`} />, {
        toastId: 'log-error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="plf-wrapper">
      <h2 className="plf-title">Log Production</h2>

      <Form onSubmit={handleSubmit} className="plf-form">
        <Form.Group className="plf-shift">
          <label>Production Date</label>
          <div className="plf-inputwrap">
            <CalendarDays size={18} />
            <Form.Control
              type="date"
              value={productionDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setProductionDate(e.target.value)}
              className="plf-input"
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="plf-shift">
          <label>Shift</label>
          <div className="plf-inputwrap">
            <CalendarDays size={18} />
            <Form.Select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="plf-input"
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </Form.Select>
          </div>
        </Form.Group>

        {products.length === 0 && !loading && (
          <p className="plf-empty">No products found. Please add products.</p>
        )}

        {products.map((product) => (
          <div key={product.id} className="plf-product">
            <img
              src={product.image_url || "https://placehold.co/120x120?text=No+Img"}
              alt={product.name}
              className="plf-image"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/120x120?text=Img";
              }}
            />

            <div className="plf-details">
              <h5>{product.name}</h5>
              <p className="plf-meta">Category: {product.category || "N/A"}</p>

              <div className="plf-grid">
                <div>
                  <label>Produced</label>
                  <div className="plf-inputwrap">
                    <Package size={16} />
                    <Form.Control
                      type="number"
                      min="0"
                      value={productionCounts[product.id] || 0}
                      onChange={(e) =>
                        handleCountChange(product.id, e.target.value, "production")
                      }
                      className="plf-input"
                    />
                  </div>
                </div>

                <div>
                  <label>Waste</label>
                  <div className="plf-inputwrap">
                    <Recycle size={16} />
                    <Form.Control
                      type="number"
                      min="0"
                      value={wasteCounts[product.id] || 0}
                      onChange={(e) =>
                        handleCountChange(product.id, e.target.value, "waste")
                      }
                      className="plf-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button type="submit" className="plf-btn--primary" disabled={submitting}>
          {submitting ? "Saving..." : "Log Production"}
        </button>
      </Form>

      {/* Confirmation dialog — review the full details before saving */}
      <Modal
        show={showConfirm}
        onHide={() => { if (!submitting) setShowConfirm(false); }}
        centered
      >
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>Confirm Production Log</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ color: "#374151", fontSize: 14 }}>
            Please check the full details below before saving.
          </p>
          <p style={{ fontSize: 14 }}>
            <b>Date:</b> {productionDate} &nbsp;·&nbsp; <b>Shift:</b> {shift}
          </p>
          <div style={{ borderTop: "1px solid #e5e7eb" }}>
            {buildPayload().map((item) => (
              <div
                key={item.productId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #f3f4f6",
                  fontSize: 14,
                }}
              >
                <span>{item.name}</span>
                <span>
                  Produced: <b>{item.quantityProduced}</b>
                  {" · "}
                  Waste: <b>{item.wasteQuantity}</b>
                </span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
            {buildPayload().length} product(s) will be logged.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="plf-btn--primary"
            style={{ background: "#6b7280" }}
            onClick={() => setShowConfirm(false)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="plf-btn--primary"
            onClick={handleConfirmSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Confirm & Save"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProductionLogForm;
