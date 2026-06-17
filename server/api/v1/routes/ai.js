import express from "express";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";
import {
  getAiStatus,
  postClassifyTicket,
  postCustomerInsights,
  postCustomerPromoEmail,
  postDashboardInsights,
  postBusinessOverview,
  postGenerateCommunication,
  postGenerateTicketReply,
  postSalesInsights,
  postShiftAnalysis,
  postTicketInsights,
  postTicketSuggestions,
  postWarehouseSuggestions,
} from "../controllers/ai.js";

const router = express.Router();

router.get("/status", authUser, getAiStatus);
router.post("/tickets/classify", authUser, postClassifyTicket);
router.post("/tickets/reply", authUser, requireAdmin, postGenerateTicketReply);
router.post("/tickets/suggestions", authUser, requireAdmin, postTicketSuggestions);
router.post("/tickets/insights", authUser, requireAdmin, postTicketInsights);
router.post("/warehouse/suggestions", authUser, postWarehouseSuggestions);
router.post("/shifts/analyze", authUser, requireAdmin, postShiftAnalysis);
router.post("/communications/generate", authUser, requireAdmin, postGenerateCommunication);
router.post("/dashboard/insights", authUser, requireAdmin, postDashboardInsights);
router.post("/business/overview", authUser, requireAdmin, postBusinessOverview);
router.post("/sales/insights", authUser, requireAdmin, postSalesInsights);
router.post("/customers/insights", authUser, requireAdmin, postCustomerInsights);
router.post("/customers/promo-email", authUser, requireAdmin, postCustomerPromoEmail);

export default router;
