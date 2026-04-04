// src/hooks/useBookings.js
import { useState, useCallback } from "react";
import { bookingsService } from "../services/api";

/**
 * Reusable hook for booking list pages.
 * Usage:
 *   const { bookings, loading, error, refresh } = useBookings("my");
 *   // type: "my" | "owner" | "history"
 */
export function useBookings(type = "my", historyParams = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (type === "my")      data = await bookingsService.getMyBookings();
      else if (type === "owner")   data = await bookingsService.getRequestedBookings();
      else if (type === "history") data = await bookingsService.getOwnerBookingHistory(historyParams);
      else data = [];
      setBookings(data);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [type, JSON.stringify(historyParams)]); // eslint-disable-line

  return { bookings, loading, error, refresh, setBookings };
}
