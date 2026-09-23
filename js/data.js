/**
 * Seed data and state persistence for Delivery Order & Rider Assignment Prototype
 */

const INITIAL_RIDERS = [
  {
    id: "RID-201",
    name: "Arjun Varma",
    phone: "+91 98480 12345",
    vehicle: "Motorcycle (Pulsar 150)",
    vehicleType: "Bike",
    location: "Bhanugudi Junction, Kakinada",
    distanceKm: 1.2,
    status: "Available", // Available | On Delivery | Offline
    currentOrderId: null,
    rating: 4.8,
    deliveriesCompleted: 142
  },
  {
    id: "RID-202",
    name: "Ravi Teja",
    phone: "+91 98481 23456",
    vehicle: "Honda Activa 6G",
    vehicleType: "Scooter",
    location: "RTC Complex Road, Kakinada",
    distanceKm: 2.4,
    status: "Available",
    currentOrderId: null,
    rating: 4.9,
    deliveriesCompleted: 198
  },
  {
    id: "RID-203",
    name: "Sameer Khan",
    phone: "+91 98482 34567",
    vehicle: "TVS Raider 125",
    vehicleType: "Bike",
    location: "Main Market, Kakinada",
    distanceKm: 3.1,
    status: "Available",
    currentOrderId: null,
    rating: 4.6,
    deliveriesCompleted: 87
  },
  {
    id: "RID-204",
    name: "Ananya Roy",
    phone: "+91 98483 45678",
    vehicle: "Ather 450X (EV)",
    vehicleType: "EV Scooter",
    location: "Cinema Road, Kakinada",
    distanceKm: 4.0,
    status: "On Delivery",
    currentOrderId: "ORD-1021",
    rating: 4.9,
    deliveriesCompleted: 215
  },
  {
    id: "RID-205",
    name: "Rajesh Kumar",
    phone: "+91 98484 56789",
    vehicle: "Hero Splendor Plus",
    vehicleType: "Bike",
    location: "Boat Club, Kakinada",
    distanceKm: 5.2,
    status: "Available",
    currentOrderId: null,
    rating: 4.5,
    deliveriesCompleted: 64
  },
  {
    id: "RID-206",
    name: "Suresh Babu",
    phone: "+91 98485 67890",
    vehicle: "Bajaj Chetak (EV)",
    vehicleType: "EV Scooter",
    location: "Port Road, Kakinada",
    distanceKm: 6.5,
    status: "Offline",
    currentOrderId: null,
    rating: 4.7,
    deliveriesCompleted: 110
  }
];

