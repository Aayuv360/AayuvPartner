import type { Request, Response, NextFunction } from 'express';
import type Express from 'express';
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import bcrypt from 'bcrypt';
import session from 'express-session';
import connectDB from './db';
import { storage } from './storage';
import { 
  insertDeliveryPartnerSchema, 
  loginSchema,
  insertPartnerLocationSchema,
  type IDeliveryPartner,
  type IOrder,
  type ICustomer
} from '@shared/schema';

interface AuthenticatedRequest extends Request {
  partnerId?: string;
}

export async function registerRoutes(app: Express.Application): Promise<Server> {
  // Connect to MongoDB
  await connectDB();
  
  // Initialize sample data if needed
  await storage.initializeSampleData();

  // Session middleware for partner authentication
  app.use(session({
    secret: process.env.SESSION_SECRET || 'aayuv-delivery-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  const httpServer = createServer(app);
  
  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'partner_connect' && message.partnerId) {
          clients.set(message.partnerId, ws);
          console.log(`Partner ${message.partnerId} connected via WebSocket`);
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    });

    ws.on('close', () => {
      // Remove client from map when disconnected
      for (const [partnerId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(partnerId);
          console.log(`Partner ${partnerId} disconnected`);
          break;
        }
      }
    });
  });

  // Authentication middleware
  const authenticatePartner = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const partnerId = req.headers['x-partner-id'] as string;
    
    if (!partnerId) {
      return res.status(401).json({ error: 'No partner ID provided' });
    }

    try {
      const partner = await storage.getDeliveryPartner(partnerId);
      if (!partner) {
        return res.status(401).json({ error: 'Invalid partner' });
      }
      
      req.partnerId = partnerId;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertDeliveryPartnerSchema.parse(req.body);
      
      // Check if partner already exists
      const existingPartner = await storage.getDeliveryPartnerByEmail(validatedData.email);
      if (existingPartner) {
        return res.status(400).json({ error: "Partner with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create partner
      const partner = await storage.createDeliveryPartner({
        ...validatedData,
        password: hashedPassword
      });

      // Remove password from response
      const { password, ...partnerWithoutPassword } = partner.toObject();
      
      res.status(201).json(partnerWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find partner by email
      const partner = await storage.getDeliveryPartnerByEmail(validatedData.email);
      if (!partner) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, partner.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Remove password from response
      const { password, ...partnerWithoutPassword } = partner.toObject();
      
      res.json(partnerWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: 'Login failed' });
    }
  });

  // Partner profile routes
  app.get("/api/partner/profile", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const partner = await storage.getDeliveryPartner(req.partnerId!);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      const { password, ...partnerWithoutPassword } = partner.toObject();
      res.json(partnerWithoutPassword);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.patch("/api/partner/profile", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates via this route
      
      const updatedPartner = await storage.updateDeliveryPartner(req.partnerId!, updates);
      if (!updatedPartner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      const { password, ...partnerWithoutPassword } = updatedPartner.toObject();
      res.json(partnerWithoutPassword);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.patch("/api/partner/status", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isOnline } = req.body;
      
      const updatedPartner = await storage.updateDeliveryPartner(req.partnerId!, { isOnline });
      if (!updatedPartner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      res.json({ isOnline: updatedPartner.isOnline });
    } catch (error) {
      console.error('Status update error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  app.post("/api/partner/location", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertPartnerLocationSchema.parse({
        ...req.body,
        deliveryPartnerId: req.partnerId
      });
      
      // Update partner's current location
      await storage.updateDeliveryPartner(req.partnerId!, {
        currentLatitude: validatedData.latitude,
        currentLongitude: validatedData.longitude
      });
      
      // Store location history
      const location = await storage.createPartnerLocation(validatedData);
      
      // Broadcast location update to relevant clients
      broadcastLocationUpdate(req.partnerId!, validatedData.latitude, validatedData.longitude);
      
      res.json(location);
    } catch (error) {
      console.error('Location update error:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  // Order routes
  app.get("/api/orders/available", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orders = await storage.getAvailableOrders();
      res.json(orders);
    } catch (error) {
      console.error('Available orders fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch available orders' });
    }
  });

  app.get("/api/orders/active", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const activeOrder = await storage.getActiveOrderByPartnerId(req.partnerId!);
      res.json(activeOrder);
    } catch (error) {
      console.error('Active order fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch active order' });
    }
  });

  app.get("/api/orders/history", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orders = await storage.getOrdersByPartnerId(req.partnerId!);
      const completedOrders = orders.filter(order => order.status === 'delivered');
      res.json(completedOrders);
    } catch (error) {
      console.error('Order history fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch order history' });
    }
  });

  app.patch("/api/orders/:id/accept", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      
      const updatedOrder = await storage.updateOrderStatus(orderId, 'assigned', req.partnerId!);
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update partner's total deliveries
      const partner = await storage.getDeliveryPartner(req.partnerId!);
      if (partner) {
        await storage.updateDeliveryPartner(req.partnerId!, {
          totalDeliveries: partner.totalDeliveries + 1
        });
      }

      broadcastOrderUpdate(updatedOrder);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Order accept error:', error);
      res.status(500).json({ error: 'Failed to accept order' });
    }
  });

  app.patch("/api/orders/:id/status", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // If order is delivered, create earning record
      if (status === 'delivered') {
        await storage.createEarning({
          deliveryPartnerId: req.partnerId!,
          orderId: orderId,
          amount: updatedOrder.deliveryFee
        });

        // Update partner's total earnings
        const partner = await storage.getDeliveryPartner(req.partnerId!);
        if (partner) {
          const newTotalEarnings = parseFloat(partner.totalEarnings) + parseFloat(updatedOrder.deliveryFee);
          await storage.updateDeliveryPartner(req.partnerId!, {
            totalEarnings: newTotalEarnings.toString()
          });
        }
      }

      broadcastOrderUpdate(updatedOrder);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Order status update error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Earnings routes
  app.get("/api/earnings/today", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const todayEarnings = await storage.getTodayEarnings(req.partnerId!);
      res.json({ amount: todayEarnings });
    } catch (error) {
      console.error('Today earnings fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch today earnings' });
    }
  });

  app.get("/api/earnings/history", authenticatePartner, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const earnings = await storage.getEarningsByPartnerId(req.partnerId!);
      res.json(earnings);
    } catch (error) {
      console.error('Earnings history fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch earnings history' });
    }
  });

  // Helper function to calculate distance between two coordinates
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Delivery zones endpoint
  app.get("/api/delivery-zones", (req: Request, res: Response) => {
    const { lat, lng } = req.query;
    
    // Mock delivery zones with realistic data
    const zones = [
      {
        id: "zone-1",
        name: "Bandra West Commercial",
        centerLat: 19.0596,
        centerLng: 72.8295,
        radius: 1500,
        demandLevel: "surge",
        averageEarnings: "₹220/hr",
        activeOrders: 15,
        estimatedWaitTime: 8,
        distance: lat && lng ? calculateDistance(parseFloat(lat as string), parseFloat(lng as string), 19.0596, 72.8295) : 2.3,
        surgeMultiplier: 2.1
      },
      {
        id: "zone-2",
        name: "Andheri East IT Hub",
        centerLat: 19.1136,
        centerLng: 72.8697,
        radius: 2000,
        demandLevel: "high",
        averageEarnings: "₹180/hr",
        activeOrders: 11,
        estimatedWaitTime: 12,
        distance: lat && lng ? calculateDistance(parseFloat(lat as string), parseFloat(lng as string), 19.1136, 72.8697) : 3.7,
        surgeMultiplier: 1.6
      },
      {
        id: "zone-3",
        name: "Powai Tech Park",
        centerLat: 19.1197,
        centerLng: 72.9081,
        radius: 1800,
        demandLevel: "medium",
        averageEarnings: "₹145/hr",
        activeOrders: 7,
        estimatedWaitTime: 18,
        distance: lat && lng ? calculateDistance(parseFloat(lat as string), parseFloat(lng as string), 19.1197, 72.9081) : 5.2
      },
      {
        id: "zone-4",
        name: "Malad West Residential",
        centerLat: 19.1875,
        centerLng: 72.8259,
        radius: 2200,
        demandLevel: "low",
        averageEarnings: "₹120/hr",
        activeOrders: 4,
        estimatedWaitTime: 25,
        distance: lat && lng ? calculateDistance(parseFloat(lat as string), parseFloat(lng as string), 19.1875, 72.8259) : 7.8
      }
    ];

    // Sort by distance if location provided
    if (lat && lng) {
      zones.sort((a, b) => a.distance - b.distance);
    }

    res.json(zones);
  });

  // WebSocket broadcast functions
  function broadcastLocationUpdate(partnerId: string, latitude: string, longitude: string) {
    const message = JSON.stringify({
      type: 'location_update',
      partnerId,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all connected clients except the sender
    for (const [id, client] of clients.entries()) {
      if (id !== partnerId && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  function broadcastOrderUpdate(order: any) {
    const message = JSON.stringify({
      type: 'order_update',
      order,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all connected clients
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  return httpServer;
}