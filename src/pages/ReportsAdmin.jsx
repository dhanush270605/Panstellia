import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

function safeToDate(value) {
  try {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function matchesText(haystack, needle) {
  if (!needle) return true;
  const h = (haystack || '').toString().toLowerCase();
  const n = needle.toString().toLowerCase();
  return h.includes(n);
}


function formatINR(value) {
  try {
    const num = Number(value || 0);
    return `₹${num.toLocaleString('en-IN')}`;
  } catch {
    return '—';
  }
}

function safeString(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v.toString();
  return '';
}

export default function ReportsAdmin() {
  const { user, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    paymentMode: 'All',
    city: 'All',
    from: '',
    to: '',
    minValue: '',
    maxValue: '',
  });

  const resetFilters = () => {
    setFilters({
      search: '',
      paymentMode: 'All',
      city: 'All',
      from: '',
      to: '',
      minValue: '',
      maxValue: '',
    });
  };


  useEffect(() => {
    if (!user || !isAdmin) return;

    let cancelled = false;

    async function fetchOrdersAndBuildRows() {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        const built = [];

        snap.docs.forEach((doc) => {
          const order = doc.data() || {};
          const customerName = safeString(order.customerName || order.name || order.fullName);
          const mobNo = safeString(order.phone || order.mobile || order.customerPhone);

          const address = order.address;
          const city = order.city;
          const state = order.state;
          const pincode = order.pincode;

          const orderId = safeString(order.orderId || order.order_id || order.paymentId || doc.id);
          const paymentMode = safeString(order.paymentMethod);
          const customerMail = safeString(order.email || order.customerEmail);

          const grossSaleValue = Array.isArray(order.items)
            ? order.items.reduce((sum, it) => sum + Number(it?.price || 0) * Number(it?.quantity || 0), 0)
            : 0;
          const netSalesValue = grossSaleValue;
          const averageSellingPrice = (() => {
            const totalQty = Array.isArray(order.items)
              ? order.items.reduce((sum, it) => sum + Number(it?.quantity || 0), 0)
              : 0;
            return totalQty > 0 ? grossSaleValue / totalQty : 0;
          })();

          const items = Array.isArray(order.items) ? order.items : [];

          // If an order has no items, skip (report requirement is ordered product name + quantities)
          items.forEach((item, idx) => {
            const orderedProductName = safeString(item?.name);
            const ppu = Number(item?.price || 0);
            const qty = Number(item?.quantity || 0);
            const value = ppu * qty;

            built.push({
              id: `${doc.id}_${idx}`,
              createdAt: order?.createdAt,
              orderId,

              netSalesValue,
              grossSaleValue,
              averageSellingPrice,
              paymentMode,
              customerMail,

              customerName,
              mobNo,
              orderedProductName,
              ppu,
              qty,
              value,

              address: safeString(address),
              city: safeString(city),
              state: safeString(state),
              pincode: safeString(pincode),
            });
          });
        });

        if (!cancelled) setRows(built);
      } catch (e) {
        console.error('Failed to fetch orders for reports:', e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrdersAndBuildRows();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const filteredRows = useMemo(() => {
    const fromDate = safeToDate(filters.from);
    const toDate = safeToDate(filters.to);

    const minValue = filters.minValue !== '' ? Number(filters.minValue) : null;
    const maxValue = filters.maxValue !== '' ? Number(filters.maxValue) : null;

    return rows.filter((r) => {
      if (filters.paymentMode !== 'All' && (r.paymentMode || '') !== filters.paymentMode) return false;
      if (filters.city !== 'All' && (r.city || '') !== filters.city) return false;

      if (!matchesText(
        [
          r.orderId,
          r.customerName,
          r.mobNo,
          r.customerMail,
          r.paymentMode,
          r.orderedProductName,
          r.address,
          r.city,
          r.state,
          r.pincode,
        ].join(' '),
        filters.search
      )) {
        return false;
      }

      const d = safeToDate(r.createdAt);
      if (fromDate && (!d || d < fromDate)) return false;
      if (toDate) {
        const inclusiveTo = new Date(toDate);
        inclusiveTo.setHours(23, 59, 59, 999);
        if (!d || d > inclusiveTo) return false;
      }

      const val = Number(r.value || 0);
      if (minValue !== null && val < minValue) return false;
      if (maxValue !== null && val > maxValue) return false;

      return true;
    });
  }, [rows, filters]);

  const stats = useMemo(() => {
    const totalOrders = 0; // not strict; rows already flattened
    const totalValue = filteredRows.reduce((sum, r) => sum + Number(r.value || 0), 0);
    return { totalOrders, totalRows: filteredRows.length, totalValue };
  }, [filteredRows]);


  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-luxury-900 mb-2">Reports</h2>
        <p className="text-luxury-600">Flat report of ordered items with customer + address details</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="block text-sm text-luxury-500 mb-1">Search</label>
            <input
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Order ID, customer, product, city..."
              className="w-full px-3 py-2 border border-luxury-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 flex-1">
            <div>
              <label className="block text-sm text-luxury-500 mb-1">Payment</label>
              <select
                value={filters.paymentMode}
                onChange={(e) => setFilters((p) => ({ ...p, paymentMode: e.target.value }))}
                className="w-full px-3 py-2 border border-luxury-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="All">All</option>
                {Array.from(new Set(rows.map((r) => r.paymentMode).filter(Boolean))).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-luxury-500 mb-1">City</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2 border border-luxury-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="All">All</option>
                {Array.from(new Set(rows.map((r) => r.city).filter(Boolean))).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-luxury-500 mb-1">From</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                className="w-full px-3 py-2 border border-luxury-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm text-luxury-500 mb-1">To</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                className="w-full px-3 py-2 border border-luxury-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 flex-1">
            <div>
              <label className="block text-sm text-luxury-500 mb-1">Min Value</label>
              <input
                value={filters.minValue}
                onChange={(e) => setFilters((p) => ({ ...p, minValue: e.target.value }))}
                placeholder="0"
                inputMode="numeric"
                className="w-full px-3 py-2 border border-luxury-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm text-luxury-500 mb-1">Max Value</label>
              <input
                value={filters.maxValue}
                onChange={(e) => setFilters((p) => ({ ...p, maxValue: e.target.value }))}
                placeholder=""
                inputMode="numeric"
                className="w-full px-3 py-2 border border-luxury-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="hidden md:block" />
            <div className="flex md:justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg border border-luxury-200 text-luxury-700 hover:bg-luxury-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-luxury-500">
          Showing <span className="font-medium text-luxury-700">{filteredRows.length}</span> rows
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-luxury-500">Rows</p>
          <p className="text-2xl font-bold text-luxury-900">{stats.totalRows}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 md:col-span-2">
          <p className="text-sm text-luxury-500">Total value (sum of item values)</p>
          <p className="text-2xl font-bold text-luxury-900">{formatINR(stats.totalValue)}</p>
        </div>
      </div>

      {loading ? (

        <div className="bg-white rounded-xl shadow-md p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-luxury-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Customer Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Mob No</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Customer Mail</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Payment Mode</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Ordered Product Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">PPU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Net Sales Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Gross Sale Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Average Selling Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 min-w-[260px]">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap min-w-[120px]">City</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">State</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-luxury-700 whitespace-nowrap">Pincode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="px-4 py-10 text-center text-luxury-600">
                      No report rows found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (


                    <tr key={r.id}>
                      <td className="px-4 py-3">{r.orderId || '—'}</td>
                      <td className="px-4 py-3">{r.customerName || '—'}</td>
                      <td className="px-4 py-3">{r.mobNo || '—'}</td>
                      <td className="px-4 py-3">{r.customerMail || '—'}</td>
                      <td className="px-4 py-3">{r.paymentMode || '—'}</td>
                      <td className="px-4 py-3 text-luxury-900">{r.orderedProductName || '—'}</td>
                      <td className="px-4 py-3 text-luxury-900">{r.qty || 0}</td>
                      <td className="px-4 py-3 text-luxury-900">{formatINR(r.ppu)}</td>
                      <td className="px-4 py-3 text-luxury-900 font-medium">{formatINR(r.value)}</td>
                      <td className="px-4 py-3">{formatINR(r.netSalesValue)}</td>
                      <td className="px-4 py-3">{formatINR(r.grossSaleValue)}</td>
                      <td className="px-4 py-3">{formatINR(r.averageSellingPrice)}</td>
                      <td className="px-4 py-3 min-w-[260px]">{r.address || '—'}</td>
                      <td className="px-4 py-3 min-w-[120px] whitespace-nowrap">{r.city || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.state || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.pincode || '—'}</td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

