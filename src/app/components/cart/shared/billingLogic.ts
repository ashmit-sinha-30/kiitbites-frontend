import { CartItem, OrderType } from "../../../cart/types";

export type Charges = {
  packingCharge: number | null;
  deliveryCharge: number | null;
  platformFee: number | null;
};

export type VendorDeliverySettings = {
  offersDelivery: boolean;
  deliveryPreparationTime: number;
};

export type BillingFetcher = (url: string) => Promise<Record<string, unknown> | null | undefined>;

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function readString(obj: Record<string, unknown> | null, key: string): string | undefined {
  const v = obj?.[key];
  return typeof v === "string" && v ? v : undefined;
}

function readNumberish(obj: Record<string, unknown> | null, key: string): number | null {
  const v = obj?.[key];
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export const defaultCharges: Charges = {
  packingCharge: null,
  deliveryCharge: null,
  platformFee: null,
};

export async function fetchBillingContext(
  userId: string,
  get: BillingFetcher,
): Promise<{ charges: Charges; vendorDeliverySettings: VendorDeliverySettings }> {
  const cartRaw = await get(`/cart/${userId}`);
  const cart = asRecord(cartRaw);
  const vendorId = readString(cart, "vendorId");

  if (!vendorId) {
    return {
      charges: defaultCharges,
      vendorDeliverySettings: { offersDelivery: true, deliveryPreparationTime: 30 },
    };
  }

  let vendorDeliverySettings: VendorDeliverySettings = {
    offersDelivery: true,
    deliveryPreparationTime: 30,
  };

  try {
    const deliverySettingsRaw = await get(`/api/vendor/${vendorId}/delivery-settings`);
    const deliverySettings = asRecord(deliverySettingsRaw);
    if (deliverySettings && deliverySettings["success"] && deliverySettings["data"]) {
      const data = asRecord(deliverySettings["data"]);
      if (data) {
        const prep = data.deliveryPreparationTime;
        vendorDeliverySettings = {
          offersDelivery: data.offersDelivery === true,
          deliveryPreparationTime:
            typeof prep === "number" && Number.isFinite(prep) ? prep : vendorDeliverySettings.deliveryPreparationTime,
        };
      }
    }
  } catch {
    // Keep default fallback settings.
  }

  const vendorRaw = await get(`/api/item/getvendors/${vendorId}`);
  const vendor = asRecord(vendorRaw);
  const uniID = readString(vendor, "uniID");
  if (!uniID) {
    return { charges: defaultCharges, vendorDeliverySettings };
  }

  const chargesRaw = await get(`/api/university/charges/${uniID}`);
  const charges = asRecord(chargesRaw);
  return {
    charges: {
      packingCharge: readNumberish(charges, "packingCharge"),
      deliveryCharge: readNumberish(charges, "deliveryCharge"),
      platformFee: readNumberish(charges, "platformFee"),
    },
    vendorDeliverySettings,
  };
}

export function getPackableItems(items: CartItem[]): CartItem[] {
  return items.filter((item) => {
    if (item.category === "Produce") return true;
    return item.packable === true;
  });
}

export function hasNonPackableProduce(items: CartItem[]): boolean {
  return items.some((item) => item.category === "Produce" && item.packable === false);
}

export function calculateBillTotals(items: CartItem[], orderType: OrderType, charges: Charges) {
  const packableItems = getPackableItems(items);
  const packingCharge = charges.packingCharge ?? 5;
  const deliveryCharge = charges.deliveryCharge ?? 50;
  const platformFee = charges.platformFee ?? 2;
  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const packaging =
    orderType !== "dinein"
      ? packableItems.reduce((sum, item) => sum + packingCharge * item.quantity, 0)
      : 0;
  const delivery = orderType === "delivery" ? deliveryCharge : 0;
  const grandTotal = itemTotal + packaging + delivery + platformFee;

  return {
    packableItems,
    packingCharge,
    deliveryCharge,
    platformFee,
    itemTotal,
    packaging,
    delivery,
    grandTotal,
  };
}
