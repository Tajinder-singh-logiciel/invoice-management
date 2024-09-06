import { Request, Response } from "express";
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoices,
  markAsPaid,
} from "../controllers/invoiceController";
import Invoice from "../models/Invoice";

// Mock the Invoice model
jest.mock("../models/Invoice");

describe("Invoice Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockInvoiceInstance: any;
  let mockExistingInvoice: any;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockInvoiceInstance = {
      save: jest
        .fn()
        .mockResolvedValue({ id: "1", amount: 100, status: "pending" }),
    };

    mockExistingInvoice = {
      save: jest
        .fn()
        .mockResolvedValue({ id: "1", amount: 200, status: "paid" }),
    };

    (Invoice as unknown as jest.Mock).mockImplementation(
      () => mockInvoiceInstance
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * createInvoice
   */
  describe("createInvoice", () => {
    beforeEach(() => {
      req = {
        body: {
          amount: 100,
          description: "Test Invoice",
          status: "pending",
        },
      };
    });

    it("should create a new invoice successfully", async () => {
      await createInvoice(req as Request, res as Response);

      expect(Invoice).toHaveBeenCalled();
      expect(mockInvoiceInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: "1", amount: 100, status: "pending" },
        status: "success",
        message: "Invoice created successfully",
      });
    });

    it("should handle errors when creating an invoice", async () => {
      mockInvoiceInstance.save.mockRejectedValue(new Error("Database error"));

      await createInvoice(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database error",
      });
    });
  });

  /**
   * updateInvoice
   */
  describe("updateInvoice", () => {
    beforeEach(() => {
      req = {
        params: { id: "1" },
        body: {
          amount: 200,
          description: "Updated Invoice",
          status: "paid",
        },
      };

      (Invoice.findOne as jest.Mock).mockResolvedValue(mockExistingInvoice);
    });

    it("should update an existing invoice successfully", async () => {
      await updateInvoice(req as Request, res as Response);

      expect(Invoice.findOne).toHaveBeenCalledWith({ id: "1" });
      expect(mockExistingInvoice.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: "1", amount: 200, status: "paid" },
        status: "success",
        message: "Invoice updated successfully",
      });
    });

    it("should return 404 if invoice not found", async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      await updateInvoice(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invoice not found",
      });
    });
  });

  /**
   * deleteInvoice
   */
  describe("deleteInvoice", () => {
    beforeEach(() => {
      req = {
        params: { id: "1" },
      };
    });

    it("should delete an invoice successfully", async () => {
      (Invoice.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockExistingInvoice
      );

      await deleteInvoice(req as Request, res as Response);

      expect(Invoice.findOneAndDelete).toHaveBeenCalledWith({ id: "1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invoice deleted successfully",
        status: "success",
      });
    });

    it("should return 404 if invoice is not found", async () => {
      (Invoice.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteInvoice(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invoice not found",
      });
    });

    it("should handle errors when deleting an invoice", async () => {
      (Invoice.findOneAndDelete as jest.Mock).mockRejectedValue(
        new Error("Failed to delete invoice")
      );

      await deleteInvoice(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to delete invoice",
      });
    });
  });

  /**
   * getInvoices
   */
  describe("getInvoices", () => {
    it("should retrieve a single invoice by ID", async () => {
      req = {
        params: { id: "1" },
        query: { status: "pending" },
      };

      (Invoice.findOne as jest.Mock).mockResolvedValue(mockExistingInvoice);

      await getInvoices(req as Request, res as Response);

      expect(Invoice.findOne).toHaveBeenCalledWith({ id: "1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: mockExistingInvoice,
        status: "success",
      });
    });

    it("should return 404 if invoice is not found", async () => {
      req = {
        params: { id: "1" },
        query: { status: "pending" },
      };

      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      await getInvoices(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invoice not found",
      });
    });

    it("should retrieve invoices based on query parameters", async () => {
      const mockExistingInvoice = {
        id: "1",
        status: "draft",
        amount: 200,
      };

      // Mock request with query parameters
      req = {
        params: { id: "" },
        query: { status: "draft" },
      };

      // Mock Invoice.find to return a resolved promise with the mock invoice
      (Invoice.find as jest.Mock).mockResolvedValue([mockExistingInvoice]);

      // Call the controller function
      await getInvoices(req as Request, res as Response);

      // Check if Invoice.find was called with the correct query parameter
      expect(Invoice.find).toHaveBeenCalledWith({ status: "draft" });

      // Check the response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [mockExistingInvoice],
        status: "success",
      });
    });

    it("should handle errors when retrieving invoices", async () => {
      req = {
        params: { id: "1" },
        query: { status: "pending" },
      };

      (Invoice.findOne as jest.Mock).mockRejectedValue(
        new Error("Failed to retrieve invoices")
      );

      await getInvoices(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to retrieve invoices",
      });
    });
  });

  /**
   * markAsPaid
   */
  describe("markAsPaid", () => {
    beforeEach(() => {
      req = {
        params: { id: "1" },
      };

      (Invoice.findOne as jest.Mock).mockResolvedValue(mockExistingInvoice);
    });

    it("should mark an invoice as paid", async () => {
      const mockExistingInvoice = {
        id: "1",
        status: "pending",
        amount: 200,
        save: jest.fn().mockResolvedValue({
          id: "1",
          status: "paid",
          amount: 200,
        }),
      };

      req = { params: { id: "1" } };
      (Invoice.findOne as jest.Mock).mockResolvedValue(mockExistingInvoice);

      await markAsPaid(req as Request, res as Response);

      expect(mockExistingInvoice.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          id: "1",
          status: "paid",
          amount: 200,
        },
        status: "success",
        message: "Invoice marked as paid successfully",
      });
    });

    it("should return 404 if invoice is not found", async () => {
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);

      await markAsPaid(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invoice not found",
      });
    });

    it("should handle errors when marking invoice as paid", async () => {
      (Invoice.findOne as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await markAsPaid(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database error",
      });
    });
  });
});
