"use client";

import {
  ProductForm,
  type CategoryOption,
  type ProductFormInitial,
} from "@/components/admin/ProductForm";
import { updateProduct } from "../actions";

export function EditProductFormWrapper({
  id,
  initial,
  categoryOptions,
}: {
  id: string;
  initial: ProductFormInitial;
  categoryOptions: CategoryOption[];
}) {
  return (
    <ProductForm
      mode="edit"
      initial={initial}
      categoryOptions={categoryOptions}
      onSubmit={(v) => updateProduct(id, v)}
      redirectTo={() => `/admin/products/${id}`}
    />
  );
}
