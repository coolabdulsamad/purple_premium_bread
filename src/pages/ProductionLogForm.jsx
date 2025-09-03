import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Form } from "react-bootstrap";
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast(<CustomToast type="error" message="Not authenticated. Please login." />);
      toast(<CustomToast id={`error-login-${Date.now()}`} type="error" message="Not authenticated. Please login." />, {
        toastId: 'login-error'
      });
      setSubmitting(false);
      return;
    }

    const payload = products
      .map((p) => ({
        productId: p.id,
        quantityProduced: productionCounts[p.id] || 0,
        wasteQuantity: wasteCounts[p.id] || 0,
      }))
      .filter((item) => item.quantityProduced > 0 || item.wasteQuantity > 0);

    if (payload.length === 0) {
      // toast(<CustomToast type="info" message="Enter at least one quantity to log." />);
      toast(<CustomToast id={`info-quantity-${Date.now()}`} type="info" message="Enter at least one quantity to log." />, {
        toastId: 'quantity-info'
      });
      setSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/production/log`,
        { productionData: payload, shift },
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
      <h2 className="plf-title">Log Today’s Production</h2>

      <Form onSubmit={handleSubmit} className="plf-form">
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
    </div>
  );
}

export default ProductionLogForm;
