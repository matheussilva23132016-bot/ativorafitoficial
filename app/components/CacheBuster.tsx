"use client";

import { useEffect } from "react";

export const CacheBuster = () => {
  useEffect(() => {
    localStorage.setItem("ativora_cache_version", "v1");
  }, []);

  return null;
};
