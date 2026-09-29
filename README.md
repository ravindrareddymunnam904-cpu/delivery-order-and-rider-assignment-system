# Delivery Order & Rider Assignment System

A modern, responsive, and interactive web application prototype designed for a college project demonstration. The system illustrates how delivery logistics hubs manage customer orders, monitor rider fleet availability, match orders using proximity heuristics, and track delivery lifecycles in real time.

---

## 🚀 Key Features

- **Operations Dashboard**:
  - Live KPI metrics for *Total Orders*, *Pending Orders*, *Delivered Orders*, and *Available Riders*.
  - Recent orders table with real-time status badges and instant dispatch triggers.
  - Active fleet roster displaying rider vehicles and distance metrics.

- **Proximity Rider Assignment Console (Core Feature)**:
  - Interactive split-pane matching workflow.
  - Left pane displays all unassigned (`Pending`) orders with priority indicators (*Normal*, *Express*, *Urgent*).
  - Right pane sorts available riders by distance (e.g., `1.2 km`, `2.4 km`, `3.1 km`).
  - **One-Click Assign**: Immediately shifts order status to `Assigned`, assigns the rider, and updates rider status to `On Delivery`.
  - **Smart Auto-Assign**: Heuristic button to automatically dispatch the nearest available rider to the highest priority pending order.

- **Order Management & Creation**:
  - Full order roster with multi-parameter search (Customer Name, Order ID, Phone, Address).
  - Status filters (*Pending, Assigned, Out for Delivery, Delivered, Cancelled*) and Priority filters.
  - **"Create Order" Modal**: Interactive form with automatic sequential Order ID generation (`#ORD-XXXX`).

- **Live Order Simulation Engine**:
  - Global simulation control bar with Play/Pause toggles and speed multipliers (`1x`, `2x`, `5x`).
  - Automatically advances active deliveries through lifecycle stages (`Assigned` ➔ `Picked Up` ➔ `Out for Delivery` ➔ `Delivered`).
  - Realistic **"Spawn Sim Order"** generator to dynamically insert live incoming customer orders during viva presentations.

- **Simulated Customer Smartphone Device (Mobile Preview)**:
  - Realistic smartphone device mockup with Dynamic Island notch, status bar, and real-time clock.
  - Interactive live tracking view with customer order selector, rider profile, and animated route progress bar with moving motorbike indicator.
  - Full customer push notification inbox recording chronological delivery alerts.
  - Web Audio API acoustic chime generator producing authentic smartphone push notification sounds and urgent traffic alert chimes without external media files.

- **Dynamic Live ETA Countdown & Verification**:
  - Real-time digital ETA countdown clock calculating remaining delivery time based on rider distance and status.
  - Visual verification badges (`🟢 ETA Verified: On Schedule` vs `⚠️ High Traffic Delay (+10m)`).
  - Integrated into Dashboard recent orders, Order Management table, Order Details modal, and Customer Device.

- **High Traffic Congestion Incident & Fast Customer Push Alert**:
  - One-click trigger for heavy road traffic congestion incidents with **Configurable Delay Durations** (`+5m`, `+10m`, `+15m`, `+20m`, or custom minutes).
  - Dynamically recalculates ETA countdown and adjusts rider delivery pace.
  - **Fast push notification dispatched directly to customer device**:
    $$\text{"order delayed wait for } \mathbf{\{delayMinutes\}} \text{ minutes"}$$
  - Drops down an animated push banner from the smartphone Dynamic Island with acoustic chime sound and haptic vibration simulation.
  - Resolvable traffic control button to immediately restore standard delivery transit.

- **Live Fleet & Delivery GPS Vector Map (Kakinada City)**:
  - Interactive SVG map featuring city landmarks (*Central Logistics Hub, Bhanugudi Junction, Surya Rao Peta, JNTUK Campus, Jagannaickpur, RTC Complex, Kakinada Port*).
  - Real-time animated rider markers with glowing trajectory paths and road congestion overlays.
  - Live GPS Telemetry card tracking Latitude, Longitude, Rider Speed (km/h), Route Congestion Status, and Street details in real time.
  - Recenter and Traffic Heatmap toggle buttons.
  - Dual tracking modes on customer phone: **🛣️ Stepper View** and **🗺️ Mini GPS Map View**.

- **5-Stage Live Lifecycle Timeline**:
  - Order details modal featuring an interactive tracking stepper:
    $$\text{Order Created} \longrightarrow \text{Rider Assigned} \longrightarrow \text{Picked Up} \longrightarrow \text{Out for Delivery} \longrightarrow \text{Delivered}$$
  - Step-by-step manual progression buttons (*Mark as Picked Up*, *Mark as Out for Delivery*, *Mark as Delivered*).
  - Marking an order as `Delivered` automatically returns the assigned rider to `Available` status.

- **Rider Fleet Management**:
  - Rider roster with vehicle category details (Motorcycle, Scooter, EV Scooter), ratings, and active delivery linkage.
  - **"Add Rider" Modal**: Form to register new delivery personnel into the fleet.

- **Dual Theme Support**:
  - Instant toggle between **Light Mode** and **Dark Mode** with choice persisted in browser `localStorage`.

- **College Project Demo Tools (Settings)**:
  - **"Reset to Default Seed Data"**: One-click restore button allowing reset back to default demo state for repeat viva presentations.
  - **"Export Orders (JSON)"**: One-click download of current orders snapshot.

---

## 🛠️ Technology Stack

- **HTML5**: Semantic and accessible single-page layout.
- **Vanilla CSS3**: Custom design system using CSS variables, flexbox, CSS grid, and responsive drawer navigation.
- **Vanilla JavaScript (ES6+)**: Reactive state management, DOM manipulation, and `localStorage` persistence.
- **Zero External Dependencies**: Runs natively in any browser with zero build steps or `node_modules`.

---

## 📂 Project Structure

```text
delivery/
├── index.html        # Main single-page application structure & modals
├── css/
│   └── styles.css    # Light/Dark design system, layout, and component styles
├── js/
│   ├── data.js       # Seed datasets & localStorage state management
│   └── app.js        # Event listeners, assignment logic & timeline controller
├── README.md         # Project documentation & demonstration guide
└── .gitignore        # Git ignore rules
```

---

## 💻 How to Run Locally

### Option 1: Direct File Open
Simply double-click `index.html` or open it in any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Using Python Local Server
```bash
python -m http.server 8085
```
Then navigate to: **`http://localhost:8085`**

