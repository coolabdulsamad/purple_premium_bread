// src/pages/NewSalePage.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaTrashAlt,
  FaSearch,
  FaFilter,
  FaTags,
  FaMoneyBillWave,
  FaCreditCard,
  FaUniversity,
  FaCalendarAlt,
  FaUser,
  FaFileUpload,
  FaCartPlus,
  FaBoxOpen,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import {
  Button,
  Form,
  FormControl,
  Card,
  Spinner,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/styles/newSale.css";

const API_BASE_URL = "http://localhost:5000/api";

/* ========= Helpers ========= */
const getCashierIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id;
  } catch {
    return null;
  }
};

const formatNaira = (n) =>
  `₦${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* ========= Main Component ========= */
const NewSalePage = () => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState({});
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [carts, setCarts] = useState([
    {
      id: 1,
      name: "Group 1",
      items: [],
      payment: {
        paymentMethod: "Cash",
        paymentReference: "",
        paymentImage: null,
        customer: null,
        amountPaid: 0,
        dueDate: "",
      },
      total: 0,
      discount: 0,
      note: "",
    },
  ]);
  const [activeCartId, setActiveCartId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  const activeCart = carts.find((c) => c.id === activeCartId);

  /* ========= Data Fetch ========= */
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, inventoryRes, customersRes, servicesRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/products`),
          axios.get(`${API_BASE_URL}/inventory`),
          axios.get(`${API_BASE_URL}/customers`),
          axios.get(`${API_BASE_URL}/services`),
        ]);

      setProducts(productsRes.data.filter((p) => p.is_active));
      setCustomers(customersRes.data);
      setServices(servicesRes.data);

      const inventoryMap = inventoryRes.data.reduce((map, item) => {
        map[item.product_id] = item.quantity;
        return map;
      }, {});
      setInventory(inventoryMap);
    } catch {
      toast.error("Failed to load POS data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  /* ========= Totals ========= */
  const getTotals = (cart) => {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
    const discountService = services.find((s) => s.id === cart.discount);
    const discountAmount = discountService
      ? subtotal * (Number(discountService.rate) / 100)
      : 0;

    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxService = services.find((s) => s.name?.toLowerCase() === "tax");
    const taxRate = taxService ? Number(taxService.rate) / 100 : 0.08;
    const tax = subtotalAfterDiscount * taxRate;
    const total = subtotalAfterDiscount + tax;

    return { subtotal, tax, total, discountAmount };
  };

  // Auto-calc totals when items, discount, or services change
  useEffect(() => {
    setCarts((prev) =>
      prev.map((cart) => {
        const { subtotal, tax, total, discountAmount } = getTotals(cart);
        return { ...cart, subtotal, tax, total, discountAmount };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(
      carts.map((c) => ({ id: c.id, items: c.items, discount: c.discount }))
    ),
    JSON.stringify(services),
  ]);

  /* ========= Filters ========= */
  const categories = useMemo(() => {
    const set = new Set(["All"]);
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQ =
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      const matchesCat = category === "All" || p.category === category;
      return matchesQ && matchesCat;
    });
  }, [products, searchTerm, category]);

  /* ========= Cart Ops ========= */
  const addToCart = (product, cartId) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        const existing = cart.items.find((i) => i.id === product.id);
        const stock = inventory[product.id] || 0;

        if (existing) {
          if (existing.quantity + 1 > stock) {
            toast.warn("Inventory limit reached.");
            return cart;
          }
          toast.success(`${product.name} +1`);
          return {
            ...cart,
            items: cart.items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        } else {
          if (stock <= 0) {
            toast.error("Out of stock.");
            return cart;
          }
          toast.success(`${product.name} added to cart`);
          return {
            ...cart,
            items: [
              ...cart.items,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
              },
            ],
          };
        }
      })
    );
  };

  const updateCartItem = (cartId, itemId, nextQty) => {
    const productStock = inventory[itemId] || 0;
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        const items = cart.items
          .map((i) => {
            if (i.id !== itemId) return i;
            const qty = Math.max(0, Number(nextQty) || 0);
            if (qty > productStock) {
              toast.warn("Inventory limit reached.");
              return i;
            }
            return { ...i, quantity: qty };
          })
          .filter((i) => i.quantity > 0);
        return { ...cart, items };
      })
    );
  };

  const addCart = () => {
    const nextId = carts.length
      ? Math.max(...carts.map((c) => c.id)) + 1
      : 1;
    const groupName = `Group ${nextId}`;
    setCarts((prev) => [
      ...prev,
      {
        id: nextId,
        name: groupName,
        items: [],
        payment: {
          paymentMethod: "Cash",
          paymentReference: "",
          paymentImage: null,
          customer: null,
          amountPaid: 0,
          dueDate: "",
        },
        total: 0,
        discount: 0,
        note: "",
      },
    ]);
    setActiveCartId(nextId);
    toast.info(`${groupName} created`);
  };

  const removeCart = (cartId) => {
    if (carts.length === 1) {
      toast.warn("At least one group is required.");
      return;
    }
    const removed =
      carts.find((c) => c.id === cartId)?.name || `Group ${cartId}`;
    const next = carts.filter((c) => c.id !== cartId);
    setCarts(next);
    if (!next.find((c) => c.id === activeCartId) && next.length) {
      setActiveCartId(next[0].id);
    }
    toast.success(`${removed} removed`);
  };

  /* ========= Checkout ========= */
  const handleCheckout = async (cartToProcess) => {
    if (!cartToProcess || cartToProcess.items.length === 0) {
      toast.warn("Cart is empty.");
      return;
    }

    const cashierId = getCashierIdFromToken();
    if (!cashierId) {
      toast.error("You must be logged in to process a sale.");
      return;
    }

    // Upload receipt image if provided
    let paymentImageUrl = null;
    if (cartToProcess.payment.paymentImage) {
      try {
        const fd = new FormData();
        fd.append("receiptImage", cartToProcess.payment.paymentImage);
        const upload = await axios.post(
          `${API_BASE_URL}/sales/upload-receipt`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        paymentImageUrl = upload.data.url;
      } catch {
        toast.error("Failed to upload receipt image.");
        return;
      }
    }

    const { subtotal, tax, total, discountAmount } = getTotals(cartToProcess);
    let amountPaid = 0;
    let balanceDue = 0;
    let status = "Paid";
    let dueDate = null;
    let customerId = null;

    if (cartToProcess.payment.paymentMethod === "Credit") {
      if (!cartToProcess.payment.customer) {
        toast.error("Select a customer for credit sales.");
        return;
      }
      customerId = cartToProcess.payment.customer.id;
      amountPaid = Number(cartToProcess.payment.amountPaid || 0);
      balanceDue = total - amountPaid;

      // credit limit check
      const remainingLimit =
        Number(cartToProcess.payment.customer.credit_limit || 0) -
        Number(cartToProcess.payment.customer.balance || 0);
      if (balanceDue > remainingLimit && amountPaid < total) {
        toast.error("Exceeds customer remaining credit limit.");
        return;
      }

      if (balanceDue > 0 && balanceDue < total) status = "Partially Paid";
      if (balanceDue === total) status = "Unpaid";
      if (balanceDue <= 0) {
        status = "Paid";
        balanceDue = 0;
      }

      dueDate = cartToProcess.payment.dueDate || null;
      if (!dueDate && balanceDue > 0) {
        toast.warn("Choose a due date for outstanding balance.");
        return;
      }
    } else {
      amountPaid = total;
      balanceDue = 0;
      status = "Paid";
    }

    const payload = {
      cart: cartToProcess.items,
      subtotal,
      tax,
      total,
      discountAmount,
      cashierId,
      paymentMethod: cartToProcess.payment.paymentMethod,
      customerId,
      note: cartToProcess.note,
      paymentReference: cartToProcess.payment.paymentReference,
      paymentImageUrl,
      status,
      amountPaid,
      balanceDue,
      dueDate,
    };

    try {
      await axios.post(`${API_BASE_URL}/sales/process`, payload);
      toast.success("Sale completed successfully.");

      // remove processed cart
      const remaining = carts.filter((c) => c.id !== cartToProcess.id);
      if (remaining.length === 0) addCart();
      else {
        setCarts(remaining);
        setActiveCartId(remaining[0].id);
      }
      fetchAllData();
    } catch {
      toast.error("Failed to process sale.");
    }
  };

  /* ========= Discount Options ========= */
  const discountOptions = useMemo(
    () => services.filter((s) => s.name?.toLowerCase() !== "tax"),
    [services]
  );

  if (loading)
    return (
      <div className="ppb-center">
        <Spinner animation="border" />
      </div>
    );

  /* ========= Render ========= */
  return (
    <div className="ppb-sale">
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar />

      {/* LEFT: Cart / Groups */}
      <aside className="ppb-cart">
        <Card className="ppb-panel ppb-sticky">
          <div className="ppb-panel__header">
            <div className="ppb-title">
              <FaShoppingCart />
              <span>Sales Groups</span>
              <Badge bg="secondary" className="ppb-count">
                {carts.length}
              </Badge>
            </div>
            <Button className="group-add" size="sm" onClick={addCart}>
              + Add Group
            </Button>
          </div>

          {/* group tabs */}
          <div className="ppb-groups">
            {carts.map((cart) => (
              <button
                key={cart.id}
                className={`ppb-group ${
                  cart.id === activeCartId ? "ppb-group--active" : ""
                }`}
                onClick={() => setActiveCartId(cart.id)}
              >
                <span>{cart.name}</span>
                <span className="ppb-group__total">
                  {formatNaira(cart.total)}
                </span>
                <FaTrashAlt
                  className="ppb-group__remove"
                  title="Remove group"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCart(cart.id);
                  }}
                />
              </button>
            ))}
          </div>

          {/* active cart content */}
          {activeCart && (
            <>
              {/* items list */}
              <div className="ppb-items">
                {activeCart.items.length ? (
                  activeCart.items.map((it) => (
                    <div className="ppb-item" key={it.id}>
                      <div className="ppb-item__main">
                        <div className="ppb-item__name">{it.name}</div>
                        <div className="ppb-item__price">
                          {formatNaira(it.price)}
                        </div>
                      </div>

                      <div className="ppb-item__controls">
                        <div className="ppb-stepper">
                          <button
                            className="ppb-stepper__btn"
                            onClick={() =>
                              updateCartItem(
                                activeCart.id,
                                it.id,
                                it.quantity - 1
                              )
                            }
                          >
                            <FaMinus />
                          </button>
                          <input
                            className="ppb-stepper__input"
                            type="number"
                            min="1"
                            max={inventory[it.id] || 0}
                            value={it.quantity}
                            onChange={(e) =>
                              updateCartItem(
                                activeCart.id,
                                it.id,
                                parseInt(e.target.value || "0", 10)
                              )
                            }
                          />
                          <button
                            className="ppb-stepper__btn"
                            onClick={() =>
                              updateCartItem(
                                activeCart.id,
                                it.id,
                                it.quantity + 1
                              )
                            }
                          >
                            <FaPlus />
                          </button>
                        </div>

                        <div className="ppb-line">
                          {formatNaira(
                            Number(it.price) * Number(it.quantity)
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ppb-empty">
                    <span>No items yet</span>
                  </div>
                )}
              </div>

              {/* totals + options */}
              <div className="ppb-summary">
                <div className="ppb-summary__row">
                  <span>Subtotal</span>
                  <b>{formatNaira(activeCart.subtotal)}</b>
                </div>
                <div className="ppb-summary__row">
                  <span>Discount</span>
                  <b>- {formatNaira(activeCart.discountAmount)}</b>
                </div>
                <div className="ppb-summary__row">
                  <span>Tax</span>
                  <b>{formatNaira(activeCart.tax)}</b>
                </div>
                <div className="ppb-summary__total">
                  <span>Total</span>
                  <b>{formatNaira(activeCart.total)}</b>
                </div>

                {/* discount + note */}
                <div className="ppb-options">
                  <div className="ppb-opt">
                    <label>
                      <FaTags /> Discount
                    </label>
                    <Form.Select
                      value={activeCart.discount || ""}
                      onChange={(e) =>
                        setCarts((prev) =>
                          prev.map((c) =>
                            c.id === activeCart.id
                              ? {
                                  ...c,
                                  discount:
                                    parseInt(e.target.value || 0, 10) || 0,
                                }
                              : c
                          )
                        )
                      }
                    >
                      <option value="">No Discount</option>
                      {discountOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.rate}%)
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="ppb-opt">
                    <label>Note</label>
                    <FormControl
                      placeholder="Add a note for this sale…"
                      value={activeCart.note || ""}
                      onChange={(e) =>
                        setCarts((prev) =>
                          prev.map((c) =>
                            c.id === activeCart.id
                              ? { ...c, note: e.target.value }
                              : c
                          )
                        )
                      }
                    />
                  </div>
                </div>

                {/* payment segmented */}
                <div className="ppb-payment">
                  <div className="ppb-seg">
                    {[
                      { key: "Cash", icon: <FaMoneyBillWave /> },
                      { key: "Card", icon: <FaCreditCard /> },
                      { key: "Bank Transfer", icon: <FaUniversity /> },
                      { key: "Credit", icon: <FaUser /> },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        className={`ppb-seg__btn ${
                          activeCart.payment.paymentMethod === opt.key
                            ? "ppb-seg__btn--active"
                            : ""
                        }`}
                        onClick={() =>
                          setCarts((prev) =>
                            prev.map((c) =>
                              c.id === activeCart.id
                                ? {
                                    ...c,
                                    payment: {
                                      ...c.payment,
                                      paymentMethod: opt.key,
                                      paymentReference: "",
                                      paymentImage: null,
                                      customer: null,
                                      amountPaid: 0,
                                      dueDate: "",
                                    },
                                  }
                                : c
                            )
                          )
                        }
                      >
                        {opt.icon}
                        <span>{opt.key}</span>
                      </button>
                    ))}
                  </div>

                  {/* method-specific fields */}
                  {(activeCart.payment.paymentMethod === "Card" ||
                    activeCart.payment.paymentMethod === "Bank Transfer") && (
                    <div className="ppb-pay__fields">
                      <div className="ppb-opt">
                        <label>Reference</label>
                        <FormControl
                          placeholder="Enter reference number"
                          value={activeCart.payment.paymentReference || ""}
                          onChange={(e) =>
                            setCarts((prev) =>
                              prev.map((c) =>
                                c.id === activeCart.id
                                  ? {
                                      ...c,
                                      payment: {
                                        ...c.payment,
                                        paymentReference: e.target.value,
                                      },
                                    }
                                  : c
                              )
                            )
                          }
                        />
                      </div>
                      <div className="ppb-opt">
                        <label>
                          <FaFileUpload /> Receipt Image
                        </label>
                        <FormControl
                          type="file"
                          onChange={(e) =>
                            setCarts((prev) =>
                              prev.map((c) =>
                                c.id === activeCart.id
                                  ? {
                                      ...c,
                                      payment: {
                                        ...c.payment,
                                        paymentImage: e.target.files?.[0] || null,
                                      },
                                    }
                                  : c
                              )
                            )
                          }
                        />
                        {activeCart.payment.paymentImage && (
                          <small className="ppb-file">
                            {activeCart.payment.paymentImage.name}
                          </small>
                        )}
                      </div>
                    </div>
                  )}

                  {activeCart.payment.paymentMethod === "Credit" && (
                    <div className="ppb-pay__fields">
                      <div className="ppb-opt">
                        <label>
                          <FaUser /> Customer
                        </label>
                        <Form.Select
                          value={activeCart.payment.customer?.id || ""}
                          onChange={(e) => {
                            const selected = customers.find(
                              (c) => c.id === parseInt(e.target.value || "0", 10)
                            );
                            setCarts((prev) =>
                              prev.map((c) =>
                                c.id === activeCart.id
                                  ? {
                                      ...c,
                                      payment: {
                                        ...c.payment,
                                        customer: selected || null,
                                        amountPaid: 0,
                                      },
                                    }
                                  : c
                              )
                            );
                          }}
                        >
                          <option value="">Select customer…</option>
                          {customers.map((cu) => (
                            <option key={cu.id} value={cu.id}>
                              {cu.fullname}
                            </option>
                          ))}
                        </Form.Select>

                        {activeCart.payment.customer && (
                          <div className="ppb-customer-info">
                            Balance:{" "}
                            {formatNaira(activeCart.payment.customer.balance)} •
                            Limit:{" "}
                            {formatNaira(
                              activeCart.payment.customer.credit_limit
                            )}
                          </div>
                        )}
                      </div>

                      {!!activeCart.payment.customer && (
                        <>
                          <div className="ppb-opt">
                            <label>Amount Paid</label>
                            <InputGroup>
                              <InputGroup.Text>₦</InputGroup.Text>
                              <FormControl
                                type="number"
                                min="0"
                                step="0.01"
                                max={activeCart.total}
                                value={activeCart.payment.amountPaid}
                                onChange={(e) =>
                                  setCarts((prev) =>
                                    prev.map((c) =>
                                      c.id === activeCart.id
                                        ? {
                                            ...c,
                                            payment: {
                                              ...c.payment,
                                              amountPaid: e.target.value,
                                            },
                                          }
                                        : c
                                    )
                                  )
                                }
                              />
                            </InputGroup>
                            <small className="ppb-muted">
                              Remaining:{" "}
                              {formatNaira(
                                activeCart.total -
                                  (Number(activeCart.payment.amountPaid) || 0)
                              )}
                            </small>
                          </div>

                          <div className="ppb-opt">
                            <label>
                              <FaCalendarAlt /> Due Date
                            </label>
                            <FormControl
                              type="date"
                              value={activeCart.payment.dueDate}
                              onChange={(e) =>
                                setCarts((prev) =>
                                  prev.map((c) =>
                                    c.id === activeCart.id
                                      ? {
                                          ...c,
                                          payment: {
                                            ...c.payment,
                                            dueDate: e.target.value,
                                          },
                                        }
                                      : c
                                  )
                                )
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  className="ppb-checkout"
                  onClick={() => handleCheckout(activeCart)}
                  disabled={!activeCart.items.length}
                >
                  Complete Sale — {activeCart.name}
                </Button>
              </div>
            </>
          )}
        </Card>
      </aside>

      {/* RIGHT: Product Browser */}
      <section className="ppb-products">
        <Card className="ppb-panel">
          <div className="ppb-panel__header">
            <div className="ppb-title">
              <FaBoxOpen />
              <span>Available Products</span>
              <Badge bg="secondary" className="ppb-count">
                {filteredProducts.length}
              </Badge>
            </div>

            <div className="ppb-filters">
              <div className="ppb-search">
                <FaSearch className="ppb-search__icon" />
                <input
                  className="ppb-search__input"
                  placeholder="Search name or category…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="ppb-category">
                <FaFilter />
                <Form.Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>

          {/* product grid */}
          <div className="ppb-grid">
            {filteredProducts.map((p) => {
              const stock = inventory[p.id] || 0;
              const statusClass =
                stock > 10 ? "ppb-chip--ok" : stock > 0 ? "ppb-chip--low" : "ppb-chip--oos";
              return (
                <div
                  key={p.id}
                  className={`ppb-product ${
                    stock === 0 ? "ppb-product--oos" : ""
                  }`}
                >
                  <div className="ppb-product__media">
                    <img
                      src={p.image_url || "https://via.placeholder.com/220x150"}
                      alt={p.name}
                    />
                    <span className={`ppb-chip ${statusClass}`}>
                      {stock > 10 ? "In Stock" : stock > 0 ? "Low Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="ppb-product__body">
                    <div className="ppb-product__name" title={p.name}>
                      {p.name}
                    </div>
                    <div className="ppb-product__meta">
                      <span className="ppb-badge">
                        {p.category || "General"}
                      </span>
                      <span className="ppb-price">{formatNaira(p.price)}</span>
                    </div>
                    <Button
                      className="ppb-add"
                      disabled={stock <= 0}
                      onClick={() => addToCart(p, activeCartId)}
                    >
                      <FaCartPlus />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default NewSalePage;
