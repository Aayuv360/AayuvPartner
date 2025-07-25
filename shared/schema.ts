import { z } from "zod";
import { Schema, model, Document } from "mongoose";

// MongoDB Schemas
const deliveryPartnerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Make email optional
  phone: { type: String, required: true, unique: true }, // Primary identifier
  password: { type: String, default: null }, // Optional for OTP users
  isOnline: { type: Boolean, default: false },
  currentLatitude: { type: String, default: null },
  currentLongitude: { type: String, default: null },
  rating: { type: String, default: "0" },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: String, default: "0" },
  // India-specific fields
  isPhoneVerified: { type: Boolean, default: false },
  aadhaarNumber: { type: String, default: null },
  aadhaarDocument: { type: String, default: null },
  panNumber: { type: String, default: null },
  panDocument: { type: String, default: null },
  drivingLicenseNumber: { type: String, default: null },
  drivingLicenseDocument: { type: String, default: null },
  vehicleRegistrationNumber: { type: String, default: null },
  vehicleRegistrationDocument: { type: String, default: null },
  bankAccountNumber: { type: String, default: null },
  bankIFSC: { type: String, default: null },
  upiId: { type: String, default: null },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'in_review', 'verified', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const customerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: null },
  address: { type: String, default: null },
  latitude: { type: String, default: null },
  longitude: { type: String, default: null },
}, { collection: 'users' }); // Map to existing 'users' collection

// Address Schema for delivery addresses
const addressSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: null },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  nickname: { type: String, default: null }, // Like "Home", "Office", etc.
}, { 
  timestamps: true,
  collection: 'addresses'  // Explicitly use 'addresses' collection
});

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'DeliveryPartner', default: null },
  deliveryAddressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
  status: { type: String, required: true, default: "prepared" },
  amount: { type: String, required: true },
  deliveryFee: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  estimatedDeliveryTime: { type: Number, default: null },
  actualDeliveryTime: { type: Date, default: null },
  partnerRating: { type: Number, default: null },
  customerFeedback: { type: String, default: null },
}, { 
  timestamps: true,
  collection: 'orders'  // Explicitly use 'orders' collection
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
export const Address = model('Address', addressSchema);
export const Order = model('Order', orderSchema);
export const Earning = model('Earning', earningSchema);
export const PartnerLocation = model('PartnerLocation', partnerLocationSchema);

// OTP Schema for mobile authentication
const otpSchema = new Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const OTP = model('OTP', otpSchema);

// Zod validation schemas
export const insertDeliveryPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required").optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  isOnline: z.boolean().optional(),
  currentLatitude: z.string().optional(),
  currentLongitude: z.string().optional(),
  isPhoneVerified: z.boolean().optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Valid 12-digit Aadhaar number required").optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Valid PAN number required").optional(),
  preferredLanguage: z.enum(['hindi', 'english']).optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional()
});

export const insertCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const insertAddressSchema = z.object({
  customerId: z.string(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default('India'),
  latitude: z.string(),
  longitude: z.string(),
  isDefault: z.boolean().optional(),
  nickname: z.string().optional(),
});

export const insertOrderSchema = z.object({
  customerId: z.string(),
  deliveryPartnerId: z.string().optional(),
  deliveryAddressId: z.string(),
  status: z.string().optional(),
  amount: z.string(),
  deliveryFee: z.string(),
  paymentMethod: z.string(),
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

// OTP validation schemas  
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required")
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required"),
  otp: z.string().length(6, "OTP must be 6 digits")
});

export const mobileRegisterSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required"),
  name: z.string().min(1, "Name is required"),
  preferredLanguage: z.enum(['hindi', 'english']).default('hindi')
});

// Auth schemas - Updated for mobile-first
export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required").optional(),
  password: z.string().min(6).optional(),
  otp: z.string().length(6, "OTP must be 6 digits").optional()
}).refine((data) => {
  return (data.email && data.password) || (data.phone && data.otp);
}, {
  message: "Either email+password or phone+OTP is required"
});

export const registerSchema = insertDeliveryPartnerSchema.extend({
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
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
  
  // Document verification fields
  aadhaarNumber?: string;
  aadhaarDocument?: string;
  panNumber?: string;
  panDocument?: string;
  drivingLicenseNumber?: string;
  drivingLicenseDocument?: string;
  vehicleRegistrationNumber?: string;
  vehicleRegistrationDocument?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  upiId?: string;
  verificationStatus: 'pending' | 'in_review' | 'verified' | 'rejected';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer extends Document {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export interface IAddress extends Document {
  _id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  customerId: string;
  deliveryPartnerId?: string;
  deliveryAddressId: string;
  status: string;
  amount: string;
  deliveryFee: string;
  paymentMethod: string;
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
export type AddressType = IAddress;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type OrderType = IOrder;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type EarningType = IEarning;
export type InsertEarning = z.infer<typeof insertEarningSchema>;
export type PartnerLocationType = IPartnerLocation;
export type InsertPartnerLocation = z.infer<typeof insertPartnerLocationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;