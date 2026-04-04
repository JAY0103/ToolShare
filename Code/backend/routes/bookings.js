// routes/bookings.js
const express           = require("express");
const router            = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken } = require("../middleware/auth");

router.post("/book-item",             authenticateToken, bookingController.bookItem);
router.post("/request-group",         authenticateToken, bookingController.requestGroup);
router.get( "/my-requests",           authenticateToken, bookingController.getMyBookings);
router.get( "/item-requests",         authenticateToken, bookingController.getItemRequests);
router.get( "/owner/items",           authenticateToken, bookingController.getOwnerItems);
router.get( "/owner/booking-history", authenticateToken, bookingController.getOwnerBookingHistory);
router.put( "/request-status",        authenticateToken, bookingController.updateRequestStatus);
router.put( "/request-cancel",        authenticateToken, bookingController.cancelRequest);
router.put( "/request-checkout",      authenticateToken, bookingController.checkoutRequest);
router.put( "/request-return",        authenticateToken, bookingController.returnRequest);
router.get( "/overdue-requests",      authenticateToken, bookingController.getOverdueRequests);

module.exports = router;
