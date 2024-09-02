import { Request, Response } from "express";
import Invoice, { IInvoice } from "../models/Invoice";

const handleInvoiceOperation = async (
  operation: (invoice: IInvoice) => Promise<IInvoice>,
  res: Response,
  successMessage: string
) => {
  try {
    const invoice = await operation(new Invoice());
    res.status(201).json({
      data: invoice,
      status: "success",
      message: successMessage,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ error: errorMessage });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  const createOperation = async (invoice: IInvoice) => {
    Object.assign(invoice, req.body);
    return await invoice.save();
  };

  await handleInvoiceOperation(
    createOperation,
    res,
    "Invoice created successfully"
  );
};

export const updateInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateOperation = async (invoice: IInvoice) => {
    const existingInvoice = await Invoice.findOne({ id });
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }
    Object.assign(existingInvoice, req.body);
    return await existingInvoice.save();
  };

  await handleInvoiceOperation(
    updateOperation,
    res,
    "Invoice updated successfully"
  );
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedInvoice = await Invoice.findOneAndDelete({ id });
    if (!deletedInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res
      .status(200)
      .json({ message: "Invoice deleted successfully", status: "success" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete invoice";
    res.status(500).json({ error: errorMessage });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (id) {
      const invoice = await Invoice.findOne({ id });
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      return res.status(200).json({ data: invoice, status: "success" });
    }

    const query = status ? { status } : {};
    const invoices = await Invoice.find(query);
    res.status(200).json({ data: invoices, status: "success" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve invoices";
    res.status(500).json({ error: errorMessage });
  }
};

export const markAsPaid = async (req: Request, res: Response) => {
  const { id } = req.params;
  const markAsPaidOperation = async (invoice: IInvoice) => {
    const existingInvoice = await Invoice.findOne({ id });
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }
    existingInvoice.status = "paid";
    return await existingInvoice.save();
  };

  await handleInvoiceOperation(
    markAsPaidOperation,
    res,
    "Invoice marked as paid successfully"
  );
};