const INITIAL_ORDERS = [
  {
    id: "ORD-1024",
    customerName: "Rahul Sharma",
    phone: "+91 98765 43210",
    address: "Flat 402, Sai Residency, Bhanugudi, Kakinada",
    amount: 650,
    priority: "Normal", // Normal | Express | Urgent
    status: "Pending", // Pending | Assigned | Out for Delivery | Delivered | Cancelled
    orderTime: "Today, 09:30 PM",
    timestamp: Date.now() - 30 * 60 * 1000,
    assignedRiderId: null,
    items: "2x Paneer Biryani, 1x Butter Naan, Cold Drink",
    timeline: [
      { step: "Order Created", time: "Today, 09:30 PM", completed: true, note: "Order placed by customer via app" }
    ]
  },
  {
    id: "ORD-1025",
    customerName: "Priya Varma",
    phone: "+91 98765 11223",
    address: "H.No 12-4-8, Surya Rao Peta, Kakinada",
    amount: 1240,
    priority: "Urgent",
    status: "Pending",
    orderTime: "Today, 09:15 PM",
    timestamp: Date.now() - 45 * 60 * 1000,
    assignedRiderId: null,
    items: "Medical Supplies & Prescription Essentials",
    timeline: [
      { step: "Order Created", time: "Today, 09:15 PM", completed: true, note: "Urgent medical delivery request" }
    ]
  },
  {
    id: "ORD-1026",
    customerName: "Kiran Kumar",
    phone: "+91 98765 99887",
    address: "Near JNTU Campus, Nagamallithota, Kakinada",
    amount: 420,
    priority: "Express",
    status: "Pending",
    orderTime: "Today, 09:05 PM",
    timestamp: Date.now() - 55 * 60 * 1000,
    assignedRiderId: null,
    items: "1x Special Veg Burger Combo, 1x Belgian Waffle",
    timeline: [
      { step: "Order Created", time: "Today, 09:05 PM", completed: true, note: "Express dispatch requested" }
    ]
  },
  {
    id: "ORD-1021",
    customerName: "Deepak Rao",
    phone: "+91 97654 32109",
    address: "Plot 88, Jagannaickpur, Kakinada",
    amount: 890,
    priority: "Express",
    status: "Out for Delivery",
    orderTime: "Today, 08:20 PM",
    timestamp: Date.now() - 100 * 60 * 1000,
    assignedRiderId: "RID-204",
    items: "Grocery Bundle (Milk, Bread, Eggs, Fruits)",
    timeline: [
      { step: "Order Created", time: "Today, 08:20 PM", completed: true, note: "Order received" },
      { step: "Rider Assigned", time: "Today, 08:25 PM", completed: true, note: "Assigned to Ananya Roy" },
      { step: "Picked Up", time: "Today, 08:35 PM", completed: true, note: "Package picked up from hub" },
      { step: "Out for Delivery", time: "Today, 08:45 PM", completed: true, note: "Rider is 1.5 km away from destination" }
    ]
  },
  {
    id: "ORD-1020",
    customerName: "Sneha Reddy",
    phone: "+91 91234 56789",
    address: "D.No 5-2-19, Gandhinagar, Kakinada",
    amount: 1550,
    priority: "Normal",
    status: "Delivered",
    orderTime: "Today, 07:10 PM",
    timestamp: Date.now() - 170 * 60 * 1000,
    assignedRiderId: "RID-202",
    items: "Electronics Accessories & Charging Hub",
    timeline: [
      { step: "Order Created", time: "Today, 07:10 PM", completed: true, note: "Order confirmed" },
      { step: "Rider Assigned", time: "Today, 07:15 PM", completed: true, note: "Assigned to Ravi Teja" },
      { step: "Picked Up", time: "Today, 07:28 PM", completed: true, note: "Picked up at merchant store" },
      { step: "Out for Delivery", time: "Today, 07:35 PM", completed: true, note: "On transit" },
      { step: "Delivered", time: "Today, 07:55 PM", completed: true, note: "Delivered safely with OTP verification" }
    ]
  },
  {
    id: "ORD-1019",
    customerName: "Vikram Adithya",
    phone: "+91 99887 76655",
    address: "Block B, Green Meadows, Ramanayyapeta, Kakinada",
    amount: 320,
    priority: "Normal",
    status: "Delivered",
    orderTime: "Today, 06:45 PM",
    timestamp: Date.now() - 200 * 60 * 1000,
    assignedRiderId: "RID-201",
    items: "Evening Refreshments & Snacks",
    timeline: [
      { step: "Order Created", time: "Today, 06:45 PM", completed: true, note: "Order initiated" },
      { step: "Rider Assigned", time: "Today, 06:50 PM", completed: true, note: "Assigned to Arjun Varma" },
      { step: "Picked Up", time: "Today, 07:00 PM", completed: true, note: "Picked up from café" },
      { step: "Out for Delivery", time: "Today, 07:12 PM", completed: true, note: "On the way" },
      { step: "Delivered", time: "Today, 07:28 PM", completed: true, note: "Delivered to customer doorstep" }
    ]
  }
];

const STORAGE_KEYS = {
  ORDERS: "delivery_app_orders_v1",
  RIDERS: "delivery_app_riders_v1",
  THEME: "delivery_app_theme",
  NOTIFICATIONS: "delivery_app_notifications"
};

class DataStore {
  static getOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Could not read orders from localStorage, using seed data", e);
    }
    this.saveOrders(INITIAL_ORDERS);
    return JSON.parse(JSON.stringify(INITIAL_ORDERS));
  }

  static saveOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error("Failed to save orders to localStorage", e);
    }
  }

  static getRiders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RIDERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Could not read riders from localStorage, using seed data", e);
    }
    this.saveRiders(INITIAL_RIDERS);
    return JSON.parse(JSON.stringify(INITIAL_RIDERS));
  }

  static saveRiders(riders) {
    try {
      localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(riders));
    } catch (e) {
      console.error("Failed to save riders to localStorage", e);
    }
  }

  static resetToDefault() {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(INITIAL_RIDERS));
    } catch (e) {
      console.error("Reset failed", e);
    }
  }
}
