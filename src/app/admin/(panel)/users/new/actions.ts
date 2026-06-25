"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLES, type RoleSlug } from "@/server/rbac/catalog";

const Input = z.object({
  fullName: z.string().min(1, "Full name is required").max(120),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleSlugs: z.array(
    z.enum(ROLES.map((r) => r.slug) as [RoleSlug, ...RoleSlug[]]),
  ),
});

export async function createUser(
  input: z.infer<typeof Input>,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  await requireSuperAdmin("/admin/users/new");

  const parsed = Input.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { fullName, email, password, roleSlugs } = parsed.data;

  try {
    // Better-Auth's server-side sign-up creates the User + Account
    // (with password) atomically. The body shape is wider than the
    // generated zod intersection because `fullName` is an
    // additionalField — Better-Auth's runtime accepts it, but the TS
    // generic only models the static keys, so we cast the whole arg.
    const signupRes = (await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
        // Additional field declared in src/server/auth.ts.
        fullName,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as { user?: { id: string } } | Response;

    const userId =
      "user" in signupRes ? signupRes.user?.id : undefined;
    if (!userId) {
      return {
        ok: false,
        error: "Sign-up succeeded but no user id returned. Check server logs.",
      };
    }

    // Assign requested roles in one transaction.
    if (roleSlugs.length > 0) {
      const roles = await db.role.findMany({
        where: { slug: { in: roleSlugs } },
      });
      await db.userRole.createMany({
        data: roles.map((r) => ({ userId, roleId: r.id })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/users");
    return { ok: true, userId };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to create user. Check the dev console.";
    return { ok: false, error: msg };
  }
}
