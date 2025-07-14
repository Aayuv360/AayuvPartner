import { 
  DeliveryPartner,
  Customer, 
  Address,
  Order, 
  Earning, 
  PartnerLocation,
  type IDeliveryPartner, 
  type InsertDeliveryPartner,
  type ICustomer,
  type InsertCustomer,
  type IAddress,
  type InsertAddress,
  type IOrder, 
  type InsertOrder,
  type IEarning,
  type InsertEarning,
  type IPartnerLocation,
  type InsertPartnerLocation
} from "@shared/schema";
import { getCurrentIST, getTodayStartIST, getTodayEndIST } from "@shared/timezone";

export interface IStorage {
  // Delivery Partner methods
  getDeliveryPartner(id: string): Promise<IDeliveryPartner | null>;
  getDeliveryPartnerByEmail(email: string): Promise<IDeliveryPartner | null>;
  getDeliveryPartnerByPhone(phone: string): Promise<IDeliveryPartner | null>;
  createDeliveryPartner(partner: InsertDeliveryPartner): Promise<IDeliveryPartner>;
  updateDeliveryPartner(id: string, updates: Partial<IDeliveryPartner>): Promise<IDeliveryPartner | null>;
  
  // Customer methods
  getCustomer(id: string): Promise<ICustomer | null>;
  createCustomer(customer: InsertCustomer): Promise<ICustomer>;
  
  // Address methods
  getAddress(id: string): Promise<IAddress | null>;
  getAddressesByCustomerId(customerId: string): Promise<IAddress[]>;
  createAddress(address: InsertAddress): Promise<IAddress>;
  updateAddress(id: string, updates: Partial<IAddress>): Promise<IAddress | null>;
  
  // Order methods
  getOrder(id: string): Promise<IOrder | null>;
  getOrdersByPartnerId(partnerId: string): Promise<IOrder[]>;
  getActiveOrderByPartnerId(partnerId: string): Promise<IOrder | null>;
  createOrder(order: InsertOrder): Promise<IOrder>;
  updateOrderStatus(id: string, status: string, partnerId?: string): Promise<IOrder | null>;
  getAvailableOrders(): Promise<IOrder[]>;
  
  // Earnings methods
  getEarningsByPartnerId(partnerId: string): Promise<IEarning[]>;
  getTodayEarnings(partnerId: string): Promise<number>;
  createEarning(earning: InsertEarning): Promise<IEarning>;
  
  // Location methods
  createPartnerLocation(location: InsertPartnerLocation): Promise<IPartnerLocation>;
  getPartnerLocations(partnerId: string, limit?: number): Promise<IPartnerLocation[]>;
}

export class DatabaseStorage implements IStorage {
  
  async initializeSampleData() {
    // Using existing MongoDB data - no sample data initialization needed
    console.log('Connected to MongoDB - using existing data from users, orders, and addresses tables');
  }

