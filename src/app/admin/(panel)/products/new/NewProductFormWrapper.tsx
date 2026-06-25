"use client";

// Thin client wrapper that binds the shared ProductForm to the
// createProduct server action. The category options come in from the
// page-level server component so the form stays a pure client.

import { ProductForm, type CategoryOption } from "@/components/admin/ProductForm";
import { createProduct } from "../actions";

export function NewProductFormWrapper({
  categoryOptions,
}: {
  categoryOptions: CategoryOption[];
}) {
  return (
    <ProductForm
      mode="create"
      categoryOptions={categoryOptions}
      onSubmit={createProduct}
      redirectTo={(id) => (id ? `/admin/products/${id}` : "/admin/products")}
    />
  );
}
