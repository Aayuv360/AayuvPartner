import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  loginSchema, 
  registerSchema, 
  insertOrderSchema,
  insertPartnerLocationSchema 
} from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Express.Request {
  partnerId?: number;
}

const connectedPartners = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const authenticatePartner = async (req: AuthenticatedRequest, res: Express.Response, next: Express.NextFunction) => {
    const partnerId = req.headers['x-partner-id'];
    if (!partnerId || isNaN(Number(partnerId))) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.partnerId = Number(partnerId);
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const { confirmPassword, ...partnerData } = data;
      
      const existingPartner = await storage.getDeliveryPartnerByEmail(data.email);
      if (existingPartner) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const partner = await storage.createDeliveryPartner(partnerData);
      res.json({ partner: { ...partner, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const partner = await storage.getDeliveryPartnerByEmail(email);
      if (!partner || partner.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ partner: { ...partner, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Partner routes
  app.get("/api/partner/profile", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const partner = await storage.getDeliveryPartner(req.partnerId!);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json({ ...partner, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/partner/profile", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      delete updates.id;
      delete updates.password;
      
      const partner = await storage.updateDeliveryPartner(req.partnerId!, updates);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json({ ...partner, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/partner/status", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const { isOnline } = req.body;
      const partner = await storage.updateDeliveryPartner(req.partnerId!, { isOnline });
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json({ isOnline: partner.isOnline });
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Location routes
  app.post("/api/partner/location", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const locationData = insertPartnerLocationSchema.parse({
        ...req.body,
        deliveryPartnerId: req.partnerId,
      });
      
      const location = await storage.createPartnerLocation(locationData);
      
      // Update partner's current location
      await storage.updateDeliveryPartner(req.partnerId!, {
        currentLatitude: locationData.latitude,
        currentLongitude: locationData.longitude,
      });

      // Broadcast location update via WebSocket
      broadcastLocationUpdate(req.partnerId!, locationData.latitude, locationData.longitude);
      
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Order routes
  app.get("/api/orders/available", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await storage.getAvailableOrders();
      const ordersWithCustomers = await Promise.all(
        orders.map(async (order) => {
          const customer = await storage.getCustomer(order.customerId!);
          return { ...order, customer };
        })
      );
      res.json(ordersWithCustomers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  app.get("/api/orders/active", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getActiveOrderByPartnerId(req.partnerId!);
      if (!order) {
        return res.json(null);
      }
      
      const customer = await storage.getCustomer(order.customerId!);
      res.json({ ...order, customer });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active order" });
    }
  });

  app.get("/api/orders/history", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await storage.getOrdersByPartnerId(req.partnerId!);
      const completedOrders = orders.filter(order => 
        ['delivered', 'cancelled'].includes(order.status)
      );
      
      const ordersWithCustomers = await Promise.all(
        completedOrders.map(async (order) => {
          const customer = await storage.getCustomer(order.customerId!);
          return { ...order, customer };
        })
      );
      
      res.json(ordersWithCustomers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order history" });
    }
  });

  app.patch("/api/orders/:id/accept", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.updateOrderStatus(orderId, "assigned", req.partnerId!);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Broadcast order update
      broadcastOrderUpdate(order);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept order" });
    }
  });

  app.patch("/api/orders/:id/status", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If order is delivered, create earning record
      if (status === 'delivered' && order.deliveryFee) {
        await storage.createEarning({
          deliveryPartnerId: req.partnerId!,
          orderId: order.id,
          amount: order.deliveryFee,
        });
        
        // Update partner's total earnings and deliveries
        const partner = await storage.getDeliveryPartner(req.partnerId!);
        if (partner) {
          const newTotalEarnings = parseFloat(partner.totalEarnings) + parseFloat(order.deliveryFee);
          await storage.updateDeliveryPartner(req.partnerId!, {
            totalEarnings: newTotalEarnings.toString(),
            totalDeliveries: partner.totalDeliveries + 1,
          });
        }
      }

      // Broadcast order update
      broadcastOrderUpdate(order);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Earnings routes
  app.get("/api/earnings/today", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const todayEarnings = await storage.getTodayEarnings(req.partnerId!);
      const todayDeliveries = await storage.getOrdersByPartnerId(req.partnerId!);
      const todayDeliveryCount = todayDeliveries.filter(order => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return order.actualDeliveryTime && order.actualDeliveryTime >= today;
      }).length;
      
      res.json({
        todayEarnings,
        todayDeliveries: todayDeliveryCount,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's earnings" });
    }
  });

  app.get("/api/earnings/history", authenticatePartner, async (req: AuthenticatedRequest, res) => {
    try {
      const earnings = await storage.getEarningsByPartnerId(req.partnerId!);
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch earnings history" });
    }
  });

  // WebSocket server setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.partnerId) {
          connectedPartners.set(data.partnerId, ws);
          ws.send(JSON.stringify({ type: 'auth_success' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove partner from connected partners
      for (const [partnerId, socket] of connectedPartners.entries()) {
        if (socket === ws) {
          connectedPartners.delete(partnerId);
          break;
        }
      }
    });
  });

  function broadcastLocationUpdate(partnerId: number, latitude: string, longitude: string) {
    const ws = connectedPartners.get(partnerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'location_update',
        partnerId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  function broadcastOrderUpdate(order: any) {
    // Broadcast to all connected partners
    connectedPartners.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'order_update',
          order,
        }));
      }
    });
  }

  return httpServer;
}
