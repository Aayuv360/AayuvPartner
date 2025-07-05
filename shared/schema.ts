import { z } from "zod";
import { Schema, model, Document } from "mongoose";

// MongoDB Schemas
const deliveryPartnerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isOnline: { type: Boolean, default: false },
  currentLatitude: { type: String, default: null },
  currentLongitude: { type: String, default: null },
  rating: { type: String, default: "0" },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: String, default: "0" },
}, {
  timestamps: true
});

const customerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: String, default: null },
  longitude: { type: String, default: null },
});

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'DeliveryPartner', default: null },
  status: { type: String, required: true, default: "prepared" },
  amount: { type: String, required: true },
  deliveryFee: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryLatitude: { type: String, default: null },
  deliveryLongitude: { type: String, default: null },
  estimatedDeliveryTime: { type: Number, default: null },
  actualDeliveryTime: { type: Date, default: null },
  partnerRating: { type: Number, default: null },
  customerFeedback: { type: String, default: null },
}, {
  timestamps: true
});

const earningSchema = new Schema({
  deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'DeliveryPartner', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: String, required: true },
}, {
  timestamps: true
});

const partnerLocationSchema = new Schema({
  deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'DeliveryPartner', required: true },
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
}, {
  timestamps: true
});

// Export Models
export const DeliveryPartner = model('DeliveryPartner', deliveryPartnerSchema);
export const Customer = model('Customer', customerSchema);
export const Order = model('Order', orderSchema);
export const Earning = model('Earning', earningSchema);
export const PartnerLocation = model('PartnerLocation', partnerLocationSchema);

// Zod validation schemas
export const insertDeliveryPartnerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(6),
  isOnline: z.boolean().optional(),
  currentLatitude: z.string().optional(),
  currentLongitude: z.string().optional(),
});

export const insertCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const insertOrderSchema = z.object({
  customerId: z.string(),
  deliveryPartnerId: z.string().optional(),
  status: z.string().optional(),
  amount: z.string(),
  deliveryFee: z.string(),
  paymentMethod: z.string(),
  deliveryAddress: z.string(),
  deliveryLatitude: z.string().optional(),
  deliveryLongitude: z.string().optional(),
  estimatedDeliveryTime: z.number().optional(),
  actualDeliveryTime: z.date().optional(),
  partnerRating: z.number().optional(),
  customerFeedback: z.string().optional(),
});

export const insertEarningSchema = z.object({
  deliveryPartnerId: z.string(),
  orderId: z.string(),
  amount: z.string(),
});

export const insertPartnerLocationSchema = z.object({
  deliveryPartnerId: z.string(),
  latitude: z.string(),
  longitude: z.string(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertDeliveryPartnerSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// TypeScript interfaces
export interface IDeliveryPartner extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  isOnline: boolean;
  currentLatitude?: string;
  currentLongitude?: string;
  rating: string;
  totalDeliveries: number;
  totalEarnings: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer extends Document {
  _id: string;
  name: string;
  phone: string;
  address: string;
  latitude?: string;
  longitude?: string;
}

export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  customerId: string;
  deliveryPartnerId?: string;
  status: string;
  amount: string;
  deliveryFee: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  estimatedDeliveryTime?: number;
  actualDeliveryTime?: Date;
  partnerRating?: number;
  customerFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEarning extends Document {
  _id: string;
  deliveryPartnerId: string;
  orderId: string;
  amount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPartnerLocation extends Document {
  _id: string;
  deliveryPartnerId: string;
  latitude: string;
  longitude: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types for frontend
export type DeliveryPartnerType = IDeliveryPartner;
export type InsertDeliveryPartner = z.infer<typeof insertDeliveryPartnerSchema>;
export type CustomerType = ICustomer;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type OrderType = IOrder;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type EarningType = IEarning;
export type InsertEarning = z.infer<typeof insertEarningSchema>;
export type PartnerLocationType = IPartnerLocation;
export type InsertPartnerLocation = z.infer<typeof insertPartnerLocationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;