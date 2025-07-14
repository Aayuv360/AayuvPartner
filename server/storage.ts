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
    try {
      // Check if sample data already exists - don't disturb existing data
      const existingOrders = await Order.countDocuments();
      if (existingOrders > 0) {
        console.log('Existing data found, will use it without modification');
        return;
      }

      // Sample customers
      const customer1 = new Customer({
        name: "Priya Sharma",
        phone: "+91 9876543210",
        address: "Block A, Sector 18, Noida",
        latitude: "28.5672",
        longitude: "77.3248"
      });

      const customer2 = new Customer({
        name: "Amit Verma", 
        phone: "+91 9876543211",
        address: "DLF Phase 3, Gurgaon",
        latitude: "28.4595",
        longitude: "77.0266"
      });

      await customer1.save();
      await customer2.save();

      // Sample addresses
      const address1 = new Address({
        customerId: customer1._id,
        addressLine1: "Block A, Sector 18",
        addressLine2: "Near Metro Station",
        city: "Noida",
        state: "Uttar Pradesh",
        postalCode: "201301",
        country: "India",
        latitude: "28.5672",
        longitude: "77.3248",
        isDefault: true,
        nickname: "Home"
      });

      const address2 = new Address({
        customerId: customer2._id,
        addressLine1: "DLF Phase 3",
        addressLine2: "Block C, Tower 12",
        city: "Gurgaon",
        state: "Haryana",
        postalCode: "122002",
        country: "India",
        latitude: "28.4595",
        longitude: "77.0266",
        isDefault: true,
        nickname: "Home"
      });

      await address1.save();
      await address2.save();

      // Sample orders
      const order1 = new Order({
        orderNumber: "ORD-2024-001",
        customerId: customer1._id,
        deliveryAddressId: address1._id,
        status: "prepared",
        amount: "450.00",
        deliveryFee: "40.00",
        paymentMethod: "cash",
        estimatedDeliveryTime: 25,
      });

      const order2 = new Order({
        orderNumber: "ORD-2024-002",
        customerId: customer2._id,
        deliveryAddressId: address2._id,
        status: "prepared",
        amount: "320.00",
        deliveryFee: "35.00",
        paymentMethod: "online",
        estimatedDeliveryTime: 30,
      });

      await order1.save();
      await order2.save();
      
      console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
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