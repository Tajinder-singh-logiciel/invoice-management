import express from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoices,
  markAsPaid,
  updateInvoice,
} from "../controllers/invoiceController";

const router = express.Router();

router.post("/invoice", createInvoice);
router.put("/invoice/:id", updateInvoice);
router.delete("/invoice/:id", deleteInvoice);
router.get("/invoices/:id?", getInvoices);
router.put("/invoice/:id/markAsPaid", markAsPaid);
export default router;
