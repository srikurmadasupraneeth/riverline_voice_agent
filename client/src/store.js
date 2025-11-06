import { useState, useEffect } from "react";
import { fetchBorrowers } from "./api";

export function useBorrowers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchBorrowers()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