  // Delivery Partner methods
  async getDeliveryPartner(id: string): Promise<IDeliveryPartner | null> {
    try {
      // Check if it's a valid ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Invalid ObjectId format:', id);
        return null;
      }
      return await DeliveryPartner.findById(id);
    } catch (error) {
      console.log('Error finding partner by ID:', error);
      return null;
    }
  }

  async getDeliveryPartnerByEmail(email: string): Promise<IDeliveryPartner | null> {
    return await DeliveryPartner.findOne({ email });
  }

  async getDeliveryPartnerByPhone(phone: string): Promise<IDeliveryPartner | null> {
    return await DeliveryPartner.findOne({ phone });
  }

  async createDeliveryPartner(insertPartner: InsertDeliveryPartner): Promise<IDeliveryPartner> {
    const partner = new DeliveryPartner(insertPartner);
    return await partner.save();
  }

  async updateDeliveryPartner(id: string, updates: Partial<IDeliveryPartner>): Promise<IDeliveryPartner | null> {
    return await DeliveryPartner.findByIdAndUpdate(id, updates, { new: true });
  }

  // Customer methods
  async getCustomer(id: string): Promise<ICustomer | null> {
    return await Customer.findById(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<ICustomer> {
    const customer = new Customer(insertCustomer);
    return await customer.save();
  }

  // Address methods
  async getAddress(id: string): Promise<IAddress | null> {
    return await Address.findById(id);
  }

  async getAddressesByCustomerId(customerId: string): Promise<IAddress[]> {
    return await Address.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async createAddress(insertAddress: InsertAddress): Promise<IAddress> {
    const address = new Address(insertAddress);
    return await address.save();
  }

  async updateAddress(id: string, updates: Partial<IAddress>): Promise<IAddress | null> {
    return await Address.findByIdAndUpdate(id, updates, { new: true });
  }

  // Order methods
  async getOrder(id: string): Promise<IOrder | null> {
    return await Order.findById(id)
      .populate('customerId')
      .populate('deliveryAddressId');
  }

  async getOrdersByPartnerId(partnerId: string): Promise<IOrder[]> {
    return await Order.find({ deliveryPartnerId: partnerId })
      .populate('customerId')
      .populate('deliveryAddressId');
  }

  async getActiveOrderByPartnerId(partnerId: string): Promise<IOrder | null> {
    return await Order.findOne({ 
      deliveryPartnerId: partnerId, 
      status: { $nin: ['delivered', 'cancelled'] }
    })
    .populate('customerId')
    .populate('deliveryAddressId');
  }

  async createOrder(insertOrder: InsertOrder): Promise<IOrder> {
    const orderNumber = `ORD-2024-${String(Date.now()).slice(-6)}`;
    const order = new Order({
      ...insertOrder,
      orderNumber
    });
    return await order.save();
  }

  async updateOrderStatus(id: string, status: string, partnerId?: string): Promise<IOrder | null> {
    const updates: any = { 
      status,
      updatedAt: new Date()
    };
    
    if (partnerId) {
      updates.deliveryPartnerId = partnerId;
    }
    
    if (status === 'delivered') {
      updates.actualDeliveryTime = new Date();
    }
    
    return await Order.findByIdAndUpdate(id, updates, { new: true })
      .populate('customerId')
      .populate('deliveryAddressId');
  }

  async getAvailableOrders(): Promise<IOrder[]> {
    const orders = await Order.find({ 
      status: 'prepared', 
      deliveryPartnerId: null 
    })
    .populate('customerId')
    .populate('deliveryAddressId');
    
    // Ensure _id is properly serialized
    return orders.map(order => ({
      ...order.toObject(),
      _id: order._id.toString()
    }));
  }

  // Earnings methods
  async getEarningsByPartnerId(partnerId: string): Promise<IEarning[]> {
    return await Earning.find({ deliveryPartnerId: partnerId }).sort({ createdAt: -1 });
  }

  async getTodayEarnings(partnerId: string): Promise<number> {
    const todayStart = getTodayStartIST().toJSDate();
    const todayEnd = getTodayEndIST().toJSDate();
    
    const earnings = await Earning.find({
      deliveryPartnerId: partnerId,
      createdAt: { 
        $gte: todayStart,
        $lt: todayEnd
      }
    });
    
    return earnings.reduce((total, earning) => total + parseFloat(earning.amount), 0);
  }

  async createEarning(insertEarning: InsertEarning): Promise<IEarning> {
    const earning = new Earning(insertEarning);
    return await earning.save();
  }

  // Location methods
  async createPartnerLocation(insertLocation: InsertPartnerLocation): Promise<IPartnerLocation> {
    const location = new PartnerLocation(insertLocation);
    return await location.save();
  }

  async getPartnerLocations(partnerId: string, limit: number = 10): Promise<IPartnerLocation[]> {
    return await PartnerLocation.find({ deliveryPartnerId: partnerId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();