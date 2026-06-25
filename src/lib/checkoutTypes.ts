// Shared checkout types — used by /checkout, the financing store, and
// the cart drawer to describe the customer's input. Lives outside the
// localStorage stores so deleting / migrating any individual store
// doesn't take these types with it.

export type OrderItemSnapshot = {
  slug: string;
  name: string;
  subline?: string;
  qty: number;
  unitPrice: number; // MAD whole units
  lineTotal: number; // MAD whole units
};

export type OrderContact = {
  fullName: string;
  email: string;
  phone: string;
};

export type OrderCompany = {
  name: string;
  ice?: string;
};

export type OrderShipping = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export type OrderTotals = {
  itemCount: number;
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
};

export type OrderPaymentMethod = "cmi" | "wafasalaf" | "wire-transfer";

// Re-export under the old names for back-compat with financingStore.
export type { OrderItemSnapshot as OrderItem };
