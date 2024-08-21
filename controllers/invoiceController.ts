import { Request, Response } from "express";
import Invoice, { IInvoice } from "../models/Invoice";
import { generateInvoiceId } from "../utils/generateInvoiceId";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { items, status, ...rest } = req.body;

    console.log("status", status);

    // If saving as draft, set default values for missing fields
    const invoiceData: Partial<IInvoice> = {
      ...rest,
      id: rest.id || generateInvoiceId(), // Generate an ID if it doesn't exist
      status: status || "draft",
      items: items.map((item: IInvoice["items"][0]) => ({
        ...item,
        total: item.quantity * item.price,
      })),
    };

    // Calculate total
    invoiceData.total =
      invoiceData.items?.reduce((acc, item) => acc + item.total, 0) ?? 0;

    // If status is 'pending', validate all fields
    if (status === "pending") {
      const requiredFields: (keyof IInvoice)[] = [
        "clientName",
        "clientEmail",
        "description",
        "senderAddress",
        "clientAddress",
      ];
      const missingFields = requiredFields.filter(
        (field) => !invoiceData[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Calculate payment due date
    }

    if (invoiceData.createdAt) {
      invoiceData.paymentDue = new Date(
        new Date(invoiceData.createdAt ?? new Date()).setDate(
          new Date(invoiceData.createdAt ?? new Date()).getDate() +
            (invoiceData.paymentTerms ?? 1)
        )
      );
    }

    // Save invoice to the database
    const newInvoice = new Invoice(invoiceData);

    await newInvoice.save();

    res.status(201).json({ data: newInvoice, status: "success" });
  } catch (error) {
    res.status(500).json({ error: error || "Failed to create invoice" });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, status, ...rest } = req.body;

    // Find the invoice by ID
    const invoice = await Invoice.findOne({ id });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update fields
    const updatedData: Partial<IInvoice> = {
      ...invoice.toObject(),
      ...rest,
      items: items?.map((item: IInvoice["items"][0]) => ({
        ...item,
        total: item.quantity * item.price,
      })),
    };

    // Calculate new total
    updatedData.total =
      updatedData.items?.reduce((acc, item) => acc + item.total, 0) ??
      invoice.total;

    // Calculate payment due date if status is 'pending'
    if (status === "pending") {
      updatedData.status = "pending";
    }

    if (updatedData.createdAt) {
      updatedData.paymentDue = new Date(
        new Date(updatedData.createdAt ?? new Date()).setDate(
          new Date(updatedData.createdAt ?? new Date()).getDate() +
            (updatedData.paymentTerms ?? 1)
        )
      );
    }

    // Save updated invoice
    const updatedInvoice = await Invoice.findOneAndUpdate({ id }, updatedData, {
      new: true,
    });

    res.status(200).json({ data: updatedInvoice, status: "success" });
  } catch (error) {
    res.status(500).json({ error: error || "Failed to update invoice" });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find and delete the invoice
    const deletedInvoice = await Invoice.findOneAndDelete({ id });

    if (!deletedInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res
      .status(200)
      .json({ message: "Invoice deleted successfully", status: "success" });
  } catch (error) {
    res.status(500).json({ error: error || "Failed to delete invoice" });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (id) {
      // Get a specific invoice by ID
      const invoice = await Invoice.findOne({ id });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      res.status(200).json(invoice);
    } else {
      // Get all invoices
      let invoices = await Invoice.find();

      if (status) {
        invoices = invoices.filter((invoice) => invoice.status === status);
      }

      res.status(200).json({ data: invoices, status: "success" });
    }
  } catch (error) {
    res.status(500).json({ error: error || "Failed to retrieve invoices" });
  }
};

export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the invoice by ID
    const invoice = await Invoice.findOne({ id });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update the status to "paid"
    invoice.status = "paid";

    // Save the updated invoice
    await invoice.save();

    res.status(200).json({ data: invoice, status: "success" });
  } catch (error) {
    res.status(500).json({ error: error || "Failed to mark invoice as paid" });
  }
};
