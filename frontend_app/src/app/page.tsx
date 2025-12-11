"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getAuthToken().then(token => {
      if (token) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  return null;
}
