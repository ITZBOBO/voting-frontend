"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./authStore";

export function useRouteGuard(requiredRole?: "admin" | "voter") {
  const router = useRouter();
  const { isAuthenticated, isAdmin, hasRole } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole === "admin" && !isAdmin()) {
      router.replace("/vote");
      return;
    }

    if (requiredRole === "voter" && isAdmin()) {
      router.replace("/admin");
      return;
    }
  }, [isAuthenticated, requiredRole, router, isAdmin, hasRole]);

  return { isAuthenticated, isAdmin: isAdmin() };
}
