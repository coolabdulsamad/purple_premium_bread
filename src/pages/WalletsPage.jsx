// src/pages/WalletsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Form,
  FormControl,
  Card,
  Spinner,
  Badge,
  InputGroup,
} from "react-bootstrap";
import {
  FaWallet,
  FaUser,
  FaMotorcycle,
  FaPlusCircle,
  FaMinusCircle,
  FaHandHoldingUsd,
  FaHistory,
  FaInfoCircle,
  FaMoneyBillWave,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/styles/wallets.css";
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

const TXN_LABELS = {
  DEPOSIT: "Deposit",
  REFUND: "Refund",
  USAGE: "Used on Sales",
  RETURN_CREDIT: "Return Credit",
};

const WalletsPage = () => {
  /* ---------- owner selection ---------- */
  const [ownerType, setOwnerType] = useState("CUSTOMER");
  const [customers, setCustomers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [ownerId, setOwnerId] = useState("");

  /* ---------- wallet data ---------- */
  const [balance, setBalance] = useState(null); // null = loading, false = unavailable
  const [ownerName, setOwnerName] = useState("");
  const [history, setHistory] = useState([]);
  const [outstanding, setOutstanding] = useState(null); // { owner, outstanding_sales, total_outstanding }
  const [loading, setLoading] = useState(false);

  /* ---------- action forms ---------- */
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("cash");
  const [depositNotes, setDepositNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [refundNotes, setRefundNotes] = useState("");
  const [useAmount, setUseAmount] = useState("");
  const [useSaleId, setUseSaleId] = useState("");
  const [useNotes, setUseNotes] = useState("");
  const [submitting, setSubmitting] = useState("");

  /* ---------- load owner lists ---------- */
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
        /* lists stay empty */
      }
    };
    load();
  }, []);

  const owners = ownerType === "CUSTOMER" ? customers : riders;

  /* ---------- load wallet data for selected owner ---------- */
  const loadWallet = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setBalance(null);
    setHistory([]);
    setOutstanding(null);
    try {
      // Balance (503 -> feature unavailable)
      try {
        const b = await api.get(`/wallets/balance`, {
          params: { owner_type: ownerType, owner_id: ownerId },
        });
        setBalance(Number(b.data?.advance_balance || 0));
        setOwnerName(b.data?.owner_name || "");
      } catch (err) {
        if (err.response?.status === 503) {
          setBalance(false);
        } else {
          throw err;
        }
      }

      // Wallet history (only if wallet available)
      try {
        const h = await api.get(`/wallets/history`, {
          params: { owner_type: ownerType, owner_id: ownerId, limit: 100 },
        });
        setHistory(h.data || []);
      } catch {
        /* keep empty */
      }

      // Outstanding credit sales
      try {
        const o = await api.get(`/payments/outstanding`, {
          params:
            ownerType === "RIDER"
              ? { rider_id: ownerId }
              : { customer_id: ownerId },
        });
        setOutstanding(o.data);
      } catch {
        setOutstanding(null);
      }
    } catch (err) {
      toast(
        <CustomToast
          type="error"
          message={err.response?.data?.error || "Failed to load wallet."}
        />,
        { toastId: "wal-load-error" }
      );
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerId]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  /* ---------- actions ---------- */
  const doDeposit = async () => {
    const amount = Number(depositAmount);
    if (!(amount > 0)) {
      toast(<CustomToast type="warning" message="Enter a deposit amount." />, {
        toastId: "wal-warn",
      });
      return;
    }
    setSubmitting("deposit");
    try {
      const res = await api.post(`/wallets/deposit`, {
        owner_type: ownerType,
        owner_id: Number(ownerId),
        amount,
        payment_method: depositMethod,
        notes: depositNotes.trim() || null,
      });
      toast(
        <CustomToast
          type="success"
          message={`Deposit recorded — new balance ${formatNaira(
            res.data?.advance_balance
          )}.`}
        />,
        { toastId: "wal-dep-ok" }
      );
      setDepositAmount("");
      setDepositNotes("");
      await loadWallet();
    } catch (err) {
      toast(
        <CustomToast
          type="error"
          message={err.response?.data?.error || "Deposit failed."}
        />,
        { toastId: "wal-dep-fail" }
      );
    } finally {
      setSubmitting("");
    }
  };

  const doRefund = async () => {
    const amount = Number(refundAmount);
    if (!(amount > 0)) {
      toast(<CustomToast type="warning" message="Enter a refund amount." />, {
        toastId: "wal-warn",
      });
      return;
    }
    if (balance !== null && balance !== false && amount > balance + 0.004) {
      toast(
        <CustomToast
          type="error"
          message={`Wallet only has ${formatNaira(balance)}.`}
        />,
        { toastId: "wal-warn" }
      );
      return;
    }
    setSubmitting("refund");
    try {
      const res = await api.post(`/wallets/refund`, {
        owner_type: ownerType,
        owner_id: Number(ownerId),
        amount,
        payment_method: refundMethod,
        notes: refundNotes.trim() || null,
      });
      toast(
        <CustomToast
          type="success"
          message={`Refund paid — new balance ${formatNaira(
            res.data?.advance_balance
          )}.`}
        />,
        { toastId: "wal-ref-ok" }
      );
      setRefundAmount("");
      setRefundNotes("");
      await loadWallet();
    } catch (err) {
      toast(
        <CustomToast
          type="error"
          message={err.response?.data?.error || "Refund failed."}
        />,
        { toastId: "wal-ref-fail" }
      );
    } finally {
      setSubmitting("");
    }
  };

  const doUse = async () => {
    const amount = Number(useAmount);
    if (!(amount > 0)) {
      toast(<CustomToast type="warning" message="Enter an amount to apply." />, {
        toastId: "wal-warn",
      });
      return;
    }
    if (balance !== null && balance !== false && amount > balance + 0.004) {
      toast(
        <CustomToast
          type="error"
          message={`Wallet only has ${formatNaira(balance)}.`}
        />,
        { toastId: "wal-warn" }
      );
      return;
    }
    setSubmitting("use");
    try {
      const res = await api.post(`/wallets/use`, {
        owner_type: ownerType,
        owner_id: Number(ownerId),
        amount,
        sale_id: useSaleId ? Number(useSaleId) : undefined,
        notes: useNotes.trim() || null,
      });
      const d = res.data;
      toast(
        <CustomToast
          type="success"
          message={`${formatNaira(d?.amount_used)} applied across ${
            d?.allocations?.length || 0
          } sale(s) — new balance ${formatNaira(d?.advance_balance)}.`}
        />,
        { toastId: "wal-use-ok" }
      );
      setUseAmount("");
      setUseSaleId("");
      setUseNotes("");
      await loadWallet();
    } catch (err) {
      toast(
        <CustomToast
          type="error"
          message={err.response?.data?.error || "Failed to apply wallet balance."}
        />,
        { toastId: "wal-use-fail" }
      );
    } finally {
      setSubmitting("");
    }
  };

  const outstandingSales = outstanding?.outstanding_sales || [];

  /* ---------- render ---------- */
  return (
    <div className="ppb-wal">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="ppb-wal__header">
        <h2>
          <FaWallet className="ppb-wal__title-icon" /> Advance Wallets
        </h2>
        <p className="ppb-wal__subtitle">
          Customer and rider advance deposits — top up, refund, or spend the
          balance against their credit sales.
        </p>
      </div>

      {/* ===== Owner picker ===== */}
      <Card className="ppb-wal__card">
        <div className="ppb-wal__picker">
          <div className="ppb-wal__type-toggle">
            <button
              className={`ppb-wal__type-btn ${
                ownerType === "CUSTOMER" ? "ppb-wal__type-btn--active" : ""
              }`}
              onClick={() => {
                setOwnerType("CUSTOMER");
                setOwnerId("");
              }}
            >
              <FaUser /> Customer
            </button>
            <button
              className={`ppb-wal__type-btn ${
                ownerType === "RIDER" ? "ppb-wal__type-btn--active" : ""
              }`}
              onClick={() => {
                setOwnerType("RIDER");
                setOwnerId("");
              }}
            >
              <FaMotorcycle /> Rider
            </button>
          </div>
          <Form.Select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="ppb-wal__owner-select"
          >
            <option value="">
              Select {ownerType === "CUSTOMER" ? "a customer" : "a rider"}…
            </option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullname}
              </option>
            ))}
          </Form.Select>
        </div>

        {loading && (
          <div className="ppb-wal__loading">
            <Spinner animation="border" size="sm" /> Loading wallet…
          </div>
        )}

        {balance === false && !loading && (
          <div className="ppb-wal__notice">
            <FaInfoCircle /> Advance wallets unavailable — the wallet setup
            (migration 002) has not been applied yet. Balances show as ₦0.00.
          </div>
        )}
      </Card>

      {ownerId && !loading && (
        <>
          {/* ===== Balance + outstanding summary ===== */}
          <div className="ppb-wal__kpis">
            <Card className="ppb-wal__kpi ppb-wal__kpi--balance">
              <div className="ppb-wal__kpi-label">
                <FaWallet /> Advance Balance — {ownerName}
              </div>
              <div className="ppb-wal__kpi-value">
                {formatNaira(balance === false ? 0 : balance)}
              </div>
            </Card>
            <Card className="ppb-wal__kpi ppb-wal__kpi--debt">
              <div className="ppb-wal__kpi-label">
                <FaMoneyBillWave /> Outstanding Credit Debt
              </div>
              <div className="ppb-wal__kpi-value">
                {formatNaira(outstanding?.total_outstanding || 0)}
              </div>
              <div className="ppb-wal__kpi-sub">
                {outstandingSales.length} unpaid sale(s), oldest first
              </div>
            </Card>
          </div>

          {/* ===== Actions ===== */}
          {balance !== false && (
            <div className="ppb-wal__actions">
              {/* Deposit */}
              <Card className="ppb-wal__card ppb-wal__action">
                <div className="ppb-wal__card-head">
                  <FaPlusCircle className="ppb-wal__head-icon ppb-wal__head-icon--in" />
                  <span>Deposit (money in)</span>
                </div>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₦</InputGroup.Text>
                    <FormControl
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Received via</Form.Label>
                  <Form.Select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Notes</Form.Label>
                  <FormControl
                    type="text"
                    placeholder="Optional"
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                  />
                </Form.Group>
                <Button
                  className="ppb-wal__btn ppb-wal__btn--in"
                  onClick={doDeposit}
                  disabled={submitting !== ""}
                >
                  {submitting === "deposit" ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Record Deposit"
                  )}
                </Button>
              </Card>

              {/* Use balance */}
              <Card className="ppb-wal__card ppb-wal__action">
                <div className="ppb-wal__card-head">
                  <FaHandHoldingUsd className="ppb-wal__head-icon ppb-wal__head-icon--use" />
                  <span>Use Balance (clear credit sales)</span>
                </div>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₦</InputGroup.Text>
                    <FormControl
                      type="number"
                      min="0"
                      step="0.01"
                      value={useAmount}
                      onChange={(e) => setUseAmount(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Target sale</Form.Label>
                  <Form.Select
                    value={useSaleId}
                    onChange={(e) => setUseSaleId(e.target.value)}
                  >
                    <option value="">Auto — oldest first</option>
                    {outstandingSales.map((s) => (
                      <option key={s.id} value={s.id}>
                        Sale #{s.id} — {formatNaira(s.balance_due)} due (
                        {formatDate(s.sale_date)})
                      </option>
                    ))}
                  </Form.Select>
                  <small className="ppb-wal__hint">
                    Auto mode clears the oldest outstanding sales first.
                  </small>
                </Form.Group>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Notes</Form.Label>
                  <FormControl
                    type="text"
                    placeholder="Optional"
                    value={useNotes}
                    onChange={(e) => setUseNotes(e.target.value)}
                  />
                </Form.Group>
                <Button
                  className="ppb-wal__btn ppb-wal__btn--use"
                  onClick={doUse}
                  disabled={submitting !== "" || !(Number(balance) > 0)}
                >
                  {submitting === "use" ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Apply to Credit Sales"
                  )}
                </Button>
              </Card>

              {/* Refund */}
              <Card className="ppb-wal__card ppb-wal__action">
                <div className="ppb-wal__card-head">
                  <FaMinusCircle className="ppb-wal__head-icon ppb-wal__head-icon--out" />
                  <span>Refund (money out)</span>
                </div>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₦</InputGroup.Text>
                    <FormControl
                      type="number"
                      min="0"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Pay via</Form.Label>
                  <Form.Select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="ppb-wal__field">
                  <Form.Label>Notes</Form.Label>
                  <FormControl
                    type="text"
                    placeholder="Optional"
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                  />
                </Form.Group>
                <Button
                  className="ppb-wal__btn ppb-wal__btn--out"
                  onClick={doRefund}
                  disabled={submitting !== "" || !(Number(balance) > 0)}
                >
                  {submitting === "refund" ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Pay Refund"
                  )}
                </Button>
              </Card>
            </div>
          )}

          {/* ===== Outstanding sales ===== */}
          <Card className="ppb-wal__card">
            <div className="ppb-wal__card-head">
              <FaMoneyBillWave /> <span>Outstanding Credit Sales</span>
              <Badge bg="secondary" className="ppb-wal__count">
                {outstandingSales.length}
              </Badge>
            </div>
            <div className="ppb-wal__table-wrap">
              <table className="ppb-wal__table">
                <thead>
                  <tr>
                    <th>Sale #</th>
                    <th>Sale Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingSales.length === 0 && (
                    <tr>
                      <td colSpan="7" className="ppb-wal__empty">
                        No outstanding credit sales.
                      </td>
                    </tr>
                  )}
                  {outstandingSales.map((s) => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>{formatDate(s.sale_date)}</td>
                      <td>{formatDate(s.due_date)}</td>
                      <td>{formatNaira(s.total_amount)}</td>
                      <td>{formatNaira(s.amount_paid)}</td>
                      <td>
                        <b className="ppb-wal__neg">
                          {formatNaira(s.balance_due)}
                        </b>
                      </td>
                      <td>
                        <Badge bg="secondary">{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ===== Wallet history ===== */}
          <Card className="ppb-wal__card">
            <div className="ppb-wal__card-head">
              <FaHistory /> <span>Wallet History</span>
              <Badge bg="secondary" className="ppb-wal__count">
                {history.length}
              </Badge>
            </div>
            <div className="ppb-wal__table-wrap">
              <table className="ppb-wal__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Reference</th>
                    <th>Notes</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="7" className="ppb-wal__empty">
                        No wallet transactions yet.
                      </td>
                    </tr>
                  )}
                  {history.map((t) => {
                    const positive =
                      t.transaction_type === "DEPOSIT" ||
                      t.transaction_type === "RETURN_CREDIT";
                    return (
                      <tr key={t.id}>
                        <td>{formatDate(t.created_at)}</td>
                        <td>
                          <span
                            className={`ppb-wal__chip ${
                              positive
                                ? "ppb-wal__chip--in"
                                : "ppb-wal__chip--out"
                            }`}
                          >
                            {TXN_LABELS[t.transaction_type] ||
                              t.transaction_type}
                          </span>
                        </td>
                        <td>
                          <b
                            className={
                              positive ? "ppb-wal__pos" : "ppb-wal__neg"
                            }
                          >
                            {positive ? "+" : "−"}
                            {formatNaira(t.amount)}
                          </b>
                        </td>
                        <td>{formatNaira(t.balance_after)}</td>
                        <td>
                          {t.reference_type
                            ? `${t.reference_type}${
                                t.reference_id ? ` #${t.reference_id}` : ""
                              }`
                            : "—"}
                        </td>
                        <td>{t.notes || "—"}</td>
                        <td>{t.created_by_name || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default WalletsPage;
