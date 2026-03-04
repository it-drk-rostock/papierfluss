"use client";

import { useEffect } from "react";
import * as Swetrix from "swetrix";

export default function Analytics() {
  useEffect(() => {
    Swetrix.init(process.env.NEXT_PUBLIC_SWETRIX_PID!, {
      apiURL: process.env.NEXT_PUBLIC_SWETRIX_API_URL,
    });
    Swetrix.trackViews();
    Swetrix.trackErrors();
  }, []);

  return null;
}
