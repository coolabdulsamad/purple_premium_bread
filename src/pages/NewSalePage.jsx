// src/pages/NewSalePage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
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
  FaGift,
  FaCrown,
  FaMotorcycle,
  FaWallet,
  FaLayerGroup,
  FaSave,
  FaFolderOpen,
  FaCheckDouble,
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
  FormCheck,
  Modal,
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/styles/newSale.css";
import CustomToast from "../components/CustomToast";
import useAuth from '../hooks/useAuth';
import api from "../api/axiosInstance";

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

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

const SPLIT_METHODS = ["Cash", "Card", "Bank Transfer"];

const emptyPayment = () => ({
  paymentMethod: "Cash",
  paymentReference: "",
  paymentImage: null,
  customer: null,
  amountPaid: 0,
  dueDate: "",
  // Phase 5: split payments + advance wallet
  useSplit: false,
  splits: [{ method: "Cash", amount: "" }],
  walletAmount: "",
});

// Drafts are stored in the browser (localStorage) so they survive reloads / leaving the page.
const DRAFTS_STORAGE_KEY = "ppb_new_sale_drafts";

// Offline support: cached POS reference data + queued offline sales
const POS_CACHE_KEY = "ppb_pos_cache";
const OFFLINE_QUEUE_KEY = "ppb_offline_sales";

const freshCart = (id, name) => ({
  id,
  name: name || `Group ${id}`,
  items: [],
  payment: emptyPayment(),
  total: 0,
  discount: 0,
  note: "",
  isAdvantageSale: false,
  advantageAmount: 0,
  itemAdvantageAmounts: {},
  isRiderSale: false,
  selectedRider: null,
  riderCreditInfo: null,
});

