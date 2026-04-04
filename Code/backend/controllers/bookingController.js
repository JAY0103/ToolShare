// controllers/bookingController.js
const BorrowRequest       = require("../models/BorrowRequest");
const Item                = require("../models/Item");
const Category            = require("../models/Category");
const { notify }          = require("../services/notificationService");
const emailService        = require("../services/emailService");
const { autoMarkOverdue } = require("../services/overdueScheduler");
const { isAdmin, isStaff } = require("../middleware/auth");
const { query }           = require("../config/database");

const bookingController = {
  bookItem: async (req, res) => {
    const { item_id, requested_start, requested_end, reason } = req.body;
    const borrower_id = req.user.userId;

    if (!item_id || !requested_start || !requested_end || !reason)
      return res.status(400).json({ error: "All fields are required." });

    const start = new Date(requested_start);
    const end   = new Date(requested_end);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return res.status(400).json({ error: "Invalid date format." });
    if (end <= start)
      return res.status(400).json({ error: "End time must be after start time." });

    try {
      await autoMarkOverdue();

      const item = await Item.findById(item_id);
      if (!item) return res.status(404).json({ error: "Item not found" });

      const bulkCat  = await Category.findByName("Bulk Items");
      const status   = item.category_id === bulkCat?.category_id ? "Approved" : "Pending";

      const conflict = await BorrowRequest.hasConflict(item_id, requested_start, requested_end);
      if (conflict) return res.status(409).json({ error: "This item is already booked for the selected time range." });

      const result = await BorrowRequest.create({
        item_id, borrower_id, requested_start, requested_end, reason, status,
      });

      res.status(201).json({
        message:   `Booking ${status === "Approved" ? "approved" : "submitted"} successfully!`,
        bookingId: result.insertId,
        status,
      });
    } catch (err) {
      console.error("Booking error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  requestGroup: async (req, res) => {
    const borrower_id = req.user.userId;
    const { reason, items } = req.body;

    if (!reason || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "reason and items[] are required." });

    try {
      await autoMarkOverdue();

      const borrowerRows = await query(
        "SELECT first_name, last_name, username FROM users WHERE user_id=? LIMIT 1",
        [borrower_id]
      );
      const b            = borrowerRows[0] || {};
      const borrowerName = `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.username || "A student";

      const group_id  = await BorrowRequest.createGroup(borrower_id, reason);
      const created   = [];
      const failed    = [];
      const ownerAgg  = new Map();

      for (const it of items) {
        const item_id         = Number(it?.item_id);
        const requested_start = it?.requested_start;
        const requested_end   = it?.requested_end;

        if (!item_id || !requested_start || !requested_end) {
          failed.push({ item_id: it?.item_id || null, error: "Missing item_id/requested_start/requested_end" });
          continue;
        }

        const s = new Date(requested_start);
        const e = new Date(requested_end);
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
          failed.push({ item_id, error: "Invalid date range" });
          continue;
        }

        const itemMeta = await Item.findById(item_id);
        if (!itemMeta) { failed.push({ item_id, error: "Item not found" }); continue; }

        if (Number(itemMeta.owner_id) === Number(borrower_id)) {
          failed.push({ item_id, error: "You cannot request your own item" });
          continue;
        }

        const conflict = await BorrowRequest.hasConflict(item_id, requested_start, requested_end);
        if (conflict) { failed.push({ item_id, error: "Item already booked for that time range" }); continue; }

        const currentTotal = (await BorrowRequest.countActiveByBorrower(borrower_id)) + created.length;
        if (currentTotal >= 5) { failed.push({ item_id, error: "Booking limit reached" }); continue; }

        const cat    = await Category.findById(itemMeta.category_id);
        const status = cat?.auto_approve ? "Approved" : "Pending";

        const ins = await BorrowRequest.create({
          borrower_id, item_id, requested_start, requested_end, reason, status, request_group_id: group_id,
        });

        created.push({ request_id: ins.insertId, item_id, item_name: itemMeta.name });

        const ownerId = itemMeta.owner_id;
        if (!ownerAgg.has(ownerId)) ownerAgg.set(ownerId, { count: 0, itemNames: [] });
        ownerAgg.get(ownerId).count += 1;
        ownerAgg.get(ownerId).itemNames.push(itemMeta.name);
      }

      if (!created.length)
        return res.status(409).json({ error: "No items could be requested (all failed).", failed_items: failed });

      for (const [ownerId, agg] of ownerAgg.entries()) {
        const sample = agg.itemNames.slice(0, 3).join(", ");
        const more   = agg.itemNames.length > 3 ? ` +${agg.itemNames.length - 3} more` : "";
        notify(ownerId, "New basket request", `${borrowerName} requested ${agg.count} item(s): ${sample}${more}`, "request");
      }

      res.json({ message: "Basket request submitted", request_group_id: group_id, created_requests: created, failed_items: failed });
    } catch (err) {
      console.error("request-group error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getMyBookings: async (req, res) => {
    try {
      await autoMarkOverdue();
      const requests = await BorrowRequest.getByBorrower(req.user.userId);
      res.json({ requests });
    } catch (err) {
      console.error("my-requests error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getItemRequests: async (req, res) => {
    try {
      await autoMarkOverdue();
      if (!isStaff(req)) return res.status(403).json({ error: "Forbidden" });

      const requests = isAdmin(req)
        ? await BorrowRequest.getAll()
        : await BorrowRequest.getByOwner(req.user.userId);

      res.json({ requests });
    } catch (err) {
      console.error("item-requests error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getOwnerItems: async (req, res) => {
    try {
      const items = isAdmin(req)
        ? await Item.getAllForAdmin()
        : await Item.getByOwner(req.user.userId);
      res.json({ items });
    } catch (err) {
      console.error("owner items error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getOwnerBookingHistory: async (req, res) => {
    try {
      await autoMarkOverdue();
      const { search, status, from, to, item_id } = req.query;
      const requests = await BorrowRequest.getOwnerHistory({
        owner_id: req.user.userId,
        isAdmin:  isAdmin(req),
        search, status, from, to, item_id,
      });
      res.json({ requests });
    } catch (err) {
      console.error("owner booking history error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  updateRequestStatus: async (req, res) => {
    const { request_id, status, decision_note } = req.body;

    if (!request_id || !status) return res.status(400).json({ error: "request_id and status are required." });
    if (decision_note && String(decision_note).length > 500)
      return res.status(400).json({ error: "Decision note too long (max 500 chars)." });
    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ error: "This endpoint supports only Approved or Rejected." });

    try {
      await autoMarkOverdue();

      const r = await BorrowRequest.findById(request_id);
      if (!r) return res.status(404).json({ error: "Request not found" });

      if (!isAdmin(req) && Number(r.owner_id) !== Number(req.user.userId))
        return res.status(403).json({ error: "Not allowed" });
      if (r.current_status !== "Pending")
        return res.status(409).json({ error: `Cannot change status from ${r.current_status}.` });

      if (status === "Approved") {
        const conflict = await BorrowRequest.hasConflict(r.item_id, r.requested_end, r.requested_start, request_id);
        if (conflict)
          return res.status(409).json({ error: "Cannot approve. This item is already booked for an overlapping time range." });
      }

      await BorrowRequest.updateStatus(request_id, status, decision_note || null);

      if (status === "Approved") {
        notify(r.borrower_id, "Request approved", `Your request for "${r.item_name}" was approved.`, "approved");
        emailService.sendApproved(r.borrower_email, r.item_name).catch(console.error);
      } else {
        const note = decision_note ? ` Note: ${decision_note}` : "";
        notify(r.borrower_id, "Request rejected", `Your request for "${r.item_name}" was rejected.${note}`, "rejected");
        emailService.sendRejected(r.borrower_email, r.item_name, note).catch(console.error);
      }

      res.json({ message: "Request status updated successfully." });
    } catch (err) {
      console.error("request-status error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  cancelRequest: async (req, res) => {
    const { request_id } = req.body;
    if (!request_id) return res.status(400).json({ error: "request_id is required" });

    try {
      await autoMarkOverdue();

      const r = await BorrowRequest.findById(request_id);
      if (!r) return res.status(404).json({ error: "Request not found" });

      if (!isAdmin(req) && Number(r.borrower_id) !== Number(req.user.userId))
        return res.status(403).json({ error: "Not allowed" });
      if (r.status === "Cancelled") return res.json({ message: "Request already cancelled." });
      if (!["Pending", "Approved"].includes(r.status))
        return res.status(409).json({ error: `Cannot cancel. Current status is ${r.status}.` });

      await BorrowRequest.updateStatus(request_id, "Cancelled");
      notify(r.owner_id,    "Request cancelled", `A student cancelled their request for "${r.item_name}".`, "cancelled");
      notify(r.borrower_id, "Request cancelled", `You cancelled your request for "${r.item_name}".`,        "cancelled");

      res.json({ message: "Request cancelled successfully." });
    } catch (err) {
      console.error("request-cancel error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  checkoutRequest: async (req, res) => {
    const { request_id } = req.body;
    if (!request_id) return res.status(400).json({ error: "request_id is required" });

    try {
      await autoMarkOverdue();

      const r = await BorrowRequest.findById(request_id);
      if (!r) return res.status(404).json({ error: "Request not found" });

      if (!isAdmin(req) && Number(r.owner_id) !== Number(req.user.userId))
        return res.status(403).json({ error: "Not allowed" });
      if (r.status !== "Approved")
        return res.status(409).json({ error: `Cannot checkout. Current status is ${r.status}.` });

      await BorrowRequest.setCheckedOut(request_id);
      notify(r.borrower_id, "Item checked out", `Your booking for "${r.item_name}" has been checked out.`, "checkedout");
      emailService.sendCheckedOut(r.borrower_email, r.item_name).catch(console.error);

      res.json({ message: "Checked out successfully" });
    } catch (err) {
      console.error("request-checkout error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  returnRequest: async (req, res) => {
    const { request_id } = req.body;
    if (!request_id) return res.status(400).json({ error: "request_id is required" });

    try {
      await autoMarkOverdue();

      const r = await BorrowRequest.findById(request_id);
      if (!r) return res.status(404).json({ error: "Request not found" });

      if (!isAdmin(req) && Number(r.owner_id) !== Number(req.user.userId))
        return res.status(403).json({ error: "Not allowed" });
      if (!["CheckedOut", "Overdue"].includes(r.status))
        return res.status(409).json({ error: `Cannot return. Current status is ${r.status}.` });

      await BorrowRequest.setReturned(request_id);
      notify(r.borrower_id, "Item returned", `Your booking for "${r.item_name}" has been marked returned.`, "returned");
      emailService.sendReturned(r.borrower_email, r.item_name).catch(console.error);

      res.json({ message: "Returned successfully" });
    } catch (err) {
      console.error("request-return error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getOverdueRequests: async (req, res) => {
    try {
      await autoMarkOverdue();
      const requests = await BorrowRequest.getOverdue(isAdmin(req), req.user.userId);
      res.json({ requests });
    } catch (err) {
      console.error("overdue-requests error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = bookingController;
