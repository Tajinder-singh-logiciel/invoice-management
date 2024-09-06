import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Invoice from "../models/Invoice"; // Import your model
import { generateInvoiceId } from "../utils/generateInvoiceId";

// Utility function to generate address
const createAddress = (
  street: string,
  city: string,
  postCode: string,
  country: string
) => ({
  street,
  city,
  postCode,
  country,
});

// Utility function to create sample invoice data
const createInvoiceData = (
  description: string,
  paymentTerms: number,
  clientName: string,
  clientEmail: string,
  status: string,
  senderStreet: string,
  clientStreet: string,
  items: Array<{ name: string; quantity: number; price: number; total: number }>
) => ({
  description,
  paymentTerms,
  clientName,
  clientEmail,
  status,
  senderAddress: createAddress(senderStreet, "New York", "10001", "USA"),
  clientAddress: createAddress(clientStreet, "San Francisco", "94105", "USA"),
  items,
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Invoice Model Test Suite", () => {
  it("should create and save an invoice successfully", async () => {
    const invoiceData = createInvoiceData(
      "Web development services",
      7,
      "John Doe",
      "johndoe@example.com",
      "draft",
      "123 Main St",
      "456 Client St",
      [{ name: "Website Development", quantity: 1, price: 1000, total: 1000 }]
    );

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    const foundInvoice = await Invoice.findOne({
      clientEmail: "johndoe@example.com",
    });

    expect(foundInvoice).toBeTruthy();
    expect(foundInvoice?.total).toBe(1000);
    expect(foundInvoice?.paymentDue).toBeDefined();
    expect(foundInvoice?.id).toBeDefined(); // Check if invoice ID was generated
  });

  it("should calculate total and payment due date correctly", async () => {
    const invoiceData = createInvoiceData(
      "Mobile app development",
      14,
      "Jane Doe",
      "janedoe@example.com",
      "draft",
      "789 Main St",
      "987 Client St",
      [
        { name: "App Development", quantity: 2, price: 500, total: 1000 },
        { name: "Design Services", quantity: 1, price: 300, total: 300 },
      ]
    );

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    expect(invoice.total).toBe(1300); // Total should be calculated

    const paymentDue = new Date(invoice.createdAt);
    paymentDue.setDate(paymentDue.getDate() + 14);
    expect(invoice.paymentDue?.toDateString()).toBe(paymentDue.toDateString()); // Check payment due date
  });

  it('should throw an error when required fields are missing for "paid" status', async () => {
    const invoiceData = createInvoiceData(
      "SEO services",
      30,
      "", // Missing clientName
      "client@example.com",
      "paid", // Status is paid but required fields are missing
      "123 SEO St",
      "456 Client St",
      [{ name: "SEO Optimization", quantity: 1, price: 500, total: 500 }]
    );

    const invoice = new Invoice(invoiceData);

    let error = null;
    try {
      await invoice.validate(); // Trigger validation
    } catch (err) {
      error = err;
    }
    expect(error).toBeTruthy();
  });
});
