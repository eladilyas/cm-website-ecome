"use client";

import { CategoryForm } from "@/components/admin/CategoryForm";
import { createCategory } from "../actions";

export function NewCategoryWrapper() {
  return (
    <CategoryForm
      mode="create"
      onSubmit={createCategory}
      redirectTo={(id) =>
        id ? `/admin/categories/${id}` : "/admin/categories"
      }
    />
  );
}
