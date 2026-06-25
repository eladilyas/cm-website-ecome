"use client";

import { CategoryForm } from "@/components/admin/CategoryForm";
import {
  updateCategory,
  type CategoryInputT,
} from "../actions";

export function EditCategoryWrapper({
  id,
  initial,
}: {
  id: string;
  initial: CategoryInputT;
}) {
  return (
    <CategoryForm
      mode="edit"
      initial={initial}
      onSubmit={(v) => updateCategory(id, v)}
      redirectTo={() => `/admin/categories/${id}`}
    />
  );
}
