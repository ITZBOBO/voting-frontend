"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (isAdmin()) {
      router.replace("/admin");
    } else {
      router.replace("/vote");
    }
  }, [isAuthenticated, isAdmin, router]);

  return (
    <div className="loading-page" style={{ minHeight: "100vh" }}>
      <div className="spinner spinner-lg" />
    </div>
  );
}