/* ========= Main Component ========= */
const NewSalePage = () => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState({});
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [riders, setRiders] = useState([]);
  
  const [carts, setCarts] = useState([
    {
      id: 1,
      name: "Group 1",
      items: [],
      payment: emptyPayment(),
      total: 0,
      discount: 0,
      note: "",
      // Advantage sale fields
      isAdvantageSale: false,
      advantageAmount: 0,
      itemAdvantageAmounts: {},
      // Rider sale fields
      isRiderSale: false,
      selectedRider: null,
      riderCreditInfo: null,
    },
  ]);
  
  const [activeCartId, setActiveCartId] = useState(1);
  // Saved draft groups (persisted in localStorage — survive reload/leave)
  const [drafts, setDrafts] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showDrafts, setShowDrafts] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);

  // Confirmation dialog (single sale or complete-all) — review full details first
  const [confirmSale, setConfirmSale] = useState(null); // { type: 'single' | 'all', carts: [...] }
  const [processingConfirm, setProcessingConfirm] = useState(false);

  // Offline mode: queue sales on this device when there is no internet, sync when back
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);

  // Persist drafts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // storage full or blocked — drafts stay in memory for this session
    }
  }, [drafts]);

  // Persist offline queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch {
      // storage full or blocked — queue stays in memory for this session
    }
  }, [offlineQueue]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  // Free Stock Feature State
  const [isFreeStockChecked, setIsFreeStockChecked] = useState(false);
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split("T")[0]); // manual sale date, defaults to today
  const [freeStockQuantities, setFreeStockQuantities] = useState({});
  const [freeStockReason, setFreeStockReason] = useState("");

  // Phase 5: advance wallet balances keyed by "CUSTOMER:ID" / "RIDER:ID" (fail-open)
  const [walletBalances, setWalletBalances] = useState({});

  const { user, userRole } = useAuth();
  const userId = user?.id;

  const activeCart = carts.find((c) => c.id === activeCartId);

  /* ========= Wallet Balance Fetch (fail-open) ========= */
  const fetchWalletBalance = async (ownerType, ownerId) => {
    if (!ownerId) return;
    const key = `${ownerType}:${ownerId}`;
    try {
      const res = await api.get(`/wallets/balance`, {
        params: { owner_type: ownerType, owner_id: ownerId },
      });
      setWalletBalances((prev) => ({ ...prev, [key]: Number(res.data?.advance_balance || 0) }));
    } catch {
      // 503 (migration not applied) or any failure: wallet simply unavailable
      setWalletBalances((prev) => ({ ...prev, [key]: null }));
    }
  };

  /* ========= Data Fetch ========= */
  useEffect(() => {
    let mounted = true;

    const fetchAllData = async () => {
      if (userRole === 'sales' && !userId) {
        return;
      }

      setLoading(true);

      try {
        let productsEndpoint;

        if (userRole === 'sales') {
          productsEndpoint = `${API_BASE_URL}/products/with-stock-source/${userId}`;
        } else {
          productsEndpoint = `${API_BASE_URL}/inventory/detailed`;
        }

        const [productsAndStockRes, customersRes, servicesRes, ridersRes] =
          await Promise.all([
            api.get(productsEndpoint),
            api.get(`/customers`),
            api.get(`/services/newsales`),
            api.get(`/riders?status=active`),
          ]);

        const productsData = (productsAndStockRes.data || [])
          .filter((p) => p.name || p.product_name)
          .map(p => ({
            id: p.id || p.product_id,
            name: p.name || p.product_name,
            price: p.price,
            category: p.category || p.product_category,
            image_url: p.image_url,
            quantity: p.quantity
          }));

        if (!mounted) return;

        setProducts(productsData);
        setCustomers(customersRes.data);
        setServices(servicesRes.data);
        setRiders(ridersRes.data?.riders || []);

        const inventoryMap = productsData.reduce((map, item) => {
          map[item.id] = item.quantity;
          return map;
        }, {});
        setInventory(inventoryMap);

        // Cache the POS reference data on this device for offline use
        try {
          localStorage.setItem(POS_CACHE_KEY, JSON.stringify({
            products: productsData,
            customers: customersRes.data,
            services: servicesRes.data,
            riders: ridersRes.data?.riders || [],
            inventoryMap,
            savedAt: new Date().toISOString(),
          }));
        } catch {
          // storage full or blocked — offline cache skipped
        }

        setLoading(false);

      } catch (error) {
        if (!mounted) return;
        console.error("POS Data Fetch Error:", error.response?.data || error.message);
        // Offline fallback: use the reference data last saved on this device
        let cached = null;
        try {
          cached = JSON.parse(localStorage.getItem(POS_CACHE_KEY) || "null");
        } catch {
          cached = null;
        }
        if (cached && Array.isArray(cached.products) && cached.products.length) {
          setProducts(cached.products);
          setCustomers(cached.customers || []);
          setServices(cached.services || []);
          setRiders(cached.riders || []);
          setInventory(cached.inventoryMap || {});
          toast(<CustomToast type="info" message="No internet — using data saved on this device. New sales will sync when connection returns." />, {
            toastId: 'pos-offline-cache'
          });
        } else {
          toast(<CustomToast type="error" message={`Failed to load POS data: ${error.response?.data?.error || 'No internet connection'}`} />, {
            toastId: 'pos-error'
          });
        }
        setLoading(false);
      }
    };

    fetchAllData();
    
    return () => { mounted = false; };
  }, [userId, userRole]);

  /* ========= Online status + offline sales sync ========= */
  const syncOfflineSales = async () => {
    let queue;
    try {
      queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    } catch {
      queue = [];
    }
    if (!Array.isArray(queue) || queue.length === 0) return;
    if (!navigator.onLine || syncing) return;

    setSyncing(true);
    let synced = 0;
    let stillOffline = false;
    const remaining = [];
    for (let i = 0; i < queue.length; i += 1) {
      const entry = queue[i];
      try {
        // Process queued sales one by one so stock checks stay safe
        // eslint-disable-next-line no-await-in-loop
        await api.post(`/sales/process`, entry.payload);
        synced += 1;
      } catch (error) {
        if (!error.response) {
          // Connection dropped again — keep this and everything after it
          stillOffline = true;
          remaining.push(...queue.slice(i));
          break;
        }
        // Server rejected it (e.g. stock changed) — keep it queued so nothing is lost silently
        remaining.push(entry);
      }
    }
    setOfflineQueue(remaining);
    setSyncing(false);

    if (synced > 0) {
      toast(<CustomToast type="success" message={`${synced} offline sale(s) synced to the cloud.`} />, { toastId: 'offline-sync-success' });
    }
    if (!stillOffline && remaining.length > 0) {
      toast(<CustomToast type="warning" message={`${remaining.length} offline sale(s) could not sync (server rejected them). They are kept on this device.`} />, { toastId: 'offline-sync-rejected' });
    }
  };

  // A ref so the event listeners below always call the latest version
  const syncRef = useRef(syncOfflineSales);
  syncRef.current = syncOfflineSales;

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      syncRef.current?.();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Also retry periodically while the page is open
    const interval = setInterval(() => {
      if (navigator.onLine) syncRef.current?.();
    }, 60000);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(interval);
    };
  }, []);

  /* ========= Get Product Price Based on Rider ========= */
  const getProductPrice = (product, cart) => {
    if (cart.isRiderSale && cart.selectedRider) {
      const rider = cart.selectedRider;
      // Check if rider has custom price for this product
      const riderProductPrice = rider.rider_product_prices?.find(
        p => p.product_id === product.id
      );
      if (riderProductPrice) {
        return riderProductPrice.price;
      }
    }
    return product.price;
  };

  /* ========= Totals (UPDATED for Rider & Advantage Pricing) ========= */
  const getTotals = (cart) => {
    // Calculate subtotal with appropriate prices
    const subtotal = cart.items.reduce((sum, item) => {
      const basePrice = Number(item.price);
      const advantageAmount = cart.itemAdvantageAmounts[item.id] || 0;
      const finalPrice = basePrice + Number(advantageAmount);
      return sum + finalPrice * Number(item.quantity);
    }, 0);

    const discountService = services.find((s) => s.id === cart.discount);
    const discountAmount = discountService
      ? subtotal * (Number(discountService.rate) / 100)
      : 0;

    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxService = services.find((s) => s.name?.toLowerCase() === "tax");
    const taxRate = taxService ? Number(taxService.rate) / 100 : 0.00;
    const tax = subtotalAfterDiscount * taxRate;
    const total = subtotalAfterDiscount + tax;

    return { 
      subtotal, 
      tax, 
      total, 
      discountAmount
    };
  };

  // Auto-calc totals
  useEffect(() => {
    setCarts((prev) =>
      prev.map((cart) => {
        const { subtotal, tax, total, discountAmount } = getTotals(cart);
        return { ...cart, subtotal, tax, total, discountAmount };
      })
    );
  }, [
    JSON.stringify(
      carts.map((c) => ({ 
        id: c.id, 
        items: c.items.map(item => ({
          ...item,
          price: getProductPrice(item, c) // Recalculate prices based on rider
        })),
        discount: c.discount,
        isAdvantageSale: c.isAdvantageSale,
        itemAdvantageAmounts: c.itemAdvantageAmounts,
        isRiderSale: c.isRiderSale,
        selectedRider: c.selectedRider
      }))
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

  /* ========= Cart Operations ========= */
  const addToCart = (product, cartId) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        
        const price = getProductPrice(product, cart);
        const existing = cart.items.find((i) => i.id === product.id);
        const stock = inventory[product.id] || 0;

        if (existing) {
          if (existing.quantity + 1 > stock) {
            toast(<CustomToast type="warning" message="Inventory limit reached." />, {
              toastId: 'inventory-warn'
            });
            return cart;
          }
          toast(<CustomToast type="success" message={`${product.name} +1`} />, {
            toastId: 's-success'
          });
          return {
            ...cart,
            items: cart.items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        } else {
          if (stock <= 0) {
            toast(<CustomToast type="error" message="Out of stock." />, {
              toastId: 'stock-error'
            });
            return cart;
          }
          toast(<CustomToast type="success" message={`${product.name} added to cart`} />, {
            toastId: 'cart-success'
          });
          return {
            ...cart,
            items: [
              ...cart.items,
              {
                id: product.id,
                name: product.name,
                price: price,
                originalPrice: product.price,
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
              toast(<CustomToast type="warning" message="Inventory limit reached." />, {
                toastId: 'inventory-warn'
              });
              return i;
            }
            return { ...i, quantity: qty };
          })
          .filter((i) => i.quantity > 0);
        return { ...cart, items };
      })
    );
  };

  const updateAdvantageAmount = (cartId, productId, amount) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        const newAmounts = {
          ...cart.itemAdvantageAmounts,
          [productId]: Math.max(0, Number(amount) || 0)
        };
        return {
          ...cart,
          itemAdvantageAmounts: newAmounts
        };
      })
    );
  };

  const handleRiderSelect = (cartId, riderId) => {
    const rider = riders.find(r => r.id === parseInt(riderId));
    
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        
        // Update items with rider's custom prices
        const updatedItems = cart.items.map(item => {
          const riderPrice = rider?.rider_product_prices?.find(
            p => p.product_id === item.id
          );
          return {
            ...item,
            price: riderPrice ? riderPrice.price : item.originalPrice || item.price,
            originalPrice: item.originalPrice || item.price
          };
        });

        return {
          ...cart,
          isRiderSale: true,
          selectedRider: rider,
          riderCreditInfo: rider ? {
            creditLimit: rider.credit_limit,
            currentBalance: rider.current_balance,
            availableCredit: (rider.credit_limit || 0) - (rider.current_balance || 0)
          } : null,
          items: updatedItems
        };
      })
    );

    if (rider) {
      fetchWalletBalance("RIDER", rider.id);
      toast(<CustomToast type="info" message={`Rider ${rider.fullname} selected`} />);
    }
  };

  const clearRiderSelection = (cartId) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        
        // Reset items to original prices
        const updatedItems = cart.items.map(item => ({
          ...item,
          price: item.originalPrice || item.price
        }));

        return {
          ...cart,
          isRiderSale: false,
          selectedRider: null,
          riderCreditInfo: null,
          items: updatedItems
        };
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
        payment: emptyPayment(),
        total: 0,
        discount: 0,
        note: "",
        isAdvantageSale: false,
        advantageAmount: 0,
        itemAdvantageAmounts: {},
        isRiderSale: false,
        selectedRider: null,
        riderCreditInfo: null,
      },
    ]);
    setActiveCartId(nextId);
    toast(<CustomToast type="info" message={`${groupName} created`} />, {
      toastId: 'group-info'
    });
  };

  const removeCart = (cartId) => {
    if (carts.length === 1) {
      toast(<CustomToast type="warning" message="At least one group is required." />, {
        toastId: 'group-warn'
      });
      return;
    }
    const removed = carts.find((c) => c.id === cartId)?.name || `Group ${cartId}`;
    const next = carts.filter((c) => c.id !== cartId);
    setCarts(next);
    if (!next.find((c) => c.id === activeCartId) && next.length) {
      setActiveCartId(next[0].id);
    }
    toast(<CustomToast type="success" message={`${removed} removed`} />, {
      toastId: 'remove-success'
    });
  };

  /* ========= Drafts: save / restore / delete sales groups ========= */
  const saveCartAsDraft = (cart) => {
    if (!cart || cart.items.length === 0) {
      toast(<CustomToast type="warning" message="This group is empty — nothing to draft." />, { toastId: 'draft-empty' });
      return;
    }
    // A receipt image is a File and cannot be saved to storage — everything else is kept
    const { paymentImage, ...paymentRest } = cart.payment;
    const draft = {
      ...cart,
      payment: { ...paymentRest },
      draftId: `${Date.now()}-${cart.id}`,
      savedAt: new Date().toISOString(),
    };
    if (paymentImage) {
      toast(<CustomToast type="info" message="Receipt image can't be saved in a draft — re-attach it after restoring." />, { toastId: 'draft-img-note' });
    }
    setDrafts((prev) => [...prev, draft]);
    // Reset the group so a fresh sale can start in it
    setCarts((prev) => prev.map((c) => (c.id === cart.id ? freshCart(c.id, c.name) : c)));
    toast(<CustomToast type="success" message={`${cart.name} saved to drafts.`} />, { toastId: 'draft-saved' });
  };

  const restoreDraft = (draftId) => {
    const draft = drafts.find((d) => d.draftId === draftId);
    if (!draft) return;
    // Re-match customer/rider against the latest lists so balances & credit are fresh
    const freshCustomer = draft.payment?.customer
      ? customers.find((c) => c.id === draft.payment.customer.id) || draft.payment.customer
      : null;
    const freshRider = draft.selectedRider
      ? riders.find((r) => r.id === draft.selectedRider.id) || draft.selectedRider
      : null;
    const nextId = carts.length ? Math.max(...carts.map((c) => c.id)) + 1 : 1;
    const restored = {
      id: nextId,
      name: draft.name || `Group ${nextId}`,
      items: draft.items || [],
      payment: { ...emptyPayment(), ...draft.payment, customer: freshCustomer, paymentImage: null },
      total: draft.total || 0,
      discount: draft.discount || 0,
      note: draft.note || "",
      isAdvantageSale: !!draft.isAdvantageSale,
      advantageAmount: draft.advantageAmount || 0,
      itemAdvantageAmounts: draft.itemAdvantageAmounts || {},
      isRiderSale: !!draft.isRiderSale,
      selectedRider: freshRider,
      riderCreditInfo: draft.riderCreditInfo || null,
    };
    setCarts((prev) => [...prev, restored]);
    setActiveCartId(nextId);
    setDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
    setShowDrafts(false);
    toast(<CustomToast type="success" message={`${restored.name} restored from drafts.`} />, { toastId: 'draft-restored' });
  };

  const deleteDraft = (draftId) => {
    const draft = drafts.find((d) => d.draftId === draftId);
    setDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
    toast(<CustomToast type="info" message={`${draft?.name || 'Draft'} deleted.`} />, { toastId: 'draft-deleted' });
  };

  /* ========= Complete all groups at once (opens confirmation dialog) ========= */
  const handleCompleteAll = () => {
    const ready = carts.filter((c) => c.items.length > 0);
    if (ready.length === 0) {
      toast(<CustomToast type="warning" message="No groups with items to complete." />, { toastId: 'complete-all-empty' });
      return;
    }
    setConfirmSale({ type: "all", carts: ready });
  };

  /* ========= Runs after the confirmation dialog is accepted ========= */
  const processConfirmedSales = async () => {
    if (!confirmSale) return;
    setProcessingConfirm(true);

    if (confirmSale.type === "single") {
      await handleCheckout(confirmSale.carts[0]);
    } else {
      setCompletingAll(true);
      const failed = [];
      let queuedCount = 0;
      for (const cart of confirmSale.carts) {
        // Process groups one by one so stock checks stay safe
        // eslint-disable-next-line no-await-in-loop
        const ok = await handleCheckout(cart);
        if (ok === false) failed.push(cart.name);
        if (ok === "queued") queuedCount += 1;
      }
      setCompletingAll(false);

      const totalCount = confirmSale.carts.length;
      if (failed.length === 0 && queuedCount === 0) {
        toast(<CustomToast type="success" message={`All ${totalCount} group(s) completed successfully.`} />, { toastId: 'complete-all-success' });
      } else if (failed.length === 0) {
        toast(<CustomToast type="info" message={`${queuedCount} of ${totalCount} group(s) saved offline — they will sync when internet returns.`} />, { toastId: 'complete-all-queued' });
      } else {
        toast(<CustomToast type="error" message={`Completed ${totalCount - failed.length} of ${totalCount} group(s). Failed: ${failed.join(', ')}`} />, { toastId: 'complete-all-partial' });
      }
    }

    setProcessingConfirm(false);
    setConfirmSale(null);
  };

  /* ========= Split Payment Helpers ========= */
  const updateSplit = (cartId, index, field, value) => {
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id !== cartId) return c;
        const splits = c.payment.splits.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        );
        return { ...c, payment: { ...c.payment, splits } };
      })
    );
  };

  const addSplitRow = (cartId) => {
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id !== cartId) return c;
        const usedMethods = c.payment.splits.map((s) => s.method);
        const nextMethod = SPLIT_METHODS.find((m) => !usedMethods.includes(m)) || "Cash";
        return {
          ...c,
          payment: { ...c.payment, splits: [...c.payment.splits, { method: nextMethod, amount: "" }] },
        };
      })
    );
  };

  const removeSplitRow = (cartId, index) => {
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id !== cartId) return c;
        const splits = c.payment.splits.filter((_, i) => i !== index);
        return { ...c, payment: { ...c.payment, splits } };
      })
    );
  };

  /* ========= Checkout (Rider + Advantage + Split Payments + Wallet) ========= */
  const handleCheckout = async (cartToProcess) => {
    if (!cartToProcess || cartToProcess.items.length === 0) {
      toast(<CustomToast type="warning" message="Cart is empty." />, { toastId: 'cart-warn' });
      return false;
    }

    // Validate rider credit if it's a rider sale with credit payment
    if (cartToProcess.isRiderSale && 
        cartToProcess.payment.paymentMethod === "Credit" && 
        cartToProcess.selectedRider) {
      
      const rider = cartToProcess.selectedRider;
      const availableCredit = (rider.credit_limit || 0) - (rider.current_balance || 0);
      
      if (cartToProcess.total > availableCredit) {
        toast(<CustomToast type="error" message={`Rider's available credit (${formatNaira(availableCredit)}) is insufficient for this sale.`} />, {
          toastId: 'rider-credit-error'
        });
        return false;
      }
    }

    // Free stock validation
    if (isFreeStockChecked) {
      let isValid = true;
      Object.entries(freeStockQuantities).forEach(([productId, freeQty]) => {
        const item = cartToProcess.items.find(i => i.id === parseInt(productId));
        if (freeQty > (item?.quantity || 0)) {
          toast(<CustomToast type="error" message={`Free stock for ${item?.name || 'an item'} exceeds the quantity sold.` } />, {
            toastId: 'free-stock-exceed-error'
          });
          isValid = false;
        }
      });
      if (!isValid) return;

      if (!freeStockReason.trim()) {
        toast(<CustomToast type="error" message="Please provide a reason for the free stock/incentive." />, {
          toastId: 'free-stock-reason-error'
        });
        return false;
      }
    }

    const cashierId = getCashierIdFromToken();
    if (!cashierId) {
      toast(<CustomToast type="error" message="You must be logged in to process a sale." />, {
        toastId: 'sale-error'
      });
      return false;
    }

    let paymentImageUrl = null;
    if (cartToProcess.payment.paymentImage) {
      try {
        const fd = new FormData();
        fd.append("receiptImage", cartToProcess.payment.paymentImage);
        const upload = await api.post(`/sales/upload-receipt`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        paymentImageUrl = upload.data.url;
      } catch (uploadErr) {
        if (!uploadErr.response) {
          toast(<CustomToast type="error" message="No internet — a receipt image can't be saved offline. Remove the image to queue this sale, or reconnect and try again." />, {
            toastId: 'receipt-error'
          });
        } else {
          toast(<CustomToast type="error" message="Failed to upload receipt image." />, {
            toastId: 'receipt-error'
          });
        }
        return false;
      }
    }

    const { subtotal, tax, total, discountAmount } = getTotals(cartToProcess);
    
    // Calculate advantage total and base subtotal
    const baseSubtotal = cartToProcess.items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);
    
    const advantageTotal = cartToProcess.items.reduce((sum, item) => {
      const advantageAmount = cartToProcess.itemAdvantageAmounts[item.id] || 0;
      return sum + (Number(advantageAmount) * Number(item.quantity));
    }, 0);
    
    let amountPaid = 0;
    let balanceDue = 0;
    let status = "Paid";
    let dueDate = null;
    let customerId = null;

    if (cartToProcess.payment.paymentMethod === "Credit") {
      if (!cartToProcess.payment.customer && !cartToProcess.isRiderSale) {
        toast(<CustomToast type="error" message="Select a customer for credit sales." />, { toastId: 'sales-error' });
        return false;
      }

      // For rider sales, use rider's credit info
      if (cartToProcess.isRiderSale && cartToProcess.selectedRider) {
        customerId = cartToProcess.selectedRider.customer_id;
      } else if (cartToProcess.payment.customer) {
        customerId = cartToProcess.payment.customer.id;
      }

      amountPaid = Number(cartToProcess.payment.amountPaid || 0);
      balanceDue = total - amountPaid;

      // Check credit limit based on customer or rider
      if (cartToProcess.isRiderSale && cartToProcess.selectedRider) {
        const rider = cartToProcess.selectedRider;
        const availableCredit = (rider.credit_limit || 0) - (rider.current_balance || 0);
        
        if (balanceDue > availableCredit && amountPaid < total) {
          toast(<CustomToast type="error" message="Exceeds rider's remaining credit limit." />, { toastId: 'credit-error' });
          return false;
        }
      } else if (cartToProcess.payment.customer) {
        const remainingLimit =
          Number(cartToProcess.payment.customer.credit_limit || 0) -
          Number(cartToProcess.payment.customer.balance || 0);

        if (balanceDue > remainingLimit && amountPaid < total) {
          toast(<CustomToast type="error" message="Exceeds customer's remaining credit limit." />, { toastId: 'credit-error' });
          return false;
        }
      }

      if (balanceDue > 0 && balanceDue < total) status = "Partially Paid";
      if (balanceDue === total) status = "Unpaid";
      if (balanceDue <= 0) {
        status = "Paid";
        balanceDue = 0;
      }

      dueDate = cartToProcess.payment.dueDate || null;
      if (!dueDate && balanceDue > 0) {
        toast(<CustomToast type="warning" message="Choose a due date for outstanding balance." />, {
          toastId: 'balance-warn'
        });
        return false;
      }
    } else {
      amountPaid = total;
      balanceDue = 0;
      status = "Paid";
      // Attach the selected customer even for non-credit sales (customer is optional here)
      if (cartToProcess.isRiderSale && cartToProcess.selectedRider) {
        customerId = cartToProcess.selectedRider.customer_id || null;
      } else if (cartToProcess.payment.customer) {
        customerId = cartToProcess.payment.customer.id;
      }
    }

    // --- Phase 5: wallet usage ---
    const walletAmount = Math.max(0, Number(cartToProcess.payment.walletAmount) || 0);
    const walletOwnerType = cartToProcess.isRiderSale && cartToProcess.selectedRider ? "RIDER" : "CUSTOMER";
    const walletOwnerId = cartToProcess.isRiderSale && cartToProcess.selectedRider
      ? cartToProcess.selectedRider.id
      : cartToProcess.payment.customer?.id;

    if (walletAmount > 0) {
      if (!walletOwnerId) {
        toast(<CustomToast type="error" message="Select a customer or rider to use their advance wallet." />, { toastId: 'wallet-error' });
        return false;
      }
      const key = `${walletOwnerType}:${walletOwnerId}`;
      const available = walletBalances[key];
      if (available === null || available === undefined) {
        toast(<CustomToast type="error" message="Advance wallet is unavailable (migration pending)." />, { toastId: 'wallet-error' });
        return false;
      }
      if (walletAmount > available + 0.004) {
        toast(<CustomToast type="error" message={`Wallet balance (${formatNaira(available)}) is less than ${formatNaira(walletAmount)}.`} />, { toastId: 'wallet-error' });
        return false;
      }
      if (walletAmount > amountPaid + 0.004) {
        toast(<CustomToast type="error" message="Wallet amount cannot exceed the amount being paid." />, { toastId: 'wallet-error' });
        return false;
      }
    }

    // --- Phase 5: split payment validation (splits cover the real-money part) ---
    const realMoneyPaid = Math.round((amountPaid - walletAmount) * 100) / 100;
    let paymentSplits = null;
    if (cartToProcess.payment.useSplit) {
      const splits = (cartToProcess.payment.splits || [])
        .map((s) => ({ payment_method: s.method, amount: Number(s.amount) || 0 }))
        .filter((s) => s.amount > 0);
      const splitTotal = Math.round(splits.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
      if (splits.length === 0) {
        toast(<CustomToast type="error" message="Add at least one split payment amount." />, { toastId: 'split-error' });
        return false;
      }
      if (Math.abs(splitTotal - realMoneyPaid) > 0.01) {
        toast(<CustomToast type="error" message={`Split amounts (${formatNaira(splitTotal)}) must equal the cash/bank part of the payment (${formatNaira(realMoneyPaid)}).`} />, { toastId: 'split-error' });
        return false;
      }
      paymentSplits = splits;
    }

    // Prepare items with advantage amounts
    const cartItemsWithAdvantage = cartToProcess.items.map(item => {
      const basePrice = Number(item.price);
      const advantageAmount = cartToProcess.itemAdvantageAmounts[item.id] || 0;
      const finalPrice = basePrice + Number(advantageAmount);
      
      return {
        id: item.id,
        quantity: item.quantity,
        price: basePrice, // Keep original price for base calculation
        advantageAmount: advantageAmount,
        finalPrice: finalPrice,
      };
    });

    const payload = {
      cart: cartItemsWithAdvantage,
      subtotal,
      tax,
      total,
      discountAmount,
      cashierId,
      paymentMethod: cartToProcess.payment.useSplit ? "Split" : cartToProcess.payment.paymentMethod,
      customerId,
      note: cartToProcess.note,
      paymentReference: cartToProcess.payment.paymentReference,
      paymentImageUrl,
      status,
      amountPaid,
      balanceDue,
      dueDate,
      freeStock: isFreeStockChecked
        ? { quantities: freeStockQuantities, reason: freeStockReason }
        : null,
      // Advantage sale data
      isAdvantageSale: cartToProcess.isAdvantageSale,
      advantageTotal: advantageTotal,
      baseSubtotal: baseSubtotal,
      // Rider sale data
      isRiderSale: cartToProcess.isRiderSale,
      riderId: cartToProcess.selectedRider?.id || null,
      // Phase 5: split payments + wallet
      paymentSplits,
      walletAmountUsed: walletAmount,
      // Manual sale date (YYYY-MM-DD, defaults to today)
      saleDate,
    };

    try {
      await api.post(`/sales/process`, payload);
      toast(<CustomToast type="success" message="Sale completed successfully." />, { toastId: 'sales-success' });

      // Reset the processed cart
      setCarts((prev) =>
        prev.map((cart) =>
          cart.id === cartToProcess.id
            ? {
                id: cart.id,
                name: cart.name,
                items: [],
                payment: emptyPayment(),
                total: 0,
                discount: 0,
                note: "",
                isAdvantageSale: false,
                advantageAmount: 0,
                itemAdvantageAmounts: {},
                isRiderSale: false,
                selectedRider: null,
                riderCreditInfo: null,
              }
            : cart
        )
      );

      // Reset free stock states
      setIsFreeStockChecked(false);
      setFreeStockQuantities({});
      setFreeStockReason("");

      // Refresh the wallet balance if wallet funds were used
      if (walletAmount > 0 && walletOwnerId) {
        fetchWalletBalance(walletOwnerType, walletOwnerId);
      }

      // Refresh stock data
      const fetchAllData = async () => {
        try {
          let productsEndpoint;
          if (userRole === 'sales') {
            productsEndpoint = `${API_BASE_URL}/products/with-stock-source/${userId}`;
          } else {
            productsEndpoint = `${API_BASE_URL}/inventory/detailed`;
          }
          
          const productsAndStockRes = await api.get(productsEndpoint);
          const productsData = (productsAndStockRes.data || [])
            .filter((p) => p.name || p.product_name)
            .map(p => ({
              id: p.id || p.product_id,
              name: p.name || p.product_name,
              price: p.price,
              category: p.category || p.product_category,
              image_url: p.image_url,
              quantity: p.quantity
            }));

          setProducts(productsData);
          const inventoryMap = productsData.reduce((map, item) => {
            map[item.id] = item.quantity;
            return map;
          }, {});
          setInventory(inventoryMap);

          // Refresh riders list
          const ridersRes = await api.get(`/riders?status=active`);
          setRiders(ridersRes.data?.riders || []);

        } catch (error) {
          console.error("Stock refresh error:", error);
        }
      };
      
      fetchAllData();
      return true;
    } catch (error) {
      console.error("Sale Processing Error:", error.response?.data || error.message);
      if (!error.response) {
        // No internet / server unreachable — save the sale on this device and sync later
        const entry = {
          id: `${Date.now()}-${cartToProcess.id}`,
          label: `${cartToProcess.name} · ${formatNaira(total)}`,
          queuedAt: new Date().toISOString(),
          payload,
        };
        setOfflineQueue((prev) => [...prev, entry]);
        toast(<CustomToast type="info" message="No internet — sale saved on this device. It will sync automatically when connection returns." />, { toastId: 'offline-queued' });

        // Reset the processed cart (same as a completed sale)
        setCarts((prev) =>
          prev.map((cart) =>
            cart.id === cartToProcess.id ? freshCart(cart.id, cart.name) : cart
          )
        );
        setIsFreeStockChecked(false);
        setFreeStockQuantities({});
        setFreeStockReason("");
        return "queued";
      }
      toast(<CustomToast type="error" message={error.response?.data?.error || "Failed to process sale."} />, { toastId: 'sales-error' });
      return false;
    }
  };

  /* ========= Customers selectable in POS (rider-linked customers are hidden) ========= */
  const selectableCustomers = useMemo(() => {
    const riderCustomerIds = new Set(
      (riders || [])
        .map((r) => r.customer_id)
        .filter((id) => id !== null && id !== undefined)
    );
    return customers.filter((c) => !riderCustomerIds.has(c.id));
  }, [customers, riders]);

  /* ========= Discount Options ========= */
  const discountOptions = useMemo(
    () => services.filter((s) => s.name?.toLowerCase() !== "tax"),
    [services]
  );

  /* ========= Phase 5: active cart wallet context ========= */
  const activeWalletOwnerType =
    activeCart?.isRiderSale && activeCart?.selectedRider ? "RIDER" : "CUSTOMER";
  const activeWalletOwnerId =
    activeCart?.isRiderSale && activeCart?.selectedRider
      ? activeCart.selectedRider.id
      : activeCart?.payment?.customer?.id;
  const activeWalletKey = activeWalletOwnerId
    ? `${activeWalletOwnerType}:${activeWalletOwnerId}`
    : null;
  const activeWalletBalance = activeWalletKey
    ? walletBalances[activeWalletKey]
    : undefined;

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
          {(!isOnline || offlineQueue.length > 0) && (
            <div style={{ background: !isOnline ? "#fef3c7" : "#ede9fe", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", marginBottom: 10, fontSize: 13 }}>
              {!isOnline && (
                <div style={{ color: "#92400e", fontWeight: 600 }}>
                  You are offline — new sales are saved on this device and will sync automatically when connection returns.
                </div>
              )}
              {offlineQueue.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, color: "#5b21b6", marginTop: !isOnline ? 4 : 0 }}>
                  <span>{offlineQueue.length} sale(s) saved on this device waiting to sync.</span>
                  {isOnline && (
                    <Button size="sm" variant="outline-primary" onClick={syncOfflineSales} disabled={syncing}>
                      {syncing ? "Syncing…" : "Sync Now"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="ppb-panel__header">
            <div className="ppb-title">
              <FaShoppingCart />
              <span>Sales Groups</span>
              <Badge bg="secondary" className="ppb-count">
                {carts.length}
              </Badge>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                className="ppb-group-add"
                size="sm"
                onClick={() => setShowDrafts((s) => !s)}
                title="Saved draft groups"
              >
                <FaFolderOpen /> Drafts ({drafts.length})
              </Button>
              <Button className="ppb-group-add" size="sm" onClick={addCart}>
                + Add Group
              </Button>
            </div>
          </div>

          {/* drafts panel */}
          {showDrafts && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, marginBottom: 10, background: "#fafafa" }}>
              <div style={{ fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <FaSave /> Saved Drafts ({drafts.length})
              </div>
              {drafts.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  No drafts yet. Use the Draft button on a group to save it here — it stays even if you reload or leave this page.
                </div>
              ) : (
                drafts.map((d) => (
                  <div key={d.draftId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid #eee" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.name}
                        {d.isRiderSale && <FaMotorcycle style={{ marginLeft: 6, color: "#7c3aed" }} />}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {(d.items || []).length} item(s) · {formatNaira(d.total || 0)}
                        {d.payment?.customer?.fullname
                          ? ` · ${d.payment.customer.fullname}`
                          : d.selectedRider?.fullname
                            ? ` · ${d.selectedRider.fullname}`
                            : ""}
                        {d.savedAt ? ` · ${new Date(d.savedAt).toLocaleString()}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Button size="sm" variant="outline-primary" onClick={() => restoreDraft(d.draftId)}>
                        Restore
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => deleteDraft(d.draftId)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* group tabs */}
          <div className="ppb-groups">
            {carts.map((cart) => (
              <button
                key={cart.id}
                className={`ppb-group ${cart.id === activeCartId ? "ppb-group--active" : ""}`}
                onClick={() => setActiveCartId(cart.id)}
              >
                <span className="ppb-group__name">
                  {cart.name}
                  {cart.isRiderSale && <FaMotorcycle className="ppb-group__rider-icon" />}
                </span>
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
              {/* Rider Selection Section */}
              <div className="ppb-rider-section">
                <FormCheck
                  type="checkbox"
                  id={`rider-sale-${activeCart.id}`}
                  label={
                    <span className="ppb-rider-label">
                      <FaMotorcycle className="ppb-rider-icon" />
                      Rider Sale (Delivery)
                    </span>
                  }
                  checked={activeCart.isRiderSale}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      clearRiderSelection(activeCart.id);
                    } else {
                      setCarts((prev) =>
                        prev.map((c) =>
                          c.id === activeCart.id
                            ? { ...c, isRiderSale: true }
                            : c
                        )
                      );
                    }
                  }}
                />

                {activeCart.isRiderSale && (
                  <div className="ppb-rider-select">
                    <label>Select Rider</label>
                    <Form.Select
                      value={activeCart.selectedRider?.id || ''}
                      onChange={(e) => handleRiderSelect(activeCart.id, e.target.value)}
                    >
                      <option value="">Choose a rider...</option>
                      {riders.map(rider => (
                        <option key={rider.id} value={rider.id}>
                          {rider.fullname} - Bal: {formatNaira(rider.current_balance)}
                        </option>
                      ))}
                    </Form.Select>

                    {activeCart.selectedRider && activeCart.riderCreditInfo && (
                      <div className="ppb-rider-credit-info">
                        <div className="ppb-credit-item">
                          <span>Credit Limit:</span>
                          <span className="ppb-credit-value">
                            {formatNaira(activeCart.riderCreditInfo.creditLimit)}
                          </span>
                        </div>
                        <div className="ppb-credit-item">
                          <span>Current Balance:</span>
                          <span className={`ppb-credit-value ${activeCart.riderCreditInfo.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
                            {formatNaira(activeCart.riderCreditInfo.currentBalance)}
                          </span>
                        </div>
                        <div className="ppb-credit-item">
                          <span>Available Credit:</span>
                          <span className={`ppb-credit-value ${activeCart.riderCreditInfo.availableCredit > 0 ? 'text-success' : 'text-danger'}`}>
                            {formatNaira(activeCart.riderCreditInfo.availableCredit)}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeCart.selectedRider && activeCart.items.length > 0 && (
                      <div className="ppb-rider-price-note">
                        <small className="text-muted">
                          * Rider-specific prices applied to eligible products
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* items list */}
              <div className="ppb-items">
                {activeCart.items.length ? (
                  activeCart.items.map((it) => {
                    const advantageAmount = activeCart.itemAdvantageAmounts[it.id] || 0;
                    const finalPrice = Number(it.price) + Number(advantageAmount);
                    
                    // Check if this is a rider-specific price
                    const isRiderPrice = it.price !== it.originalPrice && activeCart.isRiderSale;
                    
                    return (
                      <div className="ppb-item" key={it.id}>
                        <div className="ppb-item__main">
                          <div className="ppb-item__name">
                            {it.name}
                            {isRiderPrice && (
                              <Badge bg="info" className="ppb-rider-badge">
                                <FaMotorcycle /> Rider Price
                              </Badge>
                            )}
                          </div>
                          <div className="ppb-item__price">
                            {isRiderPrice ? (
                              <>
                                <span className="ppb-original-price">
                                  {formatNaira(it.originalPrice)}
                                </span>
                                {formatNaira(it.price)}
                              </>
                            ) : (
                              formatNaira(it.price)
                            )}
                            {advantageAmount > 0 && (
                              <Badge bg="success" className="ppb-advantage-badge">
                                +{formatNaira(advantageAmount)}
                              </Badge>
                            )}
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
                              disabled={it.quantity <= 1}
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
                                  parseInt(e.target.value || "1", 10)
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
                              disabled={it.quantity >= (inventory[it.id] || 0)}
                            >
                              <FaPlus />
                            </button>
                          </div>

                          <div className="ppb-line-total">
                            {formatNaira(finalPrice * Number(it.quantity))}
                          </div>
                        </div>

                        {/* Advantage Amount Input */}
                        {activeCart.isAdvantageSale && (
                          <div className="ppb-advantage-input">
                            <InputGroup size="sm">
                              <InputGroup.Text className="ppb-advantage-prefix">+₦</InputGroup.Text>
                              <FormControl
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Extra amount"
                                value={activeCart.itemAdvantageAmounts[it.id] || ''}
                                onChange={(e) => 
                                  updateAdvantageAmount(activeCart.id, it.id, e.target.value)
                                }
                                className="ppb-advantage-control"
                              />
                            </InputGroup>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="ppb-empty">
                    <span>No items yet</span>
                  </div>
                )}
              </div>

              {/* totals + options */}
              <div className="ppb-summary">
                {/* Advantage Sale Checkbox */}
                <div className="ppb-advantage-sale">
                  <FormCheck
                    type="checkbox"
                    id={`advantage-sale-${activeCart.id}`}
                    label={
                      <>
                        <FaCrown className="ppb-advantage-icon" />
                        Premium/Advantage Sale (Add Extra Amount)
                      </>
                    }
                    checked={activeCart.isAdvantageSale}
                    onChange={(e) =>
                      setCarts((prev) =>
                        prev.map((c) =>
                          c.id === activeCart.id
                            ? { 
                                ...c, 
                                isAdvantageSale: e.target.checked,
                                itemAdvantageAmounts: e.target.checked ? c.itemAdvantageAmounts : {}
                              }
                            : c
                        )
                      )
                    }
                  />
                  
                  {activeCart.isAdvantageSale && activeCart.items.length > 0 && (
                    <div className="ppb-advantage-hint">
                      <small>
                        Enter extra amounts for each item above. This will be added to the final price.
                      </small>
                    </div>
                  )}
                </div>

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
                      <FaTags className="ppb-opt-icon" /> Discount
                    </label>
                    <Form.Select
                      value={activeCart.discount || ""}
                      onChange={(e) =>
                        setCarts((prev) =>
                          prev.map((c) =>
                            c.id === activeCart.id
                              ? {
                                  ...c,
                                  discount: parseInt(e.target.value || 0, 10) || 0,
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
                    <label>Sale Date</label>
                    <FormControl
                      type="date"
                      value={saleDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSaleDate(e.target.value)}
                      required
                    />
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

                {/* Free Stock Section */}
                <div className="ppb-free-stock">
                  <FormCheck
                    type="checkbox"
                    id={`free-stock-${activeCart.id}`}
                    label={
                      <>
                        <FaGift className="ppb-free-stock-icon" />
                        Add Free Stock / Incentive
                      </>
                    }
                    checked={isFreeStockChecked}
                    onChange={(e) => setIsFreeStockChecked(e.target.checked)}
                  />

                  {isFreeStockChecked && activeCart.items.length > 0 && (
                    <div className="ppb-free-stock-content">
                      <label className="ppb-free-stock-label">Reason for Free Stock</label>
                      <FormControl
                        type="text"
                        placeholder="e.g., Promotion, Compensation, Incentive"
                        value={freeStockReason}
                        onChange={(e) => setFreeStockReason(e.target.value)}
                        className="ppb-free-stock-reason"
                      />

                      <label className="ppb-free-stock-label">Quantity Free (Cannot exceed quantity sold)</label>
                      {activeCart.items.map((item) => (
                        <InputGroup key={item.id} className="ppb-free-stock-item">
                          <InputGroup.Text className="ppb-free-stock-name">{item.name}</InputGroup.Text>
                          <FormControl
                            type="number"
                            min="0"
                            max={item.quantity}
                            placeholder={`Qty Free (Max: ${item.quantity})`}
                            value={freeStockQuantities[item.id] || ''}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              setFreeStockQuantities(prev => ({
                                ...prev,
                                [item.id]: Math.min(qty, item.quantity)
                              }));
                            }}
                            className="ppb-free-stock-qty"
                          />
                        </InputGroup>
                      ))}
                    </div>
                  )}
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
                        className={`ppb-seg__btn ${activeCart.payment.paymentMethod === opt.key
                          ? "ppb-seg__btn--active"
                          : ""
                        }`}
                        onClick={() =>
                          setCarts((prev) =>
                            prev.map((c) =>
                              c.id === activeCart.id
                                ? {
                                    ...c,
                                    payment: { ...emptyPayment(), paymentMethod: opt.key, customer: c.payment.customer },
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

                  {/* Customer selection — available for ALL payment methods (required for Credit, optional otherwise) */}
                  <div className="ppb-pay__fields">
                    <div className="ppb-opt">
                      <label>
                        <FaUser className="ppb-opt-icon" /> Customer
                        {activeCart.payment.paymentMethod !== "Credit" && (
                          <small className="ppb-muted"> (optional)</small>
                        )}
                      </label>
                      <Form.Select
                        value={activeCart.payment.customer?.id || ""}
                        onChange={(e) => {
                          const selected = selectableCustomers.find(
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
                                      walletAmount: "",
                                    },
                                  }
                                : c
                            )
                          );
                          if (selected) fetchWalletBalance("CUSTOMER", selected.id);
                        }}
                        disabled={activeCart.isRiderSale} // Rider sales use the rider instead of a customer
                      >
                        <option value="">Select customer…</option>
                        {selectableCustomers.map((cu) => (
                          <option key={cu.id} value={cu.id}>
                            {cu.fullname}
                          </option>
                        ))}
                      </Form.Select>

                      {activeCart.payment.customer && !activeCart.isRiderSale && (
                        <div className="ppb-customer-info">
                          Balance:{" "}
                          {formatNaira(activeCart.payment.customer.balance)} •
                          Limit:{" "}
                          {formatNaira(
                            activeCart.payment.customer.credit_limit
                          )}
                        </div>
                      )}

                      {activeCart.isRiderSale && activeCart.selectedRider && (
                        <div className="ppb-rider-info">
                          <div className="ppb-info-item">
                            <span>Rider:</span>
                            <strong>{activeCart.selectedRider.fullname}</strong>
                          </div>
                          <div className="ppb-info-item">
                            <span>Current Balance:</span>
                            <span className={activeCart.selectedRider.current_balance > 0 ? 'text-danger' : 'text-success'}>
                              {formatNaira(activeCart.selectedRider.current_balance)}
                            </span>
                          </div>
                          <div className="ppb-info-item">
                            <span>Credit Limit:</span>
                            <span>{formatNaira(activeCart.selectedRider.credit_limit)}</span>
                          </div>
                        </div>
                      )}
                    </div>
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
                            <FaFileUpload className="ppb-opt-icon" /> Receipt Image
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
                      {((activeCart.payment.customer && !activeCart.isRiderSale) || 
                        (activeCart.isRiderSale && activeCart.selectedRider)) && (
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
                              {" "}— Amount Paid includes any wallet balance used below.
                            </small>
                          </div>

                          <div className="ppb-opt">
                            <label>
                              <FaCalendarAlt className="ppb-opt-icon" /> Due Date
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

                  {/* Phase 5: advance wallet usage (customer or rider) */}
                  {activeWalletKey && (
                    <div className="ppb-wallet">
                      <div className="ppb-wallet__head">
                        <FaWallet className="ppb-opt-icon" />
                        <span>
                          Advance Wallet{activeWalletOwnerType === "RIDER" && activeCart.selectedRider
                            ? ` — ${activeCart.selectedRider.fullname}`
                            : activeCart.payment?.customer
                              ? ` — ${activeCart.payment.customer.fullname}`
                              : ""}
                        </span>
                        {activeWalletBalance != null && (
                          <b className="ppb-wallet__balance">{formatNaira(activeWalletBalance)}</b>
                        )}
                      </div>
                      {activeWalletBalance == null ? (
                        <small className="ppb-muted">
                          Advance wallet unavailable (setup pending).
                        </small>
                      ) : activeWalletBalance > 0 ? (
                        <>
                          <InputGroup size="sm">
                            <InputGroup.Text>₦</InputGroup.Text>
                            <FormControl
                              type="number"
                              min="0"
                              step="0.01"
                              max={activeWalletBalance}
                              placeholder="Amount to use from wallet"
                              value={activeCart.payment.walletAmount}
                              onChange={(e) =>
                                setCarts((prev) =>
                                  prev.map((c) =>
                                    c.id === activeCart.id
                                      ? { ...c, payment: { ...c.payment, walletAmount: e.target.value } }
                                      : c
                                  )
                                )
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() =>
                                setCarts((prev) =>
                                  prev.map((c) =>
                                    c.id === activeCart.id
                                      ? {
                                          ...c,
                                          payment: {
                                            ...c.payment,
                                            walletAmount: Math.min(
                                              activeWalletBalance,
                                              c.payment.paymentMethod === "Credit"
                                                ? Number(c.payment.amountPaid) || 0
                                                : c.total || 0
                                            ),
                                          },
                                        }
                                      : c
                                  )
                                )
                              }
                            >
                              Max
                            </Button>
                          </InputGroup>
                          <small className="ppb-muted">
                            {activeCart.payment.paymentMethod === "Credit"
                              ? "Wallet use counts toward Amount Paid; the unpaid rest becomes balance."
                              : "Wallet covers part of the total — only the remainder is collected in cash/bank."}
                          </small>
                        </>
                      ) : (
                        <small className="ppb-muted">No advance balance available.</small>
                      )}
                    </div>
                  )}

                  {/* Phase 5: split payment across methods (non-credit) */}
                  {activeCart.payment.paymentMethod !== "Credit" && (
                    <div className="ppb-split">
                      <FormCheck
                        type="checkbox"
                        id={`split-pay-${activeCart.id}`}
                        label={
                          <span className="ppb-split__label">
                            <FaLayerGroup className="ppb-opt-icon" />
                            Split payment across methods
                          </span>
                        }
                        checked={activeCart.payment.useSplit}
                        onChange={(e) =>
                          setCarts((prev) =>
                            prev.map((c) =>
                              c.id === activeCart.id
                                ? { ...c, payment: { ...c.payment, useSplit: e.target.checked } }
                                : c
                            )
                          )
                        }
                      />

                      {activeCart.payment.useSplit && (() => {
                        const walletAmt = Math.max(0, Number(activeCart.payment.walletAmount) || 0);
                        const realMoney = Math.max(0, (activeCart.total || 0) - walletAmt);
                        const splitTotal = (activeCart.payment.splits || [])
                          .reduce((s, x) => s + (Number(x.amount) || 0), 0);
                        const remaining = Math.round((realMoney - splitTotal) * 100) / 100;
                        return (
                          <div className="ppb-split__body">
                            {activeCart.payment.splits.map((split, idx) => (
                              <div className="ppb-split__row" key={idx}>
                                <Form.Select
                                  size="sm"
                                  value={split.method}
                                  onChange={(e) => updateSplit(activeCart.id, idx, "method", e.target.value)}
                                >
                                  {SPLIT_METHODS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </Form.Select>
                                <InputGroup size="sm">
                                  <InputGroup.Text>₦</InputGroup.Text>
                                  <FormControl
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Amount"
                                    value={split.amount}
                                    onChange={(e) => updateSplit(activeCart.id, idx, "amount", e.target.value)}
                                  />
                                </InputGroup>
                                <button
                                  type="button"
                                  className="ppb-split__remove"
                                  title="Remove method"
                                  onClick={() => removeSplitRow(activeCart.id, idx)}
                                  disabled={activeCart.payment.splits.length <= 1}
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="ppb-split__add"
                              onClick={() => addSplitRow(activeCart.id)}
                              disabled={activeCart.payment.splits.length >= SPLIT_METHODS.length}
                            >
                              + Add method
                            </Button>
                            <div className="ppb-split__summary">
                              <div className="ppb-split__line">
                                <span>To collect (cash/bank)</span>
                                <b>{formatNaira(realMoney)}</b>
                              </div>
                              <div className="ppb-split__line">
                                <span>Allocated</span>
                                <b>{formatNaira(splitTotal)}</b>
                              </div>
                              <div className={`ppb-split__line ${Math.abs(remaining) <= 0.01 ? "ppb-split__remaining--ok" : "ppb-split__remaining--bad"}`}>
                                <span>Remaining</span>
                                <b>{formatNaira(remaining)}</b>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant="outline-secondary"
                    onClick={() => saveCartAsDraft(activeCart)}
                    disabled={!activeCart.items.length || completingAll}
                    title="Save this group as a draft — it stays saved even if you reload or leave this page"
                  >
                    <FaSave /> Draft
                  </Button>
                  <Button
                    className="ppb-checkout"
                    style={{ flex: 1 }}
                    onClick={() => setConfirmSale({ type: "single", carts: [activeCart] })}
                    disabled={!activeCart.items.length || completingAll}
                  >
                    Complete Sale — {activeCart.name}
                  </Button>
                </div>
                {carts.filter((c) => c.items.length > 0).length > 1 && (
                  <Button
                    variant="success"
                    className="w-100"
                    style={{ marginTop: 8 }}
                    onClick={handleCompleteAll}
                    disabled={completingAll}
                  >
                    <FaCheckDouble />{" "}
                    {completingAll
                      ? "Completing groups…"
                      : `Complete All Groups (${carts.filter((c) => c.items.length > 0).length})`}
                  </Button>
                )}
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
                <FaFilter className="ppb-category-icon" />
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
              
              // Get price for display (show rider price if applicable)
              const displayPrice = activeCart?.isRiderSale && activeCart.selectedRider
                ? getProductPrice(p, activeCart)
                : p.price;
              
              const hasRiderPrice = displayPrice !== p.price;

              return (
                <div
                  key={p.id}
                  className={`ppb-product ${stock === 0 ? "ppb-product--oos" : ""}`}
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
                      <span className="ppb-price">
                        {hasRiderPrice && (
                          <small className="ppb-original-price-small">
                            {formatNaira(p.price)}
                          </small>
                        )}
                        {formatNaira(displayPrice)}
                        {hasRiderPrice && (
                          <Badge bg="info" className="ppb-rider-badge-small">
                            <FaMotorcycle />
                          </Badge>
                        )}
                      </span>
                    </div>
                    <Button
                      className="ppb-add"
                      disabled={stock <= 0}
                      onClick={() => addToCart(p, activeCartId)}
                    >
                      <FaCartPlus className="ppb-add-icon" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Confirmation dialog — review the full details before the sale is recorded */}
      <Modal
        show={!!confirmSale}
        onHide={() => { if (!processingConfirm) setConfirmSale(null); }}
        centered
        size="lg"
      >
        <Modal.Header closeButton={!processingConfirm}>
          <Modal.Title>
            {confirmSale?.type === "all"
              ? `Confirm ${confirmSale.carts.length} Sale(s)`
              : `Confirm Sale — ${confirmSale?.carts[0]?.name || ""}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ marginBottom: 10, color: "#374151", fontSize: 14 }}>
            Please check the full details below before confirming.
            {" "}Sale date: <b>{saleDate}</b>
          </p>
          {confirmSale?.carts.map((c) => {
            const t = getTotals(c);
            return (
              <div key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  {c.name}
                  {c.isRiderSale && <FaMotorcycle style={{ color: "#7c3aed" }} />}
                </div>
                <div style={{ fontSize: 13, color: "#374151", marginTop: 2 }}>
                  {c.isRiderSale && c.selectedRider
                    ? `Rider: ${c.selectedRider.fullname}`
                    : c.payment.customer
                      ? `Customer: ${c.payment.customer.fullname}`
                      : "Customer: Walk-in (none)"}
                  {" · "}Payment: {c.payment.useSplit ? "Split" : c.payment.paymentMethod}
                  {c.payment.paymentMethod === "Credit" && (
                    <>
                      {" · "}Paid: {formatNaira(c.payment.amountPaid || 0)}
                      {" · "}Due: {c.payment.dueDate || "—"}
                    </>
                  )}
                </div>
                {c.payment.useSplit && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Splits: {(c.payment.splits || [])
                      .filter((s) => Number(s.amount) > 0)
                      .map((s) => `${s.method} ${formatNaira(s.amount)}`)
                      .join(", ") || "—"}
                  </div>
                )}
                {Number(c.payment.walletAmount) > 0 && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Advance wallet used: {formatNaira(c.payment.walletAmount)}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  {c.items.map((it) => {
                    const adv = Number(c.itemAdvantageAmounts[it.id]) || 0;
                    return (
                      <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
                        <span>
                          {it.name} × {it.quantity}
                          {adv > 0 ? ` (+${formatNaira(adv)} adv.)` : ""}
                        </span>
                        <b>{formatNaira((Number(it.price) + adv) * Number(it.quantity))}</b>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px dashed #e5e7eb", marginTop: 6, paddingTop: 6, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal</span><b>{formatNaira(t.subtotal)}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Discount</span><b>- {formatNaira(t.discountAmount)}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Tax</span><b>{formatNaira(t.tax)}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                    <span>Total</span><b>{formatNaira(t.total)}</b>
                  </div>
                </div>
                {c.note ? (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    Note: {c.note}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setConfirmSale(null)}
            disabled={processingConfirm}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={processConfirmedSales}
            disabled={processingConfirm}
          >
            {processingConfirm
              ? "Processing…"
              : confirmSale?.type === "all"
                ? `Confirm All (${confirmSale.carts.length})`
                : "Confirm Sale"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewSalePage;
