const MS_DAY = 86400000;

function getProductId(item) {
  return (
    item?.product?._id?.toString?.() ||
    item?.product?.toString?.() ||
    null
  );
}

function getOrderProductId(order) {
  return (
    order?.product?._id?.toString?.() ||
    order?.product?.toString?.() ||
    null
  );
}

function getOrderQuantity(order) {
  return Number(order.totalQuantity) || Number(order.quantity) || 1;
}

export function computeWarehouseProductTrends(items = [], orders = []) {
  const warehouseProductIds = new Set(
    items.map(getProductId).filter(Boolean)
  );

  if (!warehouseProductIds.size) {
    return { growing: 0, declining: 0, isDemo: false };
  }

  const now = Date.now();
  const last30Start = now - 30 * MS_DAY;
  const prev30Start = now - 60 * MS_DAY;

  const last30 = new Map();
  const prev30 = new Map();

  orders.forEach((order) => {
    const productId = getOrderProductId(order);
    if (!productId || !warehouseProductIds.has(productId)) return;

    const ts = new Date(order.createdAt || order.updatedAt).getTime();
    if (Number.isNaN(ts)) return;

    const qty = getOrderQuantity(order);

    if (ts >= last30Start) {
      last30.set(productId, (last30.get(productId) || 0) + qty);
    } else if (ts >= prev30Start) {
      prev30.set(productId, (prev30.get(productId) || 0) + qty);
    }
  });

  const trackedIds = new Set([...last30.keys(), ...prev30.keys()]);

  if (!trackedIds.size) {
    return {
      growing: Math.min(4, Math.max(1, Math.round(items.length * 0.12))),
      declining: Math.min(3, Math.max(1, Math.round(items.length * 0.08))),
      isDemo: true,
    };
  }

  let growing = 0;
  let declining = 0;

  trackedIds.forEach((productId) => {
    const current = last30.get(productId) || 0;
    const previous = prev30.get(productId) || 0;

    if (current > previous && current > 0) {
      growing += 1;
    } else if (previous > 0 && current < previous) {
      declining += 1;
    }
  });

  return { growing, declining, isDemo: false };
}
