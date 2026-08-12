// src/pages/ReturnsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Form,
  FormControl,
  Card,
  Spinner,
  Badge,
  InputGroup,
  FormCheck,
} from "react-bootstrap";
import {
  FaUndo,
  FaSearch,
  FaBoxOpen,
  FaUser,
  FaMotorcycle,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaInfoCircle,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/styles/returns.css";
import CustomToast from "../components/CustomToast";
import api from "../api/axiosInstance";

const formatNaira = (n) =>
  `₦${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const REFUND_METHODS = [
  { key: "credit_balance", label: "Credit Balance → then Advance Wallet" },
  { key: "advance", label: "Advance Wallet" },
  { key: "cash", label: "Cash Refund (money out)" },
  { key: "bank", label: "Bank Refund (money out)" },
];

const ReturnsPage = () => {
  /* ---------- lookup state ---------- */
  const [saleIdInput, setSaleIdInput] = useState("");
  const [saleData, setSaleData] = useState(null); // { sale, items, returns }
  const [saleLoading, setSaleLoading] = useState(false);

  /* ---------- return form state ---------- */
  const [returnQtys, setReturnQtys] = useState({});
  const [restockFlags, setRestockFlags] = useState({});
  const [refundMethod, setRefundMethod] = useState("credit_balance");
  const [reason, setReason] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [processing, setProcessing] = useState(false);

  /* ---------- history state ---------- */
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [filterRiderId, setFilterRiderId] = useState("");
  const [filterSaleId, setFilterSaleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [schemaError, setSchemaError] = useState(null);

  /* ---------- dropdown data ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        const [c, r] = await Promise.all([
          api.get(`/customers`),
          api.get(`/riders?status=active`),
        ]);
        setCustomers(c.data || []);
        setRiders(r.data?.riders || []);
      } catch {
        /* dropdowns stay empty; filters still usable by ID */
      }
    };
    load();
  }, []);

  /* ---------- load a sale's returnable items ---------- */
  const loadSale = useCallback(async (id) => {
    if (!id) return;
    setSaleLoading(true);
    setSaleData(null);
    try {
      const res = await api.get(`/returns/sale/${id}`);
      setSaleData(res.data);
      setSchemaError(null);
      const qtys = {};
      const flags = {};
      (res.data.items || []).forEach((it) => {
        qtys[it.product_id] = "";
        flags[it.product_id] = true;
      });
      setReturnQtys(qtys);
      setRestockFlags(flags);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || "Failed to load sale.";
      if (status === 503) {
        setSchemaError(msg);
      } else {
        toast(<CustomToast type="error" message={msg} />, {
          toastId: "ret-load-error",
        });
      }
    } finally {
      setSaleLoading(false);
    }
  }, []);

  /* ---------- load return history ---------- */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (filterSaleId) params.sale_id = filterSaleId;
      if (filterCustomerId) params.customer_id = filterCustomerId;
      if (filterRiderId) params.rider_id = filterRiderId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get(`/returns`, { params });
      setHistory(res.data || []);
      setSchemaError(null);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || "Failed to load return history.";
      if (status === 503) {
        setSchemaError(msg);
      } else {
        toast(<CustomToast type="error" message={msg} />, {
          toastId: "ret-hist-error",
        });
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [filterSaleId, filterCustomerId, filterRiderId, startDate, endDate]);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- process the return ---------- */
  const selectedItems = saleData
    ? saleData.items
        .map((it) => ({
          product_id: it.product_id,
          name: it.product_name,
          quantity: Number(returnQtys[it.product_id]) || 0,
          returnable: it.returnable_quantity,
          unit_price: it.unit_price,
          restock: restockFlags[it.product_id] !== false,
        }))
        .filter((it) => it.quantity > 0)
    : [];

  const returnTotal = selectedItems.reduce(
    (sum, it) => sum + it.quantity * it.unit_price,
    0
  );

  const processReturn = async () => {
    if (!saleData) return;
    if (selectedItems.length === 0) {
      toast(
        <CustomToast
          type="warning"
          message="Enter a return quantity for at least one product."
        />,
        { toastId: "ret-warn" }
      );
      return;
    }
    const over = selectedItems.find((it) => it.quantity > it.returnable);
    if (over) {
      toast(
        <CustomToast
          type="error"
          message={`${over.name}: cannot return more than ${over.returnable}.`}
        />,
        { toastId: "ret-over" }
      );
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        sale_id: saleData.sale.id,
        items: selectedItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          restock: it.restock,
        })),
        refund_method: refundMethod,
        reason: reason.trim() || null,
        return_date: returnDate || null,
      };
      const res = await api.post(`/returns`, payload);
      const s = res.data?.settlement;
      const parts = [];
      if (s?.credit_applied > 0)
        parts.push(`${formatNaira(s.credit_applied)} cleared credit`);
      if (s?.wallet_credited > 0)
        parts.push(`${formatNaira(s.wallet_credited)} to advance wallet`);
      if (s?.cash_refunded > 0)
        parts.push(`${formatNaira(s.cash_refunded)} refunded`);
      toast(
        <CustomToast
          type="success"
          message={`Return processed — ${parts.join(", ") || "settled"}.`}
        />,
        { toastId: "ret-success" }
      );
      setReason("");
      await loadSale(saleData.sale.id);
      await loadHistory();
    } catch (err) {
      toast(
        <CustomToast
          type="error"
          message={err.response?.data?.error || "Failed to process return."}
        />,
        { toastId: "ret-fail" }
      );
    } finally {
      setProcessing(false);
    }
  };

  const refundLabel = (m) =>
    REFUND_METHODS.find((r) => r.key === m)?.label || m;

  /* ---------- render ---------- */
  return (
    <div className="ppb-ret">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="ppb-ret__header">
        <h2>
          <FaUndo className="ppb-ret__title-icon" /> Sales Returns
        </h2>
        <p className="ppb-ret__subtitle">
          Return any quantity from a sale — stock is restored automatically and
          the value settles against credit, advance wallet, or a cash/bank
          refund.
        </p>
      </div>

      {schemaError && (
        <div className="ppb-ret__notice">
          <FaInfoCircle /> {schemaError}
        </div>
      )}

      {/* ===== Sale lookup ===== */}
      <Card className="ppb-ret__card">
        <div className="ppb-ret__card-head">
          <FaSearch /> <span>Find Sale</span>
        </div>
        <div className="ppb-ret__lookup">
          <InputGroup>
            <InputGroup.Text>Sale #</InputGroup.Text>
            <FormControl
              type="number"
              min="1"
              placeholder="Enter sale ID…"
              value={saleIdInput}
              onChange={(e) => setSaleIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadSale(saleIdInput);
              }}
            />
            <Button
              className="ppb-ret__btn"
              onClick={() => loadSale(saleIdInput)}
              disabled={!saleIdInput || saleLoading}
            >
              {saleLoading ? <Spinner size="sm" animation="border" /> : "Load"}
            </Button>
          </InputGroup>
        </div>

        {saleData && (
          <div className="ppb-ret__sale">
            <div className="ppb-ret__sale-meta">
              <div className="ppb-ret__meta-item">
                <span>Sale</span>
                <b>#{saleData.sale.id}</b>
              </div>
              <div className="ppb-ret__meta-item">
                <span>Date</span>
                <b>{formatDate(saleData.sale.sale_date)}</b>
              </div>
              <div className="ppb-ret__meta-item">
                <span>{saleData.sale.is_rider_sale ? "Rider" : "Customer"}</span>
                <b>
                  {saleData.sale.is_rider_sale ? (
                    <>
                      <FaMotorcycle />{" "}
                      {saleData.sale.rider_name || `#${saleData.sale.rider_id}`}
                    </>
                  ) : (
                    <>
                      <FaUser />{" "}
                      {saleData.sale.customer_name ||
                        (saleData.sale.customer_id
                          ? `#${saleData.sale.customer_id}`
                          : "Walk-in")}
                    </>
                  )}
                </b>
              </div>
              <div className="ppb-ret__meta-item">
                <span>Total</span>
                <b>{formatNaira(saleData.sale.total_amount)}</b>
              </div>
              <div className="ppb-ret__meta-item">
                <span>Paid</span>
                <b>{formatNaira(saleData.sale.amount_paid)}</b>
              </div>
              <div className="ppb-ret__meta-item">
                <span>Balance Due</span>
                <b
                  className={
                    Number(saleData.sale.balance_due) > 0
                      ? "ppb-ret__neg"
                      : "ppb-ret__pos"
                  }
                >
                  {formatNaira(saleData.sale.balance_due)}
                </b>
              </div>
              <div className="ppb-ret__meta-item">
                <span>Status</span>
                <Badge bg="secondary">{saleData.sale.status}</Badge>
              </div>
            </div>

            {/* items table */}
            <div className="ppb-ret__table-wrap">
              <table className="ppb-ret__table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Returned</th>
                    <th>Returnable</th>
                    <th>Unit Price</th>
                    <th>Return Qty</th>
                    <th>Restock</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.items.map((it) => {
                    const qty = Number(returnQtys[it.product_id]) || 0;
                    const disabled = it.returnable_quantity <= 0;
                    return (
                      <tr
                        key={it.product_id}
                        className={disabled ? "ppb-ret__row--done" : ""}
                      >
                        <td>
                          <FaBoxOpen className="ppb-ret__prod-icon" />{" "}
                          {it.product_name}
                        </td>
                        <td>{it.sold_quantity}</td>
                        <td>{it.returned_quantity}</td>
                        <td>
                          <b>{it.returnable_quantity}</b>
                        </td>
                        <td>{formatNaira(it.unit_price)}</td>
                        <td>
                          <FormControl
                            type="number"
                            min="0"
                            max={it.returnable_quantity}
                            step="1"
                            size="sm"
                            placeholder="0"
                            disabled={disabled}
                            value={returnQtys[it.product_id] ?? ""}
                            onChange={(e) =>
                              setReturnQtys((prev) => ({
                                ...prev,
                                [it.product_id]: e.target.value,
                              }))
                            }
                            className="ppb-ret__qty"
                          />
                        </td>
                        <td>
                          <FormCheck
                            disabled={disabled}
                            checked={restockFlags[it.product_id] !== false}
                            onChange={(e) =>
                              setRestockFlags((prev) => ({
                                ...prev,
                                [it.product_id]: e.target.checked,
                              }))
                            }
                          />
                        </td>
                        <td>
                          {qty > 0 ? (
                            <b>{formatNaira(qty * it.unit_price)}</b>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* settlement options */}
            <div className="ppb-ret__settle">
              <Form.Group className="ppb-ret__field">
                <Form.Label>Settlement Method</Form.Label>
                <Form.Select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                >
                  {REFUND_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </Form.Select>
                <small className="ppb-ret__hint">
                  Outstanding credit on this sale is always cleared first; the
                  remainder follows the chosen method.
                </small>
              </Form.Group>
              <Form.Group className="ppb-ret__field">
                <Form.Label>Return Date</Form.Label>
                <FormControl
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="ppb-ret__field ppb-ret__field--wide">
                <Form.Label>Reason (optional)</Form.Label>
                <FormControl
                  type="text"
                  placeholder="e.g., damaged bread, wrong order…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Form.Group>
            </div>

            <div className="ppb-ret__submit-row">
              <div className="ppb-ret__return-total">
                Return value: <b>{formatNaira(returnTotal)}</b>
              </div>
              <Button
                className="ppb-ret__btn ppb-ret__btn--primary"
                disabled={processing || selectedItems.length === 0}
                onClick={processReturn}
              >
                {processing ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  <>
                    <FaUndo /> Process Return
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ===== Return history ===== */}
      <Card className="ppb-ret__card">
        <div className="ppb-ret__card-head">
          <FaHistory /> <span>Return History</span>
          <Badge bg="secondary" className="ppb-ret__count">
            {history.length}
          </Badge>
        </div>

        <div className="ppb-ret__filters">
          <div className="ppb-ret__filter">
            <label>
              <FaFilter /> Customer
            </label>
            <Form.Select
              size="sm"
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
            >
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullname}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="ppb-ret__filter">
            <label>
              <FaFilter /> Rider
            </label>
            <Form.Select
              size="sm"
              value={filterRiderId}
              onChange={(e) => setFilterRiderId(e.target.value)}
            >
              <option value="">All riders</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullname}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="ppb-ret__filter">
            <label>Sale #</label>
            <FormControl
              size="sm"
              type="number"
              min="1"
              placeholder="Any"
              value={filterSaleId}
              onChange={(e) => setFilterSaleId(e.target.value)}
            />
          </div>
          <div className="ppb-ret__filter">
            <label>From</label>
            <FormControl
              size="sm"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="ppb-ret__filter">
            <label>To</label>
            <FormControl
              size="sm"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="ppb-ret__btn"
            onClick={loadHistory}
            disabled={historyLoading}
          >
            {historyLoading ? <Spinner size="sm" animation="border" /> : "Apply"}
          </Button>
        </div>

        <div className="ppb-ret__table-wrap">
          <table className="ppb-ret__table">
            <thead>
              <tr>
                <th></th>
                <th>Return #</th>
                <th>Date</th>
                <th>Sale #</th>
                <th>Customer / Rider</th>
                <th>Total</th>
                <th>Settlement</th>
                <th>Processed By</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && !historyLoading && (
                <tr>
                  <td colSpan="8" className="ppb-ret__empty">
                    No returns recorded yet.
                  </td>
                </tr>
              )}
              {history.map((ret) => {
                const expanded = expandedId === ret.id;
                return (
                  <React.Fragment key={ret.id}>
                    <tr
                      className="ppb-ret__hist-row"
                      onClick={() =>
                        setExpandedId(expanded ? null : ret.id)
                      }
                    >
                      <td>
                        {expanded ? <FaChevronUp /> : <FaChevronDown />}
                      </td>
                      <td>#{ret.id}</td>
                      <td>{formatDate(ret.return_date)}</td>
                      <td>
                        <button
                          className="ppb-ret__link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSaleIdInput(String(ret.sale_id));
                            loadSale(ret.sale_id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          #{ret.sale_id}
                        </button>
                      </td>
                      <td>
                        {ret.rider_name ? (
                          <>
                            <FaMotorcycle /> {ret.rider_name}
                          </>
                        ) : (
                          <>
                            <FaUser /> {ret.customer_name || "—"}
                          </>
                        )}
                      </td>
                      <td>
                        <b>{formatNaira(ret.total_amount)}</b>
                      </td>
                      <td className="ppb-ret__settle-cell">
                        {Number(ret.credit_applied) > 0 && (
                          <span className="ppb-ret__chip ppb-ret__chip--credit">
                            Credit {formatNaira(ret.credit_applied)}
                          </span>
                        )}
                        {Number(ret.wallet_credited) > 0 && (
                          <span className="ppb-ret__chip ppb-ret__chip--wallet">
                            Wallet {formatNaira(ret.wallet_credited)}
                          </span>
                        )}
                        {Number(ret.cash_refunded) > 0 && (
                          <span className="ppb-ret__chip ppb-ret__chip--cash">
                            Refunded {formatNaira(ret.cash_refunded)}
                          </span>
                        )}
                        <span className="ppb-ret__method">
                          {refundLabel(ret.refund_method)}
                        </span>
                      </td>
                      <td>{ret.processed_by_name || "—"}</td>
                    </tr>
                    {expanded && (
                      <tr className="ppb-ret__detail-row">
                        <td colSpan="8">
                          <div className="ppb-ret__detail">
                            {ret.reason && (
                              <div className="ppb-ret__detail-reason">
                                <b>Reason:</b> {ret.reason}
                              </div>
                            )}
                            <table className="ppb-ret__table ppb-ret__table--inner">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Qty</th>
                                  <th>Unit Price</th>
                                  <th>Amount</th>
                                  <th>Restocked</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(ret.items || []).map((it, i) => (
                                  <tr key={i}>
                                    <td>{it.product_name}</td>
                                    <td>{it.quantity}</td>
                                    <td>{formatNaira(it.unit_price)}</td>
                                    <td>{formatNaira(it.amount)}</td>
                                    <td>{it.restocked ? "Yes" : "No"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReturnsPage;
