import { 
  deliveryPartners, 
  customers, 
  orders, 
  earnings, 
  partnerLocations,
  type DeliveryPartner, 
  type InsertDeliveryPartner,
  type Customer,
  type InsertCustomer,
  type Order, 
  type InsertOrder,
  type Earning,
  type InsertEarning,
  type PartnerLocation,
  type InsertPartnerLocation
} from "@shared/schema";

export interface IStorage {
  // Delivery Partner methods
  getDeliveryPartner(id: number): Promise<DeliveryPartner | undefined>;
  getDeliveryPartnerByEmail(email: string): Promise<DeliveryPartner | undefined>;
  createDeliveryPartner(partner: InsertDeliveryPartner): Promise<DeliveryPartner>;
  updateDeliveryPartner(id: number, updates: Partial<DeliveryPartner>): Promise<DeliveryPartner | undefined>;
  
  // Customer methods
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByPartnerId(partnerId: number): Promise<Order[]>;
  getActiveOrderByPartnerId(partnerId: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, partnerId?: number): Promise<Order | undefined>;
  getAvailableOrders(): Promise<Order[]>;
  
  // Earnings methods
  getEarningsByPartnerId(partnerId: number): Promise<Earning[]>;
  getTodayEarnings(partnerId: number): Promise<number>;
  createEarning(earning: InsertEarning): Promise<Earning>;
  
  // Location methods
  createPartnerLocation(location: InsertPartnerLocation): Promise<PartnerLocation>;
  getPartnerLocations(partnerId: number, limit?: number): Promise<PartnerLocation[]>;
}

export class MemStorage implements IStorage {
  private deliveryPartners: Map<number, DeliveryPartner>;
  private customers: Map<number, Customer>;
  private orders: Map<number, Order>;
  private earnings: Map<number, Earning>;
  private partnerLocations: Map<number, PartnerLocation>;
  private currentId: number;
  private orderCounter: number;

  constructor() {
    this.deliveryPartners = new Map();
    this.customers = new Map();
    this.orders = new Map();
    this.earnings = new Map();
    this.partnerLocations = new Map();
    this.currentId = 1;
    this.orderCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample customers
    const customer1: Customer = {
      id: 1,
      name: "Priya Sharma",
      phone: "+91 9876543210",
      address: "Block A, Sector 18, Noida",
      latitude: "28.5672",
      longitude: "77.3248"
    };
    
    const customer2: Customer = {
      id: 2,
      name: "Amit Verma", 
      phone: "+91 9876543211",
      address: "DLF Phase 3, Gurgaon",
      latitude: "28.4595",
      longitude: "77.0266"
    };

    this.customers.set(1, customer1);
    this.customers.set(2, customer2);
    this.currentId = Math.max(this.currentId, 3);
  }

  private generateOrderNumber(): string {
    return `ORD-2024-${String(this.orderCounter++).padStart(3, '0')}`;
  }

  // Delivery Partner methods
  async getDeliveryPartner(id: number): Promise<DeliveryPartner | undefined> {
    return this.deliveryPartners.get(id);
  }

  async getDeliveryPartnerByEmail(email: string): Promise<DeliveryPartner | undefined> {
    return Array.from(this.deliveryPartners.values()).find(
      (partner) => partner.email === email
    );
  }

  async createDeliveryPartner(insertPartner: InsertDeliveryPartner): Promise<DeliveryPartner> {
    const id = this.currentId++;
    const partner: DeliveryPartner = {
      ...insertPartner,
      id,
      isOnline: false,
      currentLatitude: null,
      currentLongitude: null,
      rating: "0",
      totalDeliveries: 0,
      totalEarnings: "0",
      createdAt: new Date(),
    };
    this.deliveryPartners.set(id, partner);
    return partner;
  }

  async updateDeliveryPartner(id: number, updates: Partial<DeliveryPartner>): Promise<DeliveryPartner | undefined> {
    const partner = this.deliveryPartners.get(id);
    if (partner) {
      const updated = { ...partner, ...updates };
      this.deliveryPartners.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId++;
    const customer: Customer = {
      ...insertCustomer,
      id,
    };
    this.customers.set(id, customer);
    return customer;
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByPartnerId(partnerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.deliveryPartnerId === partnerId
    );
  }

  async getActiveOrderByPartnerId(partnerId: number): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.deliveryPartnerId === partnerId && 
      !['delivered', 'cancelled'].includes(order.status)
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentId++;
    const order: Order = {
      ...insertOrder,
      id,
      orderNumber: this.generateOrderNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string, partnerId?: number): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      const updates: Partial<Order> = {
        status,
        updatedAt: new Date(),
      };
      
      if (partnerId !== undefined) {
        updates.deliveryPartnerId = partnerId;
      }
      
      if (status === 'delivered') {
        updates.actualDeliveryTime = new Date();
      }
      
      const updated = { ...order, ...updates };
      this.orders.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getAvailableOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === 'prepared' && !order.deliveryPartnerId
    );
  }

  // Earnings methods
  async getEarningsByPartnerId(partnerId: number): Promise<Earning[]> {
    return Array.from(this.earnings.values()).filter(
      (earning) => earning.deliveryPartnerId === partnerId
    );
  }

  async getTodayEarnings(partnerId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEarnings = Array.from(this.earnings.values()).filter(
      (earning) => earning.deliveryPartnerId === partnerId &&
      earning.date && earning.date >= today
    );
    
    return todayEarnings.reduce((total, earning) => total + parseFloat(earning.amount), 0);
  }

  async createEarning(insertEarning: InsertEarning): Promise<Earning> {
    const id = this.currentId++;
    const earning: Earning = {
      ...insertEarning,
      id,
      date: new Date(),
    };
    this.earnings.set(id, earning);
    return earning;
  }

  // Location methods
  async createPartnerLocation(insertLocation: InsertPartnerLocation): Promise<PartnerLocation> {
    const id = this.currentId++;
    const location: PartnerLocation = {
      ...insertLocation,
      id,
      timestamp: new Date(),
    };
    this.partnerLocations.set(id, location);
    return location;
  }

  async getPartnerLocations(partnerId: number, limit: number = 10): Promise<PartnerLocation[]> {
    return Array.from(this.partnerLocations.values())
      .filter((location) => location.deliveryPartnerId === partnerId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
