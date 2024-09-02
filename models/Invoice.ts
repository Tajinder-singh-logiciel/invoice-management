import mongoose, { Document, Schema, Model } from "mongoose";
import { generateInvoiceId } from "../utils/generateInvoiceId";

interface IItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface IAddress {
  street: string;
  city: string;
  postCode: string;
  country: string;
}

interface IInvoice extends Document {
  createdAt: Date;
  paymentDue?: Date;
  description: string;
  paymentTerms: number;
  clientName: string;
  clientEmail: string;
  status: "draft" | "pending" | "paid";
  senderAddress: IAddress;
  clientAddress: IAddress;
  items: IItem[];
  total: number;
}

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: false },
    quantity: { type: Number, required: false },
    price: { type: Number, required: false },
    total: { type: Number, required: false },
  },
  { _id: false } // Disable _id for items
);

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: false },
    city: { type: String, required: false },
    postCode: { type: String, required: false },
    country: { type: String, required: false },
  },
  { _id: false } // Disable _id for addresses
);

const invoiceSchema = new Schema<IInvoice>({
  id: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  paymentDue: { type: Date },
  description: { type: String, required: false },
  paymentTerms: { type: Number, default: 1 },
  clientName: { type: String, required: false },
  clientEmail: { type: String, required: false },
  status: {
    type: String,
    default: "draft",
  },
  senderAddress: { type: addressSchema, required: false },
  clientAddress: { type: addressSchema, required: false },
  items: { type: [itemSchema], required: false },
  total: { type: Number, required: false },
});

// Custom validation for required fields when status is "paid" or "pending"
invoiceSchema.pre("validate", function (next) {
  // Calculate the total if items are modified
  if (this.isModified("items")) {
    this.id = this.id || generateInvoiceId();
    this.items = this.items.map((item: IInvoice["items"][0]) => ({
      ...item,
      total: item.quantity * item.price,
    }));

    this.total = this.items.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  // Calculate the payment due date if payment terms are modified
  if (this.isModified("paymentTerms") && this.paymentTerms) {
    const dueDate = new Date(this.createdAt);
    dueDate.setDate(dueDate.getDate() + this.paymentTerms);
    this.paymentDue = dueDate;
  }

  // Custom validation for required fields when status is "paid" or "pending"
  if (this.status === "paid" || this.status === "pending") {
    if (
      !this.items.length ||
      !this.total ||
      !this.senderAddress.street ||
      !this.clientAddress.street ||
      !this.clientEmail ||
      !this.clientName ||
      !this.description ||
      this.paymentTerms === undefined
    ) {
      return next(
        new Error(
          "All fields must be filled when the status is 'paid' or 'pending'."
        )
      );
    }
  }

  next();
});

const Invoice: Model<IInvoice> = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema
);

export default Invoice;
export { IInvoice, IItem, IAddress };
