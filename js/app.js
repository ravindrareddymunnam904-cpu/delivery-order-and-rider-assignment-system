/**
 * Delivery Order & Rider Assignment - Application Controller
 * Handles SPA navigation, theme switching, state synchronization,
 * proximity assignment workflows, live order simulation, dynamic ETA verification,
 * high traffic incident alerting, and simulated customer smartphone tracking.
 */

(function () {
  'use strict';

  // ==========================================================================
  // Application State
  // ==========================================================================
  let orders = [];
  let riders = [];
  let selectedAssignmentOrderId = null;
  let activeDetailOrderId = null;
  let quickAssignOrderId = null;
  let activeCustomerPhoneOrderId = null;
  let selectedTrafficDelayMinutes = 10;
  let mapSelectedOrderId = null;
  let isTrafficLayerVisible = true;

  let notifications = [
    { id: 1, text: "System initialized with Kakinada logistics demo data.", time: "Just now", type: "info" },
    { id: 2, text: "Order #ORD-1025 marked as Urgent medical dispatch.", time: "45m ago", type: "warning" },
    { id: 3, text: "Rider Ananya Roy is Out for Delivery with #ORD-1021.", time: "1h ago", type: "info" }
  ];

  // ==========================================================================
  // Web Audio API Synthesizer (Realistic Phone Chimes & Traffic Alerts)
  // ==========================================================================
  class SoundAlert {
    static playTrafficChime() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const playTone = (freq, startTime, duration, type = 'sine', gainLevel = 0.16) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(gainLevel, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        // Urgent multi-tone alert for High Traffic Delay
        playTone(784, now, 0.18, 'triangle', 0.2);          // G5
        playTone(523.25, now + 0.16, 0.22, 'triangle', 0.18); // C5
        playTone(880, now + 0.38, 0.28, 'sine', 0.22);       // A5
        playTone(659.25, now + 0.58, 0.35, 'sine', 0.18);    // E5
      } catch (e) {
        // Silently catch audio policy blocks
      }
    }

    static playNotificationBeep() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } catch (e) {}
    }
  }

  // ==========================================================================
  // DOM References
  // ==========================================================================
  const dom = {
    // Nav & Layout
    pageTitle: document.getElementById("page-title"),
    navLinks: document.querySelectorAll(".nav-link"),
    viewSections: document.querySelectorAll(".view-section"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    globalSearchInput: document.getElementById("global-search-input"),

    // Theme & Notifications
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    themeIconSun: document.getElementById("theme-icon-sun"),
    themeIconMoon: document.getElementById("theme-icon-moon"),
    notificationBtn: document.getElementById("notification-btn"),
    notificationPopover: document.getElementById("notification-popover"),
    notifPopoverList: document.getElementById("notif-popover-list"),
    notifBadgeDot: document.getElementById("notif-badge-dot"),
    clearNotifsBtn: document.getElementById("clear-notifs-btn"),
    toastContainer: document.getElementById("toast-container"),

    // Customer Smartphone Trigger in Topbar
    openCustomerDeviceBtn: document.getElementById("open-customer-device-btn"),
    customerTopAlertPill: document.getElementById("customer-top-alert-pill"),

    // Live Simulation Control Bar
    simulationBar: document.getElementById("simulation-bar"),
    simStatusBadge: document.getElementById("sim-status-badge"),
    simStatusText: document.getElementById("sim-status-text"),
    simToggleBtn: document.getElementById("sim-toggle-btn"),
    simToggleLabel: document.getElementById("sim-toggle-label"),
    simSpeedBtns: document.querySelectorAll(".speed-btn"),
    simActiveSummary: document.getElementById("sim-active-summary"),
    simTriggerTrafficBtn: document.getElementById("sim-trigger-traffic-btn"),
    simSpawnOrderBtn: document.getElementById("sim-spawn-order-btn"),
    simOpenPhoneBtn: document.getElementById("sim-open-phone-btn"),

    // Badges
    navOrdersCount: document.getElementById("nav-orders-count"),
    navRidersCount: document.getElementById("nav-riders-count"),
    navUnassignedCount: document.getElementById("nav-unassigned-count"),

    // Dashboard
    kpiTotalOrders: document.getElementById("kpi-total-orders"),
    kpiPendingOrders: document.getElementById("kpi-pending-orders"),
    kpiDeliveredOrders: document.getElementById("kpi-delivered-orders"),
    kpiAvailableRiders: document.getElementById("kpi-available-riders"),
    dashRecentOrdersTbody: document.getElementById("dashboard-recent-orders-tbody"),
    dashAvailableRidersList: document.getElementById("dashboard-available-riders-list"),
    dashQuickAssignBtn: document.getElementById("dash-quick-assign-btn"),
    dashCreateOrderBtn: document.getElementById("dash-create-order-btn"),
    dashViewAllOrdersBtn: document.getElementById("dash-view-all-orders-btn"),
    dashViewAllRidersBtn: document.getElementById("dash-view-all-riders-btn"),

    // Orders View
    ordersCreateOrderBtn: document.getElementById("orders-create-order-btn"),
    ordersSearchInput: document.getElementById("orders-search-input"),
    ordersStatusFilter: document.getElementById("orders-status-filter"),
    ordersPriorityFilter: document.getElementById("orders-priority-filter"),
    ordersCountLabel: document.getElementById("orders-count-label"),
    ordersTableTbody: document.getElementById("orders-table-tbody"),

    // Riders View
    ridersAddRiderBtn: document.getElementById("riders-add-rider-btn"),
    ridersSearchInput: document.getElementById("riders-search-input"),
    ridersStatusFilter: document.getElementById("riders-status-filter"),
    ridersCountLabel: document.getElementById("riders-count-label"),
    ridersCardsGrid: document.getElementById("riders-cards-grid"),

    // Assignments View
    unassignedBadgeCount: document.getElementById("unassigned-badge-count"),
    unassignedOrdersContainer: document.getElementById("unassigned-orders-container"),
    availableBadgeCount: document.getElementById("available-badge-count"),
    selectedOrderSummaryBox: document.getElementById("selected-order-summary-box"),
    summaryOrderId: document.getElementById("summary-order-id"),
    summaryOrderPriority: document.getElementById("summary-order-priority"),
    summaryOrderDetails: document.getElementById("summary-order-details"),
    matchingRidersContainer: document.getElementById("matching-riders-container"),
    autoAssignSmartBtn: document.getElementById("auto-assign-smart-btn"),

    // Settings
    settingsThemeSwitch: document.getElementById("settings-theme-switch"),
    resetDemoDataBtn: document.getElementById("reset-demo-data-btn"),
    exportOrdersBtn: document.getElementById("export-orders-btn"),
    saveProfileBtn: document.getElementById("save-profile-btn"),
    profileNameInput: document.getElementById("profile-name-input"),
    profileHubInput: document.getElementById("profile-hub-input"),

    // Modals
    modalCreateOrder: document.getElementById("modal-create-order"),
    createOrderForm: document.getElementById("create-order-form"),
    modalAddRider: document.getElementById("modal-add-rider"),
    addRiderForm: document.getElementById("add-rider-form"),
    modalOrderDetails: document.getElementById("modal-order-details"),
    modalQuickAssign: document.getElementById("modal-quick-assign"),
    quickAssignOrderLabel: document.getElementById("quick-assign-order-label"),
    quickAssignRidersList: document.getElementById("quick-assign-riders-list"),

    // Order Details Elements
    detailModalOrderId: document.getElementById("detail-modal-order-id"),
    detailModalTime: document.getElementById("detail-modal-time"),
    detailCustomerName: document.getElementById("detail-customer-name"),
    detailCustomerPhone: document.getElementById("detail-customer-phone"),
    detailStatusBadge: document.getElementById("detail-status-badge"),
    detailPriorityTag: document.getElementById("detail-priority-tag"),
    detailAddress: document.getElementById("detail-address"),
    detailItems: document.getElementById("detail-items"),
    detailAmount: document.getElementById("detail-amount"),
    detailRiderName: document.getElementById("detail-rider-name"),
    detailRiderPhone: document.getElementById("detail-rider-phone"),
    orderTimelineStepper: document.getElementById("order-timeline-stepper"),
    detailTimelineActions: document.getElementById("detail-timeline-actions"),

    // Order Details Live ETA Box
    detailEtaBox: document.getElementById("detail-eta-box"),
    detailLiveEtaClock: document.getElementById("detail-live-eta-clock"),
    detailLiveTrafficBadge: document.getElementById("detail-live-traffic-badge"),
    detailProgressFill: document.getElementById("detail-progress-fill"),
    detailTransitText: document.getElementById("detail-transit-text"),
    detailTriggerTrafficBtn: document.getElementById("detail-trigger-traffic-btn"),
    detailResolveTrafficBtn: document.getElementById("detail-resolve-traffic-btn"),
    detailOpenPhoneBtn: document.getElementById("detail-open-phone-btn"),

    // Simulated Customer Smartphone Device Modal
    modalCustomerDevice: document.getElementById("modal-customer-device"),
    phoneDevice: document.getElementById("phone-device"),
    phonePushBanner: document.getElementById("phone-push-banner"),
    pushBannerTime: document.getElementById("push-banner-time"),
    pushBannerTitle: document.getElementById("push-banner-title"),
    pushBannerBody: document.getElementById("push-banner-body"),
    phoneClock: document.getElementById("phone-clock"),
    phoneOrderSelect: document.getElementById("phone-order-select"),
    phoneTrafficAlertBox: document.getElementById("phone-traffic-alert-box"),
    phoneTrafficAlertText: document.getElementById("phone-traffic-alert-text"),
    phoneResolveTrafficBtn: document.getElementById("phone-resolve-traffic-btn"),
    phoneEtaCard: document.getElementById("phone-eta-card"),
    phoneEtaBadge: document.getElementById("phone-eta-badge"),
    phoneCountdownClock: document.getElementById("phone-countdown-clock"),
    phoneArrivalTime: document.getElementById("phone-arrival-time"),
    phoneRouteFill: document.getElementById("phone-route-fill"),
    phoneRouteRider: document.getElementById("phone-route-rider"),
    phoneRouteCaption: document.getElementById("phone-route-caption"),
    phoneRiderCard: document.getElementById("phone-rider-card"),
    phoneRiderAvatar: document.getElementById("phone-rider-avatar"),
    phoneRiderName: document.getElementById("phone-rider-name"),
    phoneRiderSub: document.getElementById("phone-rider-sub"),
    phoneRiderPhone: document.getElementById("phone-rider-phone"),
    phoneCallRiderBtn: document.getElementById("phone-call-rider-btn"),
    phoneOrderId: document.getElementById("phone-order-id"),
    phoneOrderItems: document.getElementById("phone-order-items"),
    phoneOrderAmount: document.getElementById("phone-order-amount"),
    phoneOrderAddress: document.getElementById("phone-order-address"),
    phoneNotifCount: document.getElementById("phone-notif-count"),
    phoneNotifsList: document.getElementById("phone-notifs-list"),
    phoneTestTrafficBtn: document.getElementById("phone-test-traffic-btn"),
    phoneTestAdvanceBtn: document.getElementById("phone-test-advance-btn"),
    phoneSoundToggle: document.getElementById("phone-sound-toggle"),

    // Custom Delay Selectors
    simTrafficDelaySelect: document.getElementById("sim-traffic-delay-select"),
    simDelayMinDisplay: document.getElementById("sim-delay-min-display"),
    detailTrafficDelaySelect: document.getElementById("detail-traffic-delay-select"),
    detailDelayMinDisplay: document.getElementById("detail-delay-min-display"),
    phoneDelaySelect: document.getElementById("phone-delay-select"),
    phoneDelayBtnLabel: document.getElementById("phone-delay-btn-label"),

    // GPS Map View Elements
    navMap: document.getElementById("nav-map"),
    viewMap: document.getElementById("view-map"),
    mapRecenterBtn: document.getElementById("map-recenter-btn"),
    mapToggleTrafficLayerBtn: document.getElementById("map-toggle-traffic-layer-btn"),
    mapOrderFilter: document.getElementById("map-order-filter"),
    cityVectorMap: document.getElementById("city-vector-map"),
    mapActiveRoutes: document.getElementById("map-active-routes"),
    mapTrafficZones: document.getElementById("map-traffic-zones"),
    mapDestinations: document.getElementById("map-destinations"),
    mapRiders: document.getElementById("map-riders"),
    telemetryOrderId: document.getElementById("telemetry-order-id"),
    telemetryLat: document.getElementById("telemetry-lat"),
    telemetryLng: document.getElementById("telemetry-lng"),
    telemetrySpeed: document.getElementById("telemetry-speed"),
    telemetryTrafficStatus: document.getElementById("telemetry-traffic-status"),
    telemetryStreet: document.getElementById("telemetry-street"),
    telemetryDestAddress: document.getElementById("telemetry-dest-address"),
    telemetryTriggerTrafficBtn: document.getElementById("telemetry-trigger-traffic-btn"),
    telemetryOpenPhoneBtn: document.getElementById("telemetry-open-phone-btn"),
    telemetryActiveRidersCount: document.getElementById("telemetry-active-riders-count"),
    riderTelemetryList: document.getElementById("rider-telemetry-list"),

    // Phone Tabs & Mini Map
    phoneTabStepper: document.getElementById("phone-tab-stepper"),
    phoneTabMap: document.getElementById("phone-tab-map"),
    phoneStepperView: document.getElementById("phone-stepper-view"),
    phoneMapView: document.getElementById("phone-map-view"),
    phoneMiniSvgMap: document.getElementById("phone-mini-svg-map"),
    phoneMiniRouteLine: document.getElementById("phone-mini-route-line"),
    phoneMiniRiderMarker: document.getElementById("phone-mini-rider-marker"),
    phoneMiniGps: document.getElementById("phone-mini-gps"),
    phoneMiniSpeed: document.getElementById("phone-mini-speed")
  };

  // ==========================================================================
  // Helper Functions
  // ==========================================================================
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "warning") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `
      <div style="color: ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : 'var(--danger)'}; display:flex; align-items:center;">
        ${iconSvg}
      </div>
      <div style="flex:1;">${escapeHTML(message)}</div>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function addNotification(text, type = "info") {
    const notif = {
      id: Date.now(),
      text,
      time: "Just now",
      type
    };
    notifications.unshift(notif);
    if (notifications.length > 10) notifications.pop();
    renderNotifications();
    dom.notifBadgeDot.style.display = "block";
  }

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Pending": return "badge-pending";
      case "Assigned": return "badge-assigned";
      case "Picked Up": return "badge-transit";
      case "Out for Delivery": return "badge-transit";
      case "Delivered": return "badge-delivered";
      case "Cancelled": return "badge-cancelled";
      case "Available": return "badge-available";
      case "On Delivery": return "badge-ondelivery";
      case "Offline": return "badge-offline";
      default: return "";
    }
  }

  function getFormattedCurrentTime() {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `Today, ${hours < 10 ? "0" + hours : hours}:${strMinutes} ${ampm}`;
  }

  function formatMinutesSeconds(totalSeconds) {
    if (totalSeconds == null || totalSeconds < 0) return "00:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function getEstimatedArrivalTime(secondsRemaining) {
    const target = new Date(Date.now() + (secondsRemaining || 0) * 1000);
    let hours = target.getHours();
    const minutes = target.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours < 10 ? "0" + hours : hours}:${strMinutes} ${ampm}`;
  }

  function findRiderById(riderId) {
    return riders.find(r => r.id === riderId) || null;
  }

  function findOrderById(orderId) {
    return orders.find(o => o.id === orderId) || null;
  }

  // Generate Table Live ETA Badge HTML
  function getOrderEtaBadgeHtml(order) {
    if (order.status === "Delivered") {
      return `<span class="eta-pill eta-pill-delivered">✅ Delivered</span>`;
    }
    if (order.status === "Cancelled") {
      return `<span class="eta-pill">❌ Cancelled</span>`;
    }
    if (order.status === "Pending") {
      return `<span class="eta-pill eta-pill-pending">⏳ Est. ~${order.etaMinutes || 28}m</span>`;
    }
    if (order.status === "Assigned") {
      return `<span class="eta-pill eta-pill-transit">🛵 Dispatched (~${order.etaMinutes || 20}m)</span>`;
    }
    if (order.status === "Picked Up") {
      return `<span class="eta-pill eta-pill-transit">📦 Picked Up (~${order.etaMinutes || 15}m)</span>`;
    }
    if (order.status === "Out for Delivery") {
      if (order.trafficDelayed) {
        const delayM = order.trafficDelayMinutes || 10;
        return `<span class="eta-pill eta-pill-traffic" title="High Traffic Delay (+${delayM}m active)">⚠️ Delay (+${delayM}m): ${formatMinutesSeconds(order.etaSecondsRemaining)}</span>`;
      }
      return `<span class="eta-pill eta-pill-transit">🟢 ${formatMinutesSeconds(order.etaSecondsRemaining)} (Verified)</span>`;
    }
    return `<span class="eta-pill">—</span>`;
  }

  // ==========================================================================
  // Live Simulation Engine
  // ==========================================================================
  const SimulationEngine = {
    isRunning: false,
    speed: 1, // 1x, 2x, 5x
    timer: null,

    start() {
      this.isRunning = true;
      if (dom.simStatusBadge) {
        dom.simStatusBadge.className = "sim-status-badge running";
        dom.simStatusText.textContent = `Simulation: Active (${this.speed}x)`;
      }
      if (dom.simToggleLabel) dom.simToggleLabel.textContent = "Pause Simulation";

      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 1000);
      showToast(`Live simulation started at ${this.speed}x speed. Active orders advancing in real-time!`, "success");
      updateSimulationSummary();
    },

    pause() {
      this.isRunning = false;
      if (dom.simStatusBadge) {
        dom.simStatusBadge.className = "sim-status-badge paused";
        dom.simStatusText.textContent = "Simulation: Paused";
      }
      if (dom.simToggleLabel) dom.simToggleLabel.textContent = "Start Simulation";

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      showToast("Live simulation paused.", "info");
      updateSimulationSummary();
    },

    toggle() {
      if (this.isRunning) this.pause();
      else this.start();
    },

    setSpeed(speedVal) {
      this.speed = speedVal;
      dom.simSpeedBtns.forEach(btn => {
        if (Number(btn.getAttribute("data-speed")) === speedVal) btn.classList.add("active");
        else btn.classList.remove("active");
      });
      if (this.isRunning) {
        dom.simStatusText.textContent = `Simulation: Active (${this.speed}x)`;
        showToast(`Simulation speed adjusted to ${this.speed}x`, "info");
      }
      updateSimulationSummary();
    },

    tick() {
      let stateChanged = false;

      orders.forEach(order => {
        if (order.status === "Assigned") {
          // Rider en route to merchant pickup
          order.transitProgress = Math.min(35, (order.transitProgress || 5) + 0.8 * this.speed);
          order.etaSecondsRemaining = Math.max(60, (order.etaSecondsRemaining || 1200) - this.speed);
          order.etaMinutes = Math.ceil(order.etaSecondsRemaining / 60);

          if (order.transitProgress >= 35) {
            advanceOrderStatus(order.id, "Picked Up");
            stateChanged = true;
          }
        } else if (order.status === "Picked Up") {
          // Rider collected package, heading to customer neighborhood
          order.transitProgress = Math.min(65, (order.transitProgress || 35) + 0.9 * this.speed);
          order.etaSecondsRemaining = Math.max(60, (order.etaSecondsRemaining || 900) - this.speed);
          order.etaMinutes = Math.ceil(order.etaSecondsRemaining / 60);

          if (order.transitProgress >= 65) {
            advanceOrderStatus(order.id, "Out for Delivery");
            stateChanged = true;
          }
        } else if (order.status === "Out for Delivery") {
          // In last mile delivery: slowed down if traffic delay is active
          const progressStep = order.trafficDelayed ? (0.28 * this.speed) : (0.95 * this.speed);
          order.transitProgress = Math.min(100, (order.transitProgress || 65) + progressStep);
          order.etaSecondsRemaining = Math.max(0, (order.etaSecondsRemaining || 720) - this.speed);
          order.etaMinutes = Math.ceil(order.etaSecondsRemaining / 60);

          if (order.transitProgress >= 100 && order.etaSecondsRemaining <= 0) {
            advanceOrderStatus(order.id, "Delivered");
            stateChanged = true;
          }
        }
      });

      // Update phone live clocks and open modal count
      updateClockAndCountdowns();

      if (stateChanged) {
        DataStore.saveOrders(orders);
      }
    }
  };

  // Update simulation bar text
  function updateSimulationSummary() {
    if (!dom.simActiveSummary) return;

    const inTransit = orders.filter(o => o.status === "Out for Delivery" || o.status === "Picked Up" || o.status === "Assigned");
    const trafficCount = orders.filter(o => o.trafficDelayed && o.status !== "Delivered").length;

    if (inTransit.length === 0) {
      dom.simActiveSummary.textContent = "No active orders in transit. Assign a pending order or spawn a new sim order!";
    } else {
      const firstActive = inTransit[0];
      const trafficNotice = trafficCount > 0 ? ` • ⚠️ ${trafficCount} in Heavy Traffic` : "";
      dom.simActiveSummary.textContent = `Active: #${firstActive.id} (${firstActive.status}) • ETA: ${formatMinutesSeconds(firstActive.etaSecondsRemaining)}${trafficNotice}`;
    }
  }

  // Update clocks every tick
  function updateClockAndCountdowns() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (dom.phoneClock) dom.phoneClock.textContent = timeStr;

    // If customer phone modal is open, refresh dynamic fields
    if (dom.modalCustomerDevice && dom.modalCustomerDevice.classList.contains("active")) {
      const activeOrder = findOrderById(activeCustomerPhoneOrderId);
      if (activeOrder) {
        if (dom.phoneCountdownClock) {
          dom.phoneCountdownClock.textContent = activeOrder.status === "Delivered" ? "DELIVERED" : formatMinutesSeconds(activeOrder.etaSecondsRemaining);
        }
        if (dom.phoneRouteFill) {
          dom.phoneRouteFill.style.width = (activeOrder.transitProgress || 10) + "%";
        }
        if (dom.phoneRouteRider) {
          dom.phoneRouteRider.style.left = (activeOrder.transitProgress || 10) + "%";
        }
      }
    }

    // If order details modal is open, update its live clock
    if (dom.modalOrderDetails && dom.modalOrderDetails.classList.contains("active")) {
      const detailOrder = findOrderById(activeDetailOrderId);
      if (detailOrder && dom.detailLiveEtaClock) {
        if (detailOrder.status === "Delivered") {
          dom.detailLiveEtaClock.textContent = "Delivered Successfully";
        } else if (detailOrder.trafficDelayed) {
          dom.detailLiveEtaClock.textContent = `⏱️ ${formatMinutesSeconds(detailOrder.etaSecondsRemaining)} (Traffic Delay +${detailOrder.trafficDelayMinutes || 10}m Active)`;
        } else {
          dom.detailLiveEtaClock.textContent = `⏱️ ${formatMinutesSeconds(detailOrder.etaSecondsRemaining)} remaining`;
        }
        if (dom.detailProgressFill) {
          dom.detailProgressFill.style.width = (detailOrder.transitProgress || 5) + "%";
        }
      }
    }

    updateSimulationSummary();
    if (typeof updateMapRiders === "function") {
      updateMapRiders();
    }
  }

  // Spawn a realistic simulated order for presentation
  function spawnSimulatedOrder() {
    const demoCustomers = [
      { name: "Manoj Kumar", phone: "+91 98492 88776", address: "Sri Nagar Colony, Near Boat Club, Kakinada", items: "1x Chicken Dum Biryani, 1x Thums Up", amount: 380, priority: "Normal" },
      { name: "Divya Sri", phone: "+91 97014 33221", address: "Flat 101, Haritha Towers, Ramanayyapeta, Kakinada", items: "2x Cold Coffee, 1x Veg Club Sandwich", amount: 290, priority: "Express" },
      { name: "Srinivas Rao", phone: "+91 99480 66554", address: "D.No 8-1-24, Main Road, Surya Rao Peta, Kakinada", items: "Pharmacy Care Pack & Vitamins", amount: 720, priority: "Urgent" }
    ];

    const pick = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
    const newId = `ORD-${orders.length + 1025}`;

    const newOrder = {
      id: newId,
      customerName: pick.name,
      phone: pick.phone,
      address: pick.address,
      amount: pick.amount,
      priority: pick.priority,
      status: "Pending",
      orderTime: getFormattedCurrentTime(),
      timestamp: Date.now(),
      assignedRiderId: null,
      items: pick.items,
      etaMinutes: 28,
      etaSecondsRemaining: 1680,
      transitProgress: 5,
      trafficDelayed: false,
      trafficDelayMinutes: 10,
      customerNotifications: [
        {
          id: Date.now(),
          time: getFormattedCurrentTime(),
          title: "Order Placed",
          message: "Order placed successfully. Awaiting dispatch from Kakinada Hub.",
          type: "status"
        }
      ],
      timeline: [
        {
          step: "Order Created",
          time: getFormattedCurrentTime(),
          completed: true,
          note: "Incoming live simulated customer order"
        }
      ]
    };

    orders.unshift(newOrder);
    DataStore.saveOrders(orders);

    showToast(`⚡ Simulated Live Order #${newId} placed by ${pick.name}!`, "success");
    addNotification(`Incoming order #${newId} from ${pick.name} waiting for dispatch.`, "info");

    renderDashboard();
    renderOrdersTable();
    renderAssignmentsView();
    updateSimulationSummary();
  }

  // ==========================================================================
  // High Traffic Congestion Incident & Fast Customer Push Notification
  // ==========================================================================
  let pushBannerTimeout = null;

  function showCustomerPushBanner(title, body, urgent = true) {
    if (!dom.phonePushBanner) return;
    if (dom.pushBannerTitle) dom.pushBannerTitle.textContent = title;
    if (dom.pushBannerBody) dom.pushBannerBody.textContent = body;
    if (dom.pushBannerTime) dom.pushBannerTime.textContent = "Just now";

    if (urgent) {
      dom.phonePushBanner.classList.add("traffic-urgent");
    } else {
      dom.phonePushBanner.classList.remove("traffic-urgent");
    }

    dom.phonePushBanner.classList.add("active");

    if (pushBannerTimeout) clearTimeout(pushBannerTimeout);
    pushBannerTimeout = setTimeout(() => {
      if (dom.phonePushBanner) dom.phonePushBanner.classList.remove("active");
    }, 7000);
  }

  // The core feature requested:
  // "when the rider is in high traffic and fastly one notification goes to the customer device .order delayed wait for 10 minutes"
  function triggerTrafficDelay(orderId, delayMinutes) {
    if (typeof delayMinutes !== "number" || isNaN(delayMinutes) || delayMinutes <= 0) {
      delayMinutes = selectedTrafficDelayMinutes || 10;
    }

    let targetOrder = orderId ? findOrderById(orderId) : null;

    if (!targetOrder) {
      // Find the first active delivery in transit
      targetOrder = orders.find(o => o.status === "Out for Delivery") ||
                    orders.find(o => o.status === "Picked Up") ||
                    orders.find(o => o.status === "Assigned") ||
                    orders[0];
    }

    if (!targetOrder) {
      showToast("No active delivery order found to simulate traffic delay.", "warning");
      return;
    }

    if (targetOrder.trafficDelayed) {
      showToast(`Order #${targetOrder.id} is already in high traffic delay (+${targetOrder.trafficDelayMinutes || delayMinutes} min).`, "info");
      return;
    }

    // 1. Update Order State: Add specified delay duration
    targetOrder.trafficDelayed = true;
    targetOrder.trafficDelayMinutes = delayMinutes;
    targetOrder.etaMinutes = (targetOrder.etaMinutes || 12) + delayMinutes;
    targetOrder.etaSecondsRemaining = (targetOrder.etaSecondsRemaining || 720) + (delayMinutes * 60);

    const currentTime = getFormattedCurrentTime();

    // 2. Dispatch the exact customer notification message requested:
    // "order delayed wait for ${delayMinutes} minutes"
    const customerTrafficAlert = {
      id: Date.now(),
      time: currentTime,
      title: "⚠️ High Traffic Incident Alert",
      message: `order delayed wait for ${delayMinutes} minutes`,
      type: "traffic",
      urgent: true
    };

    if (!targetOrder.customerNotifications) targetOrder.customerNotifications = [];
    targetOrder.customerNotifications.unshift(customerTrafficAlert);

    // 3. Log event into Order Lifecycle Timeline
    if (!targetOrder.timeline) targetOrder.timeline = [];
    targetOrder.timeline.push({
      step: "High Traffic Delay",
      time: currentTime,
      completed: true,
      note: `Rider encountered severe road traffic congestion. Order delayed; customer advised to wait for ${delayMinutes} minutes.`
    });

    // 4. Persist data
    DataStore.saveOrders(orders);

    // 5. Play urgent acoustic chime sound (unless muted)
    if (!dom.phoneSoundToggle || dom.phoneSoundToggle.checked) {
      SoundAlert.playTrafficChime();
    }

    // 6. Fast notification drops down immediately on the customer's phone device screen!
    activeCustomerPhoneOrderId = targetOrder.id;
    showCustomerPushBanner(
      "⚠️ High Traffic Delay",
      `order delayed wait for ${delayMinutes} minutes`
    );

    // 7. Vibrate simulated customer smartphone chassis
    if (dom.phoneDevice) {
      dom.phoneDevice.classList.remove("vibrate-alert");
      void dom.phoneDevice.offsetWidth; // Trigger DOM reflow
      dom.phoneDevice.classList.add("vibrate-alert");
    }

    // 8. Indicate notification badge on topbar Customer Phone icon
    if (dom.customerTopAlertPill) {
      dom.customerTopAlertPill.style.display = "flex";
      dom.customerTopAlertPill.textContent = "!";
    }

    // 9. Dispatcher alerts
    showToast(`⚠️ High Traffic Alert! Customer Device notified: "order delayed wait for ${delayMinutes} minutes"`, "warning");
    addNotification(`Traffic Alert: Order #${targetOrder.id} delayed by ${delayMinutes}m. Instant notification sent to customer device.`, "warning");

    // 10. Refresh views
    renderDashboard();
    renderOrdersTable();
    if (activeDetailOrderId === targetOrder.id) {
      openOrderDetailsModal(targetOrder.id);
    }
    renderCustomerPhoneScreen();
    updateSimulationSummary();
    if (typeof updateMapRiders === "function") {
      updateMapRiders();
    }
  }

  // Resolve traffic congestion
  function resolveTrafficDelay(orderId) {
    const order = findOrderById(orderId);
    if (!order || !order.trafficDelayed) return;

    order.trafficDelayed = false;
    const delaySecs = (order.trafficDelayMinutes || 10) * 60;
    order.etaSecondsRemaining = Math.max(60, (order.etaSecondsRemaining || delaySecs) - delaySecs);
    order.etaMinutes = Math.ceil(order.etaSecondsRemaining / 60);

    const currentTime = getFormattedCurrentTime();
    order.timeline.push({
      step: "Traffic Cleared",
      time: currentTime,
      completed: true,
      note: "Traffic cleared. Rider resumed standard delivery pace."
    });

    order.customerNotifications.unshift({
      id: Date.now(),
      time: currentTime,
      title: "Traffic Cleared",
      message: "Traffic delay cleared! Rider is moving at normal speed again.",
      type: "status",
      urgent: false
    });

    DataStore.saveOrders(orders);

    if (!dom.phoneSoundToggle || dom.phoneSoundToggle.checked) {
      SoundAlert.playNotificationBeep();
    }

    showCustomerPushBanner("Traffic Cleared", "Rider moving at normal speed. Arriving soon!", false);
    showToast(`Traffic cleared for Order #${order.id}. Normal ETA restored.`, "success");
    addNotification(`Order #${order.id}: Traffic congestion cleared, normal transit resumed.`, "info");

    renderDashboard();
    renderOrdersTable();
    if (activeDetailOrderId === order.id) {
      openOrderDetailsModal(order.id);
    }
    renderCustomerPhoneScreen();
    updateSimulationSummary();
    if (typeof updateMapRiders === "function") {
      updateMapRiders();
    }
  }

  // ==========================================================================
  // Simulated Customer Smartphone Device Modal Controller
  // ==========================================================================
  function openCustomerDeviceModal(orderId) {
    if (orderId) {
      activeCustomerPhoneOrderId = orderId;
    } else if (!activeCustomerPhoneOrderId || !findOrderById(activeCustomerPhoneOrderId)) {
      // Prioritize active orders
      const activeOrder = orders.find(o => o.status === "Out for Delivery") ||
                          orders.find(o => o.status === "Picked Up") ||
                          orders.find(o => o.status === "Assigned") ||
                          orders[0];
      if (activeOrder) activeCustomerPhoneOrderId = activeOrder.id;
    }

    // Populate order dropdown on phone
    if (dom.phoneOrderSelect) {
      dom.phoneOrderSelect.innerHTML = orders.map(o => `
        <option value="${o.id}" ${o.id === activeCustomerPhoneOrderId ? 'selected' : ''}>
          #${o.id} - ${o.customerName} (${o.status}${o.trafficDelayed ? ' - ⚠️ Traffic' : ''})
        </option>
      `).join("");
    }

    renderCustomerPhoneScreen();
    openModal(dom.modalCustomerDevice);

    // Clear topbar alert badge
    if (dom.customerTopAlertPill) {
      dom.customerTopAlertPill.style.display = "none";
    }
  }

  function renderCustomerPhoneScreen() {
    const order = findOrderById(activeCustomerPhoneOrderId);
    if (!order) return;

    const rider = order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;

    // Order snapshot
    if (dom.phoneOrderId) dom.phoneOrderId.textContent = `#${order.id}`;
    if (dom.phoneOrderItems) dom.phoneOrderItems.textContent = order.items || "Assorted Items";
    if (dom.phoneOrderAmount) dom.phoneOrderAmount.textContent = `₹${Number(order.amount).toLocaleString('en-IN')}`;
    if (dom.phoneOrderAddress) dom.phoneOrderAddress.textContent = order.address;

    // Rider details
    if (rider) {
      if (dom.phoneRiderAvatar) dom.phoneRiderAvatar.textContent = rider.name.charAt(0);
      if (dom.phoneRiderName) dom.phoneRiderName.textContent = rider.name;
      if (dom.phoneRiderSub) dom.phoneRiderSub.textContent = `${rider.vehicleType} • ⭐ ${rider.rating}`;
      if (dom.phoneRiderPhone) dom.phoneRiderPhone.textContent = rider.phone;
    } else {
      if (dom.phoneRiderAvatar) dom.phoneRiderAvatar.textContent = "QD";
      if (dom.phoneRiderName) dom.phoneRiderName.textContent = "Assigning Rider...";
      if (dom.phoneRiderSub) dom.phoneRiderSub.textContent = "Nearest rider matching in progress";
      if (dom.phoneRiderPhone) dom.phoneRiderPhone.textContent = "Hub Dispatch Node";
    }

    // Traffic Alert Box & Hero ETA Card
    if (order.status === "Delivered") {
      if (dom.phoneTrafficAlertBox) dom.phoneTrafficAlertBox.style.display = "none";
      if (dom.phoneEtaCard) dom.phoneEtaCard.classList.remove("traffic-alert");
      if (dom.phoneEtaBadge) {
        dom.phoneEtaBadge.className = "phone-eta-badge on-time";
        dom.phoneEtaBadge.textContent = "✅ Delivered Successfully";
      }
      if (dom.phoneCountdownClock) dom.phoneCountdownClock.textContent = "DELIVERED";
      if (dom.phoneArrivalTime) dom.phoneArrivalTime.textContent = "Delivered at your doorstep. Enjoy!";
      if (dom.phoneRouteFill) dom.phoneRouteFill.style.width = "100%";
      if (dom.phoneRouteRider) dom.phoneRouteRider.style.left = "100%";
      if (dom.phoneRouteCaption) dom.phoneRouteCaption.textContent = "Delivered with verification";
    } else if (order.trafficDelayed) {
      const delayM = order.trafficDelayMinutes || 10;
      if (dom.phoneTrafficAlertBox) dom.phoneTrafficAlertBox.style.display = "block";
      if (dom.phoneTrafficAlertText) dom.phoneTrafficAlertText.textContent = `Rider is currently navigating through heavy road traffic. Your order is delayed. Please wait for ${delayM} minutes.`;
      if (dom.phoneEtaCard) dom.phoneEtaCard.classList.add("traffic-alert");
      if (dom.phoneEtaBadge) {
        dom.phoneEtaBadge.className = "phone-eta-badge delayed";
        dom.phoneEtaBadge.textContent = `⚠️ Heavy Traffic (+${delayM}m)`;
      }
      if (dom.phoneCountdownClock) dom.phoneCountdownClock.textContent = formatMinutesSeconds(order.etaSecondsRemaining);
      if (dom.phoneArrivalTime) dom.phoneArrivalTime.textContent = `⚠️ Delay (+${delayM}m) • High Traffic Detected`;
      if (dom.phoneRouteFill) dom.phoneRouteFill.style.width = (order.transitProgress || 65) + "%";
      if (dom.phoneRouteRider) dom.phoneRouteRider.style.left = (order.transitProgress || 65) + "%";
      if (dom.phoneRouteCaption) dom.phoneRouteCaption.textContent = "Rider delayed in traffic • 1.5 km away";
    } else {
      if (dom.phoneTrafficAlertBox) dom.phoneTrafficAlertBox.style.display = "none";
      if (dom.phoneEtaCard) dom.phoneEtaCard.classList.remove("traffic-alert");
      if (dom.phoneEtaBadge) {
        dom.phoneEtaBadge.className = "phone-eta-badge on-time";
        dom.phoneEtaBadge.textContent = "🟢 ETA Verified: On Track";
      }
      if (dom.phoneCountdownClock) dom.phoneCountdownClock.textContent = formatMinutesSeconds(order.etaSecondsRemaining);
      if (dom.phoneArrivalTime) dom.phoneArrivalTime.textContent = `Est. Arrival: Today, ${getEstimatedArrivalTime(order.etaSecondsRemaining)}`;
      if (dom.phoneRouteFill) dom.phoneRouteFill.style.width = (order.transitProgress || 20) + "%";
      if (dom.phoneRouteRider) dom.phoneRouteRider.style.left = (order.transitProgress || 20) + "%";
      if (dom.phoneRouteCaption) {
        dom.phoneRouteCaption.textContent = order.status === "Out for Delivery" ? "Rider en route • 1.5 km away" : order.status === "Picked Up" ? "Package collected from merchant" : "Rider dispatched to merchant";
      }
    }

    // Update Phone Mini Map SVG & Telemetry
    if (dom.phoneMiniRiderMarker) {
      const progressRatio = Math.max(0.05, Math.min(1, (order.transitProgress || 10) / 100));
      const startX = 60, startY = 80;
      const endX = 260, endY = 120;
      const curX = Math.round(startX + (endX - startX) * progressRatio);
      const curY = Math.round(startY + (endY - startY) * progressRatio);
      dom.phoneMiniRiderMarker.setAttribute("transform", `translate(${curX}, ${curY})`);

      const pos = calculateRiderMapPosition(order);
      if (dom.phoneMiniGps) dom.phoneMiniGps.textContent = `${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E`;
      if (dom.phoneMiniSpeed) dom.phoneMiniSpeed.textContent = `${pos.speed} km/h`;
    }

    // Notifications Feed list on device
    if (dom.phoneNotifsList) {
      const notifs = order.customerNotifications || [];
      if (dom.phoneNotifCount) dom.phoneNotifCount.textContent = notifs.length;
      if (notifs.length === 0) {
        dom.phoneNotifsList.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.75rem;">No notifications yet.</div>`;
      } else {
        dom.phoneNotifsList.innerHTML = notifs.map(n => `
          <div class="phone-notif-item ${n.urgent ? 'urgent' : ''}">
            <div class="phone-notif-title-row">
              <span class="phone-notif-title">${escapeHTML(n.title)}</span>
              <span class="phone-notif-time">${escapeHTML(n.time)}</span>
            </div>
            <div class="phone-notif-msg">${escapeHTML(n.message)}</div>
          </div>
        `).join("");
      }
    }
  }

  // ==========================================================================
  // Configurable Traffic Delay Synchronization
  // ==========================================================================
  function syncTrafficDelaySelects(newMinutes) {
    selectedTrafficDelayMinutes = Number(newMinutes) || 10;

    if (dom.simDelayMinDisplay) dom.simDelayMinDisplay.textContent = selectedTrafficDelayMinutes;
    if (dom.detailDelayMinDisplay) dom.detailDelayMinDisplay.textContent = selectedTrafficDelayMinutes;
    if (dom.phoneDelayBtnLabel) dom.phoneDelayBtnLabel.textContent = selectedTrafficDelayMinutes;

    const selectElements = [dom.simTrafficDelaySelect, dom.detailTrafficDelaySelect, dom.phoneDelaySelect];
    selectElements.forEach(sel => {
      if (!sel) return;
      const hasOption = Array.from(sel.options).some(opt => opt.value === String(selectedTrafficDelayMinutes));
      if (hasOption) {
        sel.value = String(selectedTrafficDelayMinutes);
      } else {
        sel.value = "custom";
      }
    });
  }

  function handleDelaySelectChange(e) {
    const val = e.target.value;
    if (val === "custom") {
      const input = prompt("Enter traffic congestion delay in minutes (e.g., 5, 10, 15, 25):", String(selectedTrafficDelayMinutes));
      const parsed = parseInt(input, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
        syncTrafficDelaySelects(parsed);
        showToast(`Traffic delay duration set to ${parsed} minutes.`, "info");
      } else {
        syncTrafficDelaySelects(selectedTrafficDelayMinutes);
      }
    } else {
      const minutes = parseInt(val, 10) || 10;
      syncTrafficDelaySelects(minutes);
      showToast(`Traffic delay duration set to ${minutes} minutes.`, "info");
    }
  }

  // ==========================================================================
  // Interactive GPS Vector Map & Telemetry Controller (Kakinada City)
  // ==========================================================================
  function calculateRiderMapPosition(order) {
    const hub = (typeof KAKINADA_MAP_CONFIG !== "undefined" && KAKINADA_MAP_CONFIG.hub) ? KAKINADA_MAP_CONFIG.hub : { x: 300, y: 240, lat: 16.9604, lng: 82.2381 };
    const dest = (order && order.destCoordinates) ? order.destCoordinates : ((typeof KAKINADA_MAP_CONFIG !== "undefined" && KAKINADA_MAP_CONFIG.destinations[order ? order.id : ""]) || { x: 332, y: 383, lat: 16.9380, lng: 82.2310, landmark: "Jagannaickpur" });

    const progressRatio = Math.max(0.05, Math.min(1, (order ? (order.transitProgress || 5) : 5) / 100));

    const x = Math.round(hub.x + (dest.x - hub.x) * progressRatio);
    const y = Math.round(hub.y + (dest.y - hub.y) * progressRatio);
    const lat = hub.lat + (dest.lat - hub.lat) * progressRatio;
    const lng = hub.lng + (dest.lng - hub.lng) * progressRatio;

    let speed = 24;
    let street = "Arterial Road Sector 4";

    if (!order || order.status === "Delivered") {
      speed = 0;
      street = "Customer Doorstep • Delivered";
    } else if (order.trafficDelayed) {
      speed = 8;
      street = `⚠️ Heavy Congestion: ${dest.landmark || 'Main Road'} Corridor`;
    } else if (order.status === "Out for Delivery") {
      speed = 28;
      street = `${dest.landmark || 'Main'} Approach Road`;
    } else if (order.status === "Picked Up") {
      speed = 22;
      street = "Cinema Road & Port Link Bypass";
    } else {
      speed = 18;
      street = "Central Hub Logistics Gate 2";
    }

    return { x, y, lat, lng, speed, street, dest };
  }

  function renderCityMap() {
    if (!dom.cityVectorMap) return;

    // Populate tracking delivery dropdown
    if (dom.mapOrderFilter) {
      const activeTransitOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
      const currentSelection = mapSelectedOrderId || (activeTransitOrders.length > 0 ? activeTransitOrders[0].id : orders[0]?.id);
      mapSelectedOrderId = currentSelection;

      dom.mapOrderFilter.innerHTML = orders.map(o => `
        <option value="${o.id}" ${o.id === mapSelectedOrderId ? 'selected' : ''}>
          #${o.id} - ${o.customerName} (${o.status}${o.trafficDelayed ? ' - ⚠️ Traffic' : ''})
        </option>
      `).join("");
    }

    updateMapRiders();
  }

  function updateMapRiders() {
    if (!dom.cityVectorMap) return;

    const hub = (typeof KAKINADA_MAP_CONFIG !== "undefined" && KAKINADA_MAP_CONFIG.hub) ? KAKINADA_MAP_CONFIG.hub : { x: 300, y: 240 };

    // 1. Render active routes
    if (dom.mapActiveRoutes) {
      dom.mapActiveRoutes.innerHTML = orders.map(order => {
        if (order.status === "Delivered" || order.status === "Cancelled") return "";

        const dest = order.destCoordinates || (typeof KAKINADA_MAP_CONFIG !== "undefined" ? KAKINADA_MAP_CONFIG.destinations[order.id] : null) || { x: 332, y: 383 };
        const isSelected = order.id === mapSelectedOrderId;
        const strokeColor = order.trafficDelayed ? "#EF4444" : isSelected ? "#4F46E5" : "#6366F1";
        const strokeWidth = isSelected ? 4 : 2.5;
        const opacity = isSelected ? 0.95 : 0.6;
        const dashArray = order.trafficDelayed ? "8,4" : "6,6";

        const midX = (hub.x + dest.x) / 2;
        const midY = (hub.y + dest.y) / 2 - 15;

        return `
          <g class="route-path-group" data-order-id="${order.id}">
            <path d="M ${hub.x},${hub.y} Q ${midX},${midY} ${dest.x},${dest.y}" 
                  fill="none" 
                  stroke="${strokeColor}" 
                  stroke-width="${strokeWidth}" 
                  stroke-dasharray="${dashArray}" 
                  opacity="${opacity}" 
                  stroke-linecap="round" />
          </g>
        `;
      }).join("");
    }

    // 2. Render traffic congestion zones
    if (dom.mapTrafficZones) {
      if (!isTrafficLayerVisible) {
        dom.mapTrafficZones.innerHTML = "";
      } else {
        const delayedOrders = orders.filter(o => o.trafficDelayed && o.status !== "Delivered");
        dom.mapTrafficZones.innerHTML = delayedOrders.map(order => {
          const pos = calculateRiderMapPosition(order);
          return `
            <g class="traffic-congestion-zone" transform="translate(${pos.x}, ${pos.y})">
              <circle cx="0" cy="0" r="32" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="4,3">
                <animate attributeName="r" values="24;36;24" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="14" fill="rgba(239, 68, 68, 0.4)" />
              <text x="0" y="4" text-anchor="middle" font-size="10">⚠️</text>
              <rect x="-45" y="-28" width="90" height="16" rx="3" fill="rgba(15, 23, 42, 0.85)" stroke="#EF4444" stroke-width="0.8" />
              <text x="0" y="-17" text-anchor="middle" font-size="8.5" fill="#FEF08A" font-weight="bold">Traffic (+${order.trafficDelayMinutes || 10}m)</text>
            </g>
          `;
        }).join("");
      }
    }

    // 3. Render customer destination pins
    if (dom.mapDestinations) {
      dom.mapDestinations.innerHTML = orders.map(order => {
        const dest = order.destCoordinates || (typeof KAKINADA_MAP_CONFIG !== "undefined" ? KAKINADA_MAP_CONFIG.destinations[order.id] : null) || { x: 332, y: 383, landmark: order.customerName };
        const isSelected = order.id === mapSelectedOrderId;
        const pinColor = order.status === "Delivered" ? "#10B981" : isSelected ? "#4F46E5" : "#64748B";

        return `
          <g class="map-dest-pin" transform="translate(${dest.x}, ${dest.y})" data-order-id="${order.id}" style="cursor:pointer;">
            <circle cx="0" cy="0" r="${isSelected ? 11 : 8}" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2" />
            <text x="0" y="3" text-anchor="middle" font-size="8" fill="#FFFFFF">${order.status === "Delivered" ? "✓" : "🏠"}</text>
            <text x="0" y="${isSelected ? 22 : 18}" text-anchor="middle" font-size="9" font-weight="${isSelected ? '700' : '500'}" fill="var(--text-primary)" class="map-pin-caption">
              ${escapeHTML(order.customerName.split(' ')[0])}
            </text>
          </g>
        `;
      }).join("");
    }

    // 4. Render Rider markers
    if (dom.mapRiders) {
      const activeOrdersWithRider = orders.filter(o => o.assignedRiderId && o.status !== "Cancelled");
      dom.mapRiders.innerHTML = activeOrdersWithRider.map(order => {
        const rider = findRiderById(order.assignedRiderId);
        const riderName = rider ? rider.name : "Rider";
        const pos = calculateRiderMapPosition(order);
        const isSelected = order.id === mapSelectedOrderId;
        const markerBg = order.trafficDelayed ? "#EF4444" : isSelected ? "#0EA5E9" : "#4F46E5";

        return `
          <g class="map-rider-marker ${order.trafficDelayed ? 'traffic-stalled' : ''}" 
             transform="translate(${pos.x}, ${pos.y})" 
             data-order-id="${order.id}" 
             style="cursor:pointer;">
            ${isSelected ? `
              <circle cx="0" cy="0" r="22" fill="none" stroke="${markerBg}" stroke-width="2" opacity="0.6">
                <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
            ` : ""}
            <circle cx="0" cy="0" r="14" fill="${markerBg}" stroke="#FFFFFF" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
            <text x="0" y="5" text-anchor="middle" font-size="12">🛵</text>
            <rect x="-35" y="-28" width="70" height="15" rx="3" fill="var(--card-bg)" stroke="var(--border-color)" stroke-width="0.8" opacity="0.95" />
            <text x="0" y="-17" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">
              ${escapeHTML(riderName.split(' ')[0])} • ${formatMinutesSeconds(order.etaSecondsRemaining)}
            </text>
          </g>
        `;
      }).join("");
    }

    // 5. Update Telemetry Panel
    const targetOrder = findOrderById(mapSelectedOrderId) || orders[0];
    if (targetOrder) {
      updateTelemetrySidebar(targetOrder);
    }
  }

  function updateTelemetrySidebar(order) {
    if (!order) return;
    const rider = order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;
    const pos = calculateRiderMapPosition(order);

    if (dom.telemetryOrderId) dom.telemetryOrderId.textContent = `#${order.id} • ${order.customerName}`;
    if (dom.telemetryLat) dom.telemetryLat.textContent = `${pos.lat.toFixed(4)}° N`;
    if (dom.telemetryLng) dom.telemetryLng.textContent = `${pos.lng.toFixed(4)}° E`;
    if (dom.telemetrySpeed) dom.telemetrySpeed.textContent = `${pos.speed} km/h`;

    if (dom.telemetryTrafficStatus) {
      if (order.status === "Delivered") {
        dom.telemetryTrafficStatus.innerHTML = `<span style="color:var(--success);">✅ Delivered</span>`;
      } else if (order.trafficDelayed) {
        dom.telemetryTrafficStatus.innerHTML = `<span style="color:var(--danger); font-weight:700;">⚠️ High Traffic (+${order.trafficDelayMinutes || 10}m)</span>`;
      } else {
        dom.telemetryTrafficStatus.innerHTML = `<span style="color:var(--success);">🟢 Normal Transit</span>`;
      }
    }

    if (dom.telemetryStreet) dom.telemetryStreet.textContent = pos.street;
    if (dom.telemetryDestAddress) dom.telemetryDestAddress.textContent = order.address;

    // Toggle button visibility on telemetry
    if (dom.telemetryTriggerTrafficBtn) {
      if (order.status === "Delivered" || order.status === "Cancelled") {
        dom.telemetryTriggerTrafficBtn.style.display = "none";
      } else if (order.trafficDelayed) {
        dom.telemetryTriggerTrafficBtn.textContent = "Clear Traffic Delay";
        dom.telemetryTriggerTrafficBtn.className = "btn btn-outline-warning btn-sm";
        dom.telemetryTriggerTrafficBtn.style.display = "inline-flex";
      } else {
        dom.telemetryTriggerTrafficBtn.textContent = `⚠️ Trigger Traffic (+${selectedTrafficDelayMinutes}m)`;
        dom.telemetryTriggerTrafficBtn.className = "btn btn-warning btn-sm";
        dom.telemetryTriggerTrafficBtn.style.display = "inline-flex";
      }
    }

    // Active fleet roster list
    if (dom.riderTelemetryList) {
      const activeRiders = riders.map(r => {
        const assignedOrder = orders.find(o => o.assignedRiderId === r.id && o.status !== "Delivered");
        return { rider: r, order: assignedOrder };
      });

      const onDeliveryCount = riders.filter(r => r.status === "On Delivery").length;
      if (dom.telemetryActiveRidersCount) {
        dom.telemetryActiveRidersCount.textContent = `${onDeliveryCount} On Delivery • ${riders.length} Total Fleet`;
      }

      dom.riderTelemetryList.innerHTML = activeRiders.map(({ rider: r, order: o }) => `
        <div class="rider-telemetry-row ${o && o.id === mapSelectedOrderId ? 'selected' : ''}" data-order-id="${o ? o.id : ''}" style="display:flex; justify-content:space-between; align-items:center; padding:0.45rem 0.6rem; border-bottom:1px solid var(--border-color); font-size:0.8rem; cursor:pointer;">
          <div>
            <strong>${escapeHTML(r.name)}</strong>
            <span style="font-size:0.7rem; color:var(--text-muted); margin-left:4px;">(${escapeHTML(r.vehicleType)})</span>
            <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:1px;">
              ${o ? `Tracking #${o.id} • ${o.trafficDelayed ? '⚠️ Heavy Traffic' : o.status}` : `Stationary at ${escapeHTML(r.location.split(',')[0])}`}
            </div>
          </div>
          <div>
            <span class="badge ${getStatusBadgeClass(r.status)}" style="font-size:0.65rem;">${r.status}</span>
          </div>
        </div>
      `).join("");
    }
  }

  function centerMapOnHub() {
    const hub = (typeof KAKINADA_MAP_CONFIG !== "undefined" && KAKINADA_MAP_CONFIG.hub) ? KAKINADA_MAP_CONFIG.hub : { name: "Kakinada Hub" };
    showToast(`Map centered on Central Logistics Hub (${hub.name})`, "info");
    updateMapRiders();
  }

  function toggleTrafficLayer() {
    isTrafficLayerVisible = !isTrafficLayerVisible;
    if (dom.mapToggleTrafficLayerBtn) {
      dom.mapToggleTrafficLayerBtn.className = isTrafficLayerVisible ? "btn btn-warning btn-sm" : "btn btn-outline btn-sm";
    }
    showToast(`Traffic congestion heatmap ${isTrafficLayerVisible ? 'enabled' : 'hidden'}`, "info");
    updateMapRiders();
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    if (theme === "dark") {
      dom.themeIconSun.style.display = "block";
      dom.themeIconMoon.style.display = "none";
      if (dom.settingsThemeSwitch) dom.settingsThemeSwitch.checked = true;
    } else {
      dom.themeIconSun.style.display = "none";
      dom.themeIconMoon.style.display = "block";
      if (dom.settingsThemeSwitch) dom.settingsThemeSwitch.checked = false;
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, "info");
  }

  // ==========================================================================
  // Navigation & View Switching
  // ==========================================================================
  function switchView(viewName) {
    dom.navLinks.forEach(link => {
      if (link.getAttribute("data-view") === viewName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    dom.viewSections.forEach(sec => {
      if (sec.id === `view-${viewName}`) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    const titles = {
      dashboard: "Dashboard Overview",
      orders: "Order Management",
      riders: "Delivery Fleet & Riders",
      assignments: "Rider Assignment Console",
      map: "Live Fleet & Delivery GPS Map",
      settings: "Settings & Demo Controls"
    };
    dom.pageTitle.textContent = titles[viewName] || "Dashboard";

    closeMobileSidebar();

    if (viewName === "assignments") {
      renderAssignmentsView();
    } else if (viewName === "orders") {
      renderOrdersTable();
    } else if (viewName === "riders") {
      renderRidersCards();
    } else if (viewName === "dashboard") {
      renderDashboard();
    } else if (viewName === "map") {
      renderCityMap();
    }
    updateSimulationSummary();
  }

  function closeMobileSidebar() {
    dom.sidebar.classList.remove("open");
    dom.sidebarOverlay.classList.remove("active");
  }

  // ==========================================================================
  // Modals Controller
  // ==========================================================================
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
  }

  // Setup generic modal dismiss listeners
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close-modal");
      closeModal(document.getElementById(modalId));
    });
  });

  // Close modals on backdrop click
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  // ==========================================================================
  // Notifications Popover
  // ==========================================================================
  function renderNotifications() {
    if (!dom.notifPopoverList) return;
    if (notifications.length === 0) {
      dom.notifPopoverList.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">No active notifications</div>`;
      dom.notifBadgeDot.style.display = "none";
      return;
    }

    dom.notifPopoverList.innerHTML = notifications.map(n => `
      <div class="popover-item">
        <div style="color:var(--text-primary); font-weight:500;">${escapeHTML(n.text)}</div>
        <div class="popover-item-time">${escapeHTML(n.time)}</div>
      </div>
    `).join("");
  }

  // ==========================================================================
  // Render: Badges & KPIs
  // ==========================================================================
  function updateKPIsAndBadges() {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "Pending").length;
    const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
    const availableRiders = riders.filter(r => r.status === "Available").length;

    if (dom.kpiTotalOrders) dom.kpiTotalOrders.textContent = totalOrders;
    if (dom.kpiPendingOrders) dom.kpiPendingOrders.textContent = pendingOrders;
    if (dom.kpiDeliveredOrders) dom.kpiDeliveredOrders.textContent = deliveredOrders;
    if (dom.kpiAvailableRiders) dom.kpiAvailableRiders.textContent = availableRiders;

    if (dom.navOrdersCount) dom.navOrdersCount.textContent = totalOrders;
    if (dom.navRidersCount) dom.navRidersCount.textContent = riders.length;
    if (dom.navUnassignedCount) dom.navUnassignedCount.textContent = pendingOrders;

    if (dom.unassignedBadgeCount) dom.unassignedBadgeCount.textContent = `${pendingOrders} Pending`;
    if (dom.availableBadgeCount) dom.availableBadgeCount.textContent = `${availableRiders} Available`;
  }

  // ==========================================================================
  // Render: Dashboard View
  // ==========================================================================
  function renderDashboard() {
    updateKPIsAndBadges();

    const recentOrders = [...orders]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);

    if (dom.dashRecentOrdersTbody) {
      if (recentOrders.length === 0) {
        dom.dashRecentOrdersTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No orders recorded yet.</td></tr>`;
      } else {
        dom.dashRecentOrdersTbody.innerHTML = recentOrders.map(order => {
          const rider = order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;
          const riderText = rider ? `${escapeHTML(rider.name)} (${escapeHTML(rider.vehicleType)})` : `<span style="color:var(--text-muted);">Unassigned</span>`;

          let actionBtn = "";
          if (order.status === "Pending") {
            actionBtn = `<button class="btn btn-primary btn-sm assign-order-dash-btn" data-order-id="${order.id}">Assign</button>`;
          } else {
            actionBtn = `<button class="btn btn-outline btn-sm view-order-details-btn" data-order-id="${order.id}">View</button>`;
          }

          const etaPillHtml = getOrderEtaBadgeHtml(order);

          return `
            <tr>
              <td>
                <span class="order-id-link view-order-details-btn" data-order-id="${order.id}">#${escapeHTML(order.id)}</span>
              </td>
              <td>
                <div style="font-weight:600;">${escapeHTML(order.customerName)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(order.phone)}</div>
              </td>
              <td style="max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(order.address)}">
                ${escapeHTML(order.address)}
              </td>
              <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">${escapeHTML(order.status)}</span>
              </td>
              <td>${etaPillHtml}</td>
              <td>${riderText}</td>
              <td>
                <div style="display:flex; gap:0.35rem; align-items:center;">
                  ${actionBtn}
                  <button class="btn btn-outline btn-sm open-phone-for-order-btn" data-order-id="${order.id}" title="Track on Customer Phone">
                    📱
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    const availableRiders = riders.filter(r => r.status === "Available");
    if (dom.dashAvailableRidersList) {
      if (availableRiders.length === 0) {
        dom.dashAvailableRidersList.innerHTML = `
          <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.85rem;">
            No riders currently available for dispatch.
          </div>
        `;
      } else {
        dom.dashAvailableRidersList.innerHTML = availableRiders.map(rider => `
          <div class="rider-mini-item">
            <div class="rider-avatar-bubble">
              ${escapeHTML(rider.name.charAt(0))}
            </div>
            <div class="rider-info-block">
              <div class="rider-name-title">${escapeHTML(rider.name)}</div>
              <div class="rider-sub-details">
                <span>${escapeHTML(rider.vehicleType)}</span>
                <span>•</span>
                <span>${escapeHTML(rider.location.split(',')[0])}</span>
                <span>•</span>
                <span class="distance-pill">${rider.distanceKm} km</span>
              </div>
            </div>
            <button class="btn btn-outline btn-sm quick-dash-assign-rider-btn" data-rider-id="${rider.id}">
              Dispatch
            </button>
          </div>
        `).join("");
      }
    }
  }

  // ==========================================================================
  // Render: Orders View
  // ==========================================================================
  function renderOrdersTable() {
    updateKPIsAndBadges();

    const searchQuery = (dom.ordersSearchInput ? dom.ordersSearchInput.value : "").trim().toLowerCase();
    const statusFilter = dom.ordersStatusFilter ? dom.ordersStatusFilter.value : "ALL";
    const priorityFilter = dom.ordersPriorityFilter ? dom.ordersPriorityFilter.value : "ALL";

    let filtered = orders.filter(order => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && order.priority !== priorityFilter) return false;
      if (searchQuery) {
        const matchCustomer = order.customerName.toLowerCase().includes(searchQuery);
        const matchId = order.id.toLowerCase().includes(searchQuery);
        const matchAddress = order.address.toLowerCase().includes(searchQuery);
        const matchPhone = (order.phone || "").toLowerCase().includes(searchQuery);
        if (!matchCustomer && !matchId && !matchAddress && !matchPhone) return false;
      }
      return true;
    });

    if (dom.ordersCountLabel) {
      dom.ordersCountLabel.textContent = `Showing ${filtered.length} of ${orders.length} orders`;
    }

    if (!dom.ordersTableTbody) return;

    if (filtered.length === 0) {
      dom.ordersTableTbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
            No delivery orders match your filters.
          </td>
        </tr>
      `;
      return;
    }

    dom.ordersTableTbody.innerHTML = filtered.map(order => {
      const rider = order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;
      const riderDisplay = rider ? `${escapeHTML(rider.name)} (${escapeHTML(rider.vehicleType)})` : `<span style="color:var(--text-muted);">Unassigned</span>`;
      const etaPillHtml = getOrderEtaBadgeHtml(order);

      const isTransitActive = order.status === "Out for Delivery" || order.status === "Picked Up";

      return `
        <tr>
          <td>
            <span class="order-id-link view-order-details-btn" data-order-id="${order.id}">#${escapeHTML(order.id)}</span>
          </td>
          <td>
            <div style="font-weight:600;">${escapeHTML(order.customerName)}</div>
            <span class="priority-tag priority-${order.priority}">${escapeHTML(order.priority)}</span>
          </td>
          <td style="font-size:0.8rem; color:var(--text-secondary);">${escapeHTML(order.phone)}</td>
          <td style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(order.address)}">
            ${escapeHTML(order.address)}
          </td>
          <td style="font-weight:600;">₹${Number(order.amount).toLocaleString('en-IN')}</td>
          <td style="font-size:0.8rem; color:var(--text-secondary);">${escapeHTML(order.orderTime || "Today")}</td>
          <td>
            <span class="badge ${getStatusBadgeClass(order.status)}">${escapeHTML(order.status)}</span>
          </td>
          <td>${etaPillHtml}</td>
          <td>${riderDisplay}</td>
          <td>
            <div style="display:flex; gap:0.35rem; align-items:center;">
              <button class="btn btn-outline btn-sm view-order-details-btn" data-order-id="${order.id}">Details</button>
              <button class="btn btn-outline btn-sm open-phone-for-order-btn" data-order-id="${order.id}" title="Track on Customer Phone Device">📱</button>
              ${order.status === "Pending" ? `<button class="btn btn-primary btn-sm assign-order-dash-btn" data-order-id="${order.id}">Assign</button>` : ""}
              ${isTransitActive && !order.trafficDelayed ? `
                <button class="btn btn-warning btn-sm row-trigger-traffic-btn" data-order-id="${order.id}" title="Simulate High Traffic Congestion (+10m)">
                  ⚠️ Traffic
                </button>
              ` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render: Riders Page
  // ==========================================================================
  function renderRidersCards() {
    updateKPIsAndBadges();

    const searchQuery = (dom.ridersSearchInput ? dom.ridersSearchInput.value : "").trim().toLowerCase();
    const statusFilter = dom.ridersStatusFilter ? dom.ridersStatusFilter.value : "ALL";

    let filtered = riders.filter(rider => {
      if (statusFilter !== "ALL" && rider.status !== statusFilter) return false;
      if (searchQuery) {
        const matchName = rider.name.toLowerCase().includes(searchQuery);
        const matchPhone = rider.phone.toLowerCase().includes(searchQuery);
        const matchVehicle = rider.vehicle.toLowerCase().includes(searchQuery);
        const matchLoc = rider.location.toLowerCase().includes(searchQuery);
        if (!matchName && !matchPhone && !matchVehicle && !matchLoc) return false;
      }
      return true;
    });

    if (dom.ridersCountLabel) {
      dom.ridersCountLabel.textContent = `Showing ${filtered.length} of ${riders.length} riders`;
    }

    if (!dom.ridersCardsGrid) return;

    if (filtered.length === 0) {
      dom.ridersCardsGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          No riders match the selected criteria.
        </div>
      `;
      return;
    }

    dom.ridersCardsGrid.innerHTML = filtered.map(rider => {
      let activeOrderText = "";
      if (rider.status === "On Delivery" && rider.currentOrderId) {
        activeOrderText = `
          <div style="background:var(--bg-subtle); padding:0.5rem 0.75rem; border-radius:var(--radius-md); font-size:0.8rem; margin-top:0.25rem;">
            <span style="color:var(--text-muted);">Active Order:</span> 
            <span class="order-id-link view-order-details-btn" data-order-id="${rider.currentOrderId}">#${escapeHTML(rider.currentOrderId)}</span>
          </div>
        `;
      }

      return `
        <div class="rider-profile-card">
          <div class="rider-card-top">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <div class="rider-avatar-bubble">
                ${escapeHTML(rider.name.charAt(0))}
              </div>
              <div>
                <h4 style="font-size:1rem; font-weight:700;">${escapeHTML(rider.name)}</h4>
                <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${escapeHTML(rider.id)}</span>
              </div>
            </div>
            <span class="badge ${getStatusBadgeClass(rider.status)}">${escapeHTML(rider.status)}</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.45rem;">
            <div class="rider-card-info-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>${escapeHTML(rider.vehicle)} (${escapeHTML(rider.vehicleType)})</span>
            </div>

            <div class="rider-card-info-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${escapeHTML(rider.location)}</span>
            </div>

            <div class="rider-card-info-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>${escapeHTML(rider.phone)}</span>
            </div>
          </div>

          ${activeOrderText}

          <div class="rider-card-footer">
            <span style="font-size:0.8rem; color:var(--text-secondary);">
              Rating: <strong>⭐ ${rider.rating}</strong> (${rider.deliveriesCompleted} completed)
            </span>
            <span class="distance-pill">${rider.distanceKm} km away</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render: Proximity Assignments View
  // ==========================================================================
  function renderAssignmentsView() {
    updateKPIsAndBadges();

    const pendingOrders = orders.filter(o => o.status === "Pending");
    const availableRiders = riders
      .filter(r => r.status === "Available")
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (pendingOrders.length > 0 && !selectedAssignmentOrderId) {
      selectedAssignmentOrderId = pendingOrders[0].id;
    }

    if (dom.unassignedOrdersContainer) {
      if (pendingOrders.length === 0) {
        dom.unassignedOrdersContainer.innerHTML = `
          <div class="empty-state-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>All orders have been assigned riders! No pending requests.</div>
          </div>
        `;
      } else {
        dom.unassignedOrdersContainer.innerHTML = pendingOrders.map(order => {
          const isSelected = order.id === selectedAssignmentOrderId;
          return `
            <div class="unassigned-card ${isSelected ? 'selected' : ''}" data-assignment-order-id="${order.id}">
              <div class="unassigned-card-header">
                <div>
                  <strong style="color:var(--primary);">#${escapeHTML(order.id)}</strong>
                  <span style="font-size:0.85rem; font-weight:600; margin-left:0.35rem;">${escapeHTML(order.customerName)}</span>
                </div>
                <span class="priority-tag priority-${order.priority}">${escapeHTML(order.priority)}</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.25rem;">
                📍 ${escapeHTML(order.address)}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">
                <span>Amount: ₹${Number(order.amount).toLocaleString('en-IN')}</span>
                <span>${escapeHTML(order.orderTime || "Today")}</span>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    const selectedOrder = findOrderById(selectedAssignmentOrderId);

    if (selectedOrder) {
      if (dom.selectedOrderSummaryBox) {
        dom.selectedOrderSummaryBox.style.display = "block";
        dom.summaryOrderId.textContent = `#${selectedOrder.id}`;
        dom.summaryOrderPriority.textContent = selectedOrder.priority;
        dom.summaryOrderPriority.className = `priority-tag priority-${selectedOrder.priority}`;
        dom.summaryOrderDetails.textContent = `Customer: ${selectedOrder.customerName} • ${selectedOrder.address.split(',')[0]} • ₹${selectedOrder.amount}`;
      }
    } else {
      if (dom.selectedOrderSummaryBox) dom.selectedOrderSummaryBox.style.display = "none";
    }

    if (dom.matchingRidersContainer) {
      if (!selectedOrder) {
        dom.matchingRidersContainer.innerHTML = `
          <div class="empty-state-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>Select an unassigned order from the left to view and assign nearby delivery riders.</div>
          </div>
        `;
      } else if (availableRiders.length === 0) {
        dom.matchingRidersContainer.innerHTML = `
          <div class="empty-state-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <div style="font-weight:600; color:var(--text-primary);">No Available Riders</div>
            <div>All delivery riders are currently on delivery or offline.</div>
          </div>
        `;
      } else {
        dom.matchingRidersContainer.innerHTML = availableRiders.map((rider, index) => {
          const isClosest = index === 0;
          return `
            <div class="matching-rider-card">
              <div style="display:flex; align-items:center; gap:0.75rem; flex:1;">
                <div class="rider-avatar-bubble">
                  ${escapeHTML(rider.name.charAt(0))}
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <strong style="font-size:0.95rem;">${escapeHTML(rider.name)}</strong>
                    ${isClosest ? `<span style="font-size:0.68rem; font-weight:700; background:var(--primary-light); color:var(--primary); padding:0.15rem 0.45rem; border-radius:var(--radius-sm);">Closest</span>` : ""}
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
                    ${escapeHTML(rider.vehicle)} • ${escapeHTML(rider.location.split(',')[0])}
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-muted); margin-top:1px;">
                    Phone: ${escapeHTML(rider.phone)} • ⭐ ${rider.rating}
                  </div>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.45rem;">
                <span class="distance-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  ${rider.distanceKm} km away
                </span>
                <button class="btn btn-primary btn-sm assign-execute-btn" 
                        data-order-id="${selectedOrder.id}" 
                        data-rider-id="${rider.id}">
                  Assign Rider
                </button>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  }

  // Assign Rider Workflow
  function assignRiderToOrder(orderId, riderId) {
    const order = findOrderById(orderId);
    const rider = findRiderById(riderId);

    if (!order || !rider) {
      showToast("Order or Rider could not be found.", "error");
      return;
    }

    if (rider.status !== "Available") {
      showToast(`Rider ${rider.name} is currently ${rider.status}. Please choose an available rider.`, "warning");
      return;
    }

    const currentTime = getFormattedCurrentTime();

    // 1. Update Order State
    order.status = "Assigned";
    order.assignedRiderId = rider.id;
    order.transitProgress = 15;
    order.etaMinutes = 20;
    order.etaSecondsRemaining = 1200;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      step: "Rider Assigned",
      time: currentTime,
      completed: true,
      note: `Assigned to ${rider.name} (${rider.vehicle})`
    });

    if (!order.customerNotifications) order.customerNotifications = [];
    order.customerNotifications.unshift({
      id: Date.now(),
      time: currentTime,
      title: "Rider Assigned 🛵",
      message: `Rider ${rider.name} (${rider.vehicleType}) has been dispatched to pick up your order.`,
      type: "status"
    });

    // 2. Update Rider State
    rider.status = "On Delivery";
    rider.currentOrderId = order.id;

    // 3. Persist State
    DataStore.saveOrders(orders);
    DataStore.saveRiders(riders);

    // 4. Feedback & Notifications
    SoundAlert.playNotificationBeep();
    showToast(`Rider ${rider.name} assigned to Order #${order.id} successfully!`, "success");
    addNotification(`Order #${order.id} assigned to ${rider.name} for dispatch.`, "info");

    // 5. Select next unassigned order if available
    const remainingPending = orders.filter(o => o.status === "Pending");
    selectedAssignmentOrderId = remainingPending.length > 0 ? remainingPending[0].id : null;

    // 6. Refresh UI
    renderAssignmentsView();
    renderDashboard();
    renderOrdersTable();
    renderRidersCards();

    if (activeDetailOrderId === order.id) {
      openOrderDetailsModal(order.id);
    }
    updateSimulationSummary();
  }

  // Smart Auto-Assign Nearest Rider
  function autoAssignNearestRider() {
    const pendingOrders = orders.filter(o => o.status === "Pending");
    if (pendingOrders.length === 0) {
      showToast("No pending orders waiting to be assigned.", "info");
      return;
    }

    const availableRiders = riders
      .filter(r => r.status === "Available")
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (availableRiders.length === 0) {
      showToast("No available riders right now to auto-assign.", "warning");
      return;
    }

    const targetOrder = pendingOrders.find(o => o.priority === "Urgent") ||
                        pendingOrders.find(o => o.priority === "Express") ||
                        pendingOrders[0];
    const closestRider = availableRiders[0];

    assignRiderToOrder(targetOrder.id, closestRider.id);
  }

  // ==========================================================================
  // Order Details Modal & Interactive 5-Stage Timeline
  // ==========================================================================
  const STANDARD_TIMELINE_STEPS = [
    "Order Created",
    "Rider Assigned",
    "Picked Up",
    "Out for Delivery",
    "Delivered"
  ];

  function openOrderDetailsModal(orderId) {
    const order = findOrderById(orderId);
    if (!order) return;

    activeDetailOrderId = orderId;
    const rider = order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;

    dom.detailModalOrderId.textContent = `Order #${order.id}`;
    dom.detailModalTime.textContent = `Placed: ${order.orderTime || 'Today'}`;
    dom.detailCustomerName.textContent = order.customerName;
    dom.detailCustomerPhone.textContent = order.phone;

    dom.detailStatusBadge.className = `badge ${getStatusBadgeClass(order.status)}`;
    dom.detailStatusBadge.textContent = order.status;

    dom.detailPriorityTag.className = `priority-tag priority-${order.priority}`;
    dom.detailPriorityTag.textContent = order.priority;

    dom.detailAddress.textContent = order.address;
    dom.detailItems.textContent = order.items || "Assorted Items";
    dom.detailAmount.textContent = `Amount: ₹${Number(order.amount).toLocaleString('en-IN')}`;

    if (rider) {
      dom.detailRiderName.textContent = `${rider.name} (${rider.vehicleType})`;
      dom.detailRiderPhone.textContent = `Contact: ${rider.phone}`;
    } else {
      dom.detailRiderName.textContent = "Not Assigned";
      dom.detailRiderPhone.textContent = "—";
    }

    // Populate Live ETA & Incident Center Box
    if (dom.detailEtaBox) {
      if (order.status === "Delivered") {
        dom.detailEtaBox.classList.remove("traffic-alert");
        dom.detailLiveEtaClock.textContent = "Delivery Completed Successfully";
        dom.detailLiveTrafficBadge.className = "badge badge-delivered";
        dom.detailLiveTrafficBadge.textContent = "✅ Verified: Delivered";
        dom.detailProgressFill.style.width = "100%";
        dom.detailTransitText.textContent = "Delivered to Customer";
        dom.detailTriggerTrafficBtn.style.display = "none";
        dom.detailResolveTrafficBtn.style.display = "none";
      } else if (order.trafficDelayed) {
        const delayM = order.trafficDelayMinutes || 10;
        dom.detailEtaBox.classList.add("traffic-alert");
        dom.detailLiveEtaClock.textContent = `⏱️ ${formatMinutesSeconds(order.etaSecondsRemaining)} (Traffic Delay +${delayM}m Active)`;
        dom.detailLiveTrafficBadge.className = "badge badge-cancelled";
        dom.detailLiveTrafficBadge.innerHTML = `⚠️ Heavy Traffic Delay (+${delayM}m)`;
        dom.detailProgressFill.style.width = (order.transitProgress || 65) + "%";
        dom.detailTransitText.textContent = "Rider delayed in traffic • 1.5 km away";
        dom.detailTriggerTrafficBtn.style.display = "none";
        dom.detailResolveTrafficBtn.style.display = "inline-flex";
      } else {
        dom.detailEtaBox.classList.remove("traffic-alert");
        dom.detailLiveEtaClock.textContent = `⏱️ ${formatMinutesSeconds(order.etaSecondsRemaining)} remaining`;
        dom.detailLiveTrafficBadge.className = "badge badge-available";
        dom.detailLiveTrafficBadge.innerHTML = "🟢 ETA Verified: On Schedule";
        dom.detailProgressFill.style.width = (order.transitProgress || 20) + "%";
        dom.detailTransitText.textContent = order.status === "Out for Delivery" ? "Rider en route • 1.5 km away" : order.status === "Picked Up" ? "Package collected from hub" : "Rider dispatched";

        if (order.status === "Out for Delivery" || order.status === "Picked Up") {
          dom.detailTriggerTrafficBtn.style.display = "inline-flex";
        } else {
          dom.detailTriggerTrafficBtn.style.display = "none";
        }
        dom.detailResolveTrafficBtn.style.display = "none";
      }
    }

    renderTimelineStepper(order, rider);
    renderTimelineActionButtons(order, rider);

    openModal(dom.modalOrderDetails);
  }

  function renderTimelineStepper(order, rider) {
    if (!dom.orderTimelineStepper) return;

    let currentStepIndex = 0;
    if (order.status === "Pending") currentStepIndex = 0;
    else if (order.status === "Assigned") currentStepIndex = 1;
    else if (order.status === "Picked Up") currentStepIndex = 2;
    else if (order.status === "Out for Delivery") currentStepIndex = 3;
    else if (order.status === "Delivered") currentStepIndex = 4;
    else if (order.status === "Cancelled") currentStepIndex = -1;

    dom.orderTimelineStepper.innerHTML = STANDARD_TIMELINE_STEPS.map((stepName, idx) => {
      let isCompleted = false;
      let isActive = false;
      let stepTime = "";
      let stepNote = "";

      const historyItem = (order.timeline || []).find(t => t.step === stepName);
      if (historyItem) {
        isCompleted = true;
        stepTime = historyItem.time || "";
        stepNote = historyItem.note || "";
      }

      if (idx === currentStepIndex) {
        isActive = true;
        if (!stepTime) stepTime = "Current Phase";
      }

      const stepClass = isCompleted ? "completed" : isActive ? "active" : "";

      return `
        <div class="timeline-step ${stepClass}">
          <div class="step-marker">
            ${isCompleted ? `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ` : isActive ? `
              <div style="width:8px; height:8px; border-radius:50%; background:var(--primary);"></div>
            ` : ""}
          </div>
          <div class="step-info">
            <div class="step-title-row">
              <span class="step-title">${escapeHTML(stepName)}</span>
              <span class="step-time">${escapeHTML(stepTime)}</span>
            </div>
            <div class="step-note">${escapeHTML(stepNote)}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTimelineActionButtons(order, rider) {
    if (!dom.detailTimelineActions) return;

    let buttonsHTML = "";

    if (order.status === "Pending") {
      buttonsHTML = `
        <button class="btn btn-primary btn-sm" id="modal-action-assign-now">
          Assign Rider Now
        </button>
        <button class="btn btn-outline btn-sm btn-danger" id="modal-action-cancel-order">
          Cancel Order
        </button>
      `;
    } else if (order.status === "Assigned") {
      buttonsHTML = `
        <button class="btn btn-primary btn-sm" id="modal-action-picked-up">
          Mark as Picked Up
        </button>
        <button class="btn btn-outline btn-sm btn-danger" id="modal-action-cancel-order">
          Cancel Order
        </button>
      `;
    } else if (order.status === "Picked Up") {
      buttonsHTML = `
        <button class="btn btn-primary btn-sm" id="modal-action-out-for-delivery">
          Mark as Out for Delivery
        </button>
      `;
    } else if (order.status === "Out for Delivery") {
      buttonsHTML = `
        <button class="btn btn-success btn-sm" id="modal-action-delivered">
          Mark as Delivered (Complete)
        </button>
      `;
    } else if (order.status === "Delivered") {
      buttonsHTML = `
        <div style="font-size:0.85rem; color:var(--success); font-weight:600; display:flex; align-items:center; gap:0.4rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Delivery Completed Successfully
        </div>
      `;
    } else if (order.status === "Cancelled") {
      buttonsHTML = `
        <div style="font-size:0.85rem; color:var(--danger); font-weight:600;">
          Order was Cancelled
        </div>
      `;
    }

    dom.detailTimelineActions.innerHTML = buttonsHTML;

    // Attach timeline event listeners
    const assignBtn = document.getElementById("modal-action-assign-now");
    if (assignBtn) {
      assignBtn.addEventListener("click", () => {
        closeModal(dom.modalOrderDetails);
        switchView("assignments");
        selectedAssignmentOrderId = order.id;
        renderAssignmentsView();
      });
    }

    const pickedUpBtn = document.getElementById("modal-action-picked-up");
    if (pickedUpBtn) {
      pickedUpBtn.addEventListener("click", () => advanceOrderStatus(order.id, "Picked Up"));
    }

    const outDeliveryBtn = document.getElementById("modal-action-out-for-delivery");
    if (outDeliveryBtn) {
      outDeliveryBtn.addEventListener("click", () => advanceOrderStatus(order.id, "Out for Delivery"));
    }

    const deliveredBtn = document.getElementById("modal-action-delivered");
    if (deliveredBtn) {
      deliveredBtn.addEventListener("click", () => advanceOrderStatus(order.id, "Delivered"));
    }

    const cancelBtn = document.getElementById("modal-action-cancel-order");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => advanceOrderStatus(order.id, "Cancelled"));
    }
  }

  // Advance order lifecycle step-by-step
  function advanceOrderStatus(orderId, newStatus) {
    const order = findOrderById(orderId);
    if (!order) return;

    const currentTime = getFormattedCurrentTime();
    order.status = newStatus;

    if (!order.timeline) order.timeline = [];
    if (!order.customerNotifications) order.customerNotifications = [];

    let note = "";
    if (newStatus === "Picked Up") {
      note = "Order picked up by rider from merchant hub";
      order.transitProgress = 40;
      order.etaMinutes = 14;
      order.etaSecondsRemaining = 14 * 60;

      order.customerNotifications.unshift({
        id: Date.now(),
        time: currentTime,
        title: "Order Picked Up",
        message: "Rider collected your order from merchant. In transit.",
        type: "status"
      });
      showCustomerPushBanner("Order Picked Up", "Rider collected package. On the way to you!", false);
    } else if (newStatus === "Out for Delivery") {
      note = "Rider en route to delivery destination";
      order.transitProgress = 65;
      order.etaMinutes = 12;
      order.etaSecondsRemaining = 12 * 60;

      order.customerNotifications.unshift({
        id: Date.now(),
        time: currentTime,
        title: "Out for Delivery 🛵",
        message: "Rider is heading to your doorstep! Estimated arrival in 12 mins.",
        type: "status"
      });
      showCustomerPushBanner("Out for Delivery 🛵", "Rider is in your area, arriving shortly!", false);
    } else if (newStatus === "Delivered") {
      note = "Delivered to customer with OTP confirmation";
      order.transitProgress = 100;
      order.etaMinutes = 0;
      order.etaSecondsRemaining = 0;
      order.trafficDelayed = false;

      order.customerNotifications.unshift({
        id: Date.now(),
        time: currentTime,
        title: "Delivered Successfully 🎉",
        message: "Your delivery is complete. Enjoy your items!",
        type: "success"
      });
      showCustomerPushBanner("Delivered Successfully 🎉", "Order delivered to your doorstep. Thank you!", false);

      // Free up rider
      if (order.assignedRiderId) {
        const rider = findRiderById(order.assignedRiderId);
        if (rider) {
          rider.status = "Available";
          rider.currentOrderId = null;
          rider.deliveriesCompleted = (rider.deliveriesCompleted || 0) + 1;
        }
      }
    } else if (newStatus === "Cancelled") {
      note = "Order cancelled by dispatcher";
      order.trafficDelayed = false;
      if (order.assignedRiderId) {
        const rider = findRiderById(order.assignedRiderId);
        if (rider) {
          rider.status = "Available";
          rider.currentOrderId = null;
        }
      }
    }

    order.timeline.push({
      step: newStatus,
      time: currentTime,
      completed: true,
      note
    });

    DataStore.saveOrders(orders);
    DataStore.saveRiders(riders);

    SoundAlert.playNotificationBeep();
    showToast(`Order #${order.id} status changed to ${newStatus}`, newStatus === "Delivered" ? "success" : "info");
    addNotification(`Order #${order.id} is now ${newStatus}.`, newStatus === "Delivered" ? "success" : "info");

    // Re-render
    openOrderDetailsModal(order.id);
    renderDashboard();
    renderOrdersTable();
    renderRidersCards();
    renderAssignmentsView();
    renderCustomerPhoneScreen();
    updateSimulationSummary();
  }

  // ==========================================================================
  // Quick Assign Modal
  // ==========================================================================
  function openQuickAssignModal(orderId) {
    const order = findOrderById(orderId);
    if (!order) return;

    quickAssignOrderId = orderId;
    dom.quickAssignOrderLabel.textContent = `Order #${order.id} • ${order.customerName} (${order.address.split(',')[0]})`;

    const availableRiders = riders
      .filter(r => r.status === "Available")
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (availableRiders.length === 0) {
      dom.quickAssignRidersList.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted);">
          No riders currently available for immediate dispatch.
        </div>
      `;
    } else {
      dom.quickAssignRidersList.innerHTML = availableRiders.map(rider => `
        <div class="rider-mini-item">
          <div class="rider-avatar-bubble">
            ${escapeHTML(rider.name.charAt(0))}
          </div>
          <div class="rider-info-block">
            <div class="rider-name-title">${escapeHTML(rider.name)}</div>
            <div class="rider-sub-details">
              <span>${escapeHTML(rider.vehicle)}</span>
              <span>•</span>
              <span class="distance-pill">${rider.distanceKm} km</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm execute-quick-assign-btn" data-rider-id="${rider.id}">
            Assign
          </button>
        </div>
      `).join("");
    }

    openModal(dom.modalQuickAssign);
  }

  // ==========================================================================
  // Form Submissions: Create Order & Add Rider
  // ==========================================================================
  function initForms() {
    // 1. Create Order Form
    dom.createOrderForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const customerName = document.getElementById("new-order-customer").value.trim();
      const phone = document.getElementById("new-order-phone").value.trim();
      const amount = Number(document.getElementById("new-order-amount").value);
      const address = document.getElementById("new-order-address").value.trim();
      const priority = document.getElementById("new-order-priority").value;
      const items = document.getElementById("new-order-items").value.trim() || "Delivery Package";

      const orderCount = orders.length + 1025;
      const newId = `ORD-${orderCount}`;

      const newOrder = {
        id: newId,
        customerName,
        phone,
        address,
        amount,
        priority,
        status: "Pending",
        orderTime: getFormattedCurrentTime(),
        timestamp: Date.now(),
        assignedRiderId: null,
        items,
        etaMinutes: 28,
        etaSecondsRemaining: 1680,
        transitProgress: 5,
        trafficDelayed: false,
        trafficDelayMinutes: 10,
        customerNotifications: [
          {
            id: Date.now(),
            time: getFormattedCurrentTime(),
            title: "Order Placed",
            message: "Order placed successfully. Waiting for dispatch.",
            type: "status"
          }
        ],
        timeline: [
          {
            step: "Order Created",
            time: getFormattedCurrentTime(),
            completed: true,
            note: "Order created via dispatcher console"
          }
        ]
      };

      orders.unshift(newOrder);
      DataStore.saveOrders(orders);

      dom.createOrderForm.reset();
      closeModal(dom.modalCreateOrder);

      SoundAlert.playNotificationBeep();
      showToast(`Order #${newId} created successfully!`, "success");
      addNotification(`New Order #${newId} registered from ${customerName}.`, "info");

      renderDashboard();
      renderOrdersTable();
      renderAssignmentsView();
      updateSimulationSummary();
    });

    // 2. Add Rider Form
    dom.addRiderForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("new-rider-name").value.trim();
      const phone = document.getElementById("new-rider-phone").value.trim();
      const vehicleType = document.getElementById("new-rider-vehicle-type").value;
      const vehicle = document.getElementById("new-rider-vehicle").value.trim();
      const location = document.getElementById("new-rider-location").value.trim();
      const status = document.getElementById("new-rider-status").value;

      const newRiderId = `RID-${200 + riders.length + 1}`;

      const newRider = {
        id: newRiderId,
        name,
        phone,
        vehicle,
        vehicleType,
        location,
        distanceKm: Math.round((Math.random() * 4 + 1.2) * 10) / 10,
        status,
        currentOrderId: null,
        rating: 4.8,
        deliveriesCompleted: 0
      };

      riders.push(newRider);
      DataStore.saveRiders(riders);

      dom.addRiderForm.reset();
      closeModal(dom.modalAddRider);

      SoundAlert.playNotificationBeep();
      showToast(`Rider ${name} registered successfully!`, "success");
      addNotification(`Rider ${name} (${newRiderId}) joined the fleet.`, "info");

      renderDashboard();
      renderRidersCards();
      renderAssignmentsView();
    });
  }

  // ==========================================================================
  // Global Event Delegation & Setup
  // ==========================================================================
  function setupEventListeners() {
    // Navigation
    dom.navLinks.forEach(link => {
      link.addEventListener("click", () => {
        const view = link.getAttribute("data-view");
        switchView(view);
      });
    });

    // Mobile menu toggle
    dom.mobileMenuBtn.addEventListener("click", () => {
      dom.sidebar.classList.toggle("open");
      dom.sidebarOverlay.classList.toggle("active");
    });
    dom.sidebarOverlay.addEventListener("click", closeMobileSidebar);

    // Theme toggles
    dom.themeToggleBtn.addEventListener("click", toggleTheme);
    if (dom.settingsThemeSwitch) {
      dom.settingsThemeSwitch.addEventListener("change", (e) => {
        setTheme(e.target.checked ? "dark" : "light");
      });
    }

    // Notifications Popover Toggle
    dom.notificationBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dom.notificationPopover.classList.toggle("active");
      dom.notifBadgeDot.style.display = "none";
    });

    document.addEventListener("click", (e) => {
      if (dom.notificationPopover && !dom.notificationPopover.contains(e.target) && e.target !== dom.notificationBtn) {
        dom.notificationPopover.classList.remove("active");
      }
    });

    if (dom.clearNotifsBtn) {
      dom.clearNotifsBtn.addEventListener("click", () => {
        notifications = [];
        renderNotifications();
      });
    }

    // Customer Smartphone Modal Openers
    if (dom.openCustomerDeviceBtn) {
      dom.openCustomerDeviceBtn.addEventListener("click", () => openCustomerDeviceModal());
    }
    if (dom.simOpenPhoneBtn) {
      dom.simOpenPhoneBtn.addEventListener("click", () => openCustomerDeviceModal());
    }

    // Simulation Bar Controls
    if (dom.simToggleBtn) {
      dom.simToggleBtn.addEventListener("click", () => SimulationEngine.toggle());
    }
    if (dom.simSpeedBtns) {
      dom.simSpeedBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const speed = Number(btn.getAttribute("data-speed"));
          SimulationEngine.setSpeed(speed);
        });
      });
    }
    if (dom.simTriggerTrafficBtn) {
      dom.simTriggerTrafficBtn.addEventListener("click", () => {
        triggerTrafficDelay(null, selectedTrafficDelayMinutes);
      });
    }
    if (dom.simSpawnOrderBtn) {
      dom.simSpawnOrderBtn.addEventListener("click", () => spawnSimulatedOrder());
    }

    // Configurable Delay Dropdown Selectors
    if (dom.simTrafficDelaySelect) {
      dom.simTrafficDelaySelect.addEventListener("change", handleDelaySelectChange);
    }
    if (dom.detailTrafficDelaySelect) {
      dom.detailTrafficDelaySelect.addEventListener("change", handleDelaySelectChange);
    }
    if (dom.phoneDelaySelect) {
      dom.phoneDelaySelect.addEventListener("change", handleDelaySelectChange);
    }

    // Customer Phone Screen Controls & Tabs
    if (dom.phoneOrderSelect) {
      dom.phoneOrderSelect.addEventListener("change", (e) => {
        activeCustomerPhoneOrderId = e.target.value;
        renderCustomerPhoneScreen();
      });
    }
    if (dom.phoneTabStepper) {
      dom.phoneTabStepper.addEventListener("click", () => {
        dom.phoneTabStepper.classList.add("active");
        if (dom.phoneTabMap) dom.phoneTabMap.classList.remove("active");
        if (dom.phoneStepperView) dom.phoneStepperView.style.display = "flex";
        if (dom.phoneMapView) dom.phoneMapView.style.display = "none";
      });
    }
    if (dom.phoneTabMap) {
      dom.phoneTabMap.addEventListener("click", () => {
        dom.phoneTabMap.classList.add("active");
        if (dom.phoneTabStepper) dom.phoneTabStepper.classList.remove("active");
        if (dom.phoneStepperView) dom.phoneStepperView.style.display = "none";
        if (dom.phoneMapView) dom.phoneMapView.style.display = "block";
        renderCustomerPhoneScreen();
      });
    }
    if (dom.phoneTestTrafficBtn) {
      dom.phoneTestTrafficBtn.addEventListener("click", () => {
        triggerTrafficDelay(activeCustomerPhoneOrderId, selectedTrafficDelayMinutes);
      });
    }
    if (dom.phoneResolveTrafficBtn) {
      dom.phoneResolveTrafficBtn.addEventListener("click", () => {
        resolveTrafficDelay(activeCustomerPhoneOrderId);
      });
    }
    if (dom.phoneTestAdvanceBtn) {
      dom.phoneTestAdvanceBtn.addEventListener("click", () => {
        const order = findOrderById(activeCustomerPhoneOrderId);
        if (!order) return;
        if (order.status === "Pending") {
          autoAssignNearestRider();
        } else if (order.status === "Assigned") {
          advanceOrderStatus(order.id, "Picked Up");
        } else if (order.status === "Picked Up") {
          advanceOrderStatus(order.id, "Out for Delivery");
        } else if (order.status === "Out for Delivery") {
          advanceOrderStatus(order.id, "Delivered");
        } else {
          showToast(`Order #${order.id} is already ${order.status}`, "info");
        }
      });
    }
    if (dom.phoneCallRiderBtn) {
      dom.phoneCallRiderBtn.addEventListener("click", () => {
        const order = findOrderById(activeCustomerPhoneOrderId);
        const rider = order && order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;
        if (rider) {
          showToast(`Calling Rider ${rider.name} at ${rider.phone}...`, "info");
        } else {
          showToast("Rider not yet assigned for this delivery.", "warning");
        }
      });
    }

    // Order Details Incident Controls
    if (dom.detailTriggerTrafficBtn) {
      dom.detailTriggerTrafficBtn.addEventListener("click", () => {
        if (activeDetailOrderId) triggerTrafficDelay(activeDetailOrderId, selectedTrafficDelayMinutes);
      });
    }
    if (dom.detailResolveTrafficBtn) {
      dom.detailResolveTrafficBtn.addEventListener("click", () => {
        if (activeDetailOrderId) resolveTrafficDelay(activeDetailOrderId);
      });
    }
    if (dom.detailOpenPhoneBtn) {
      dom.detailOpenPhoneBtn.addEventListener("click", () => {
        closeModal(dom.modalOrderDetails);
        openCustomerDeviceModal(activeDetailOrderId);
      });
    }

    // Live GPS Map View Controls
    if (dom.mapRecenterBtn) {
      dom.mapRecenterBtn.addEventListener("click", centerMapOnHub);
    }
    if (dom.mapToggleTrafficLayerBtn) {
      dom.mapToggleTrafficLayerBtn.addEventListener("click", toggleTrafficLayer);
    }
    if (dom.mapOrderFilter) {
      dom.mapOrderFilter.addEventListener("change", (e) => {
        mapSelectedOrderId = e.target.value;
        updateMapRiders();
      });
    }
    if (dom.telemetryTriggerTrafficBtn) {
      dom.telemetryTriggerTrafficBtn.addEventListener("click", () => {
        const target = findOrderById(mapSelectedOrderId);
        if (!target) return;
        if (target.trafficDelayed) {
          resolveTrafficDelay(target.id);
        } else {
          triggerTrafficDelay(target.id, selectedTrafficDelayMinutes);
        }
      });
    }
    if (dom.telemetryOpenPhoneBtn) {
      dom.telemetryOpenPhoneBtn.addEventListener("click", () => {
        openCustomerDeviceModal(mapSelectedOrderId);
      });
    }

    // Global Search Input
    if (dom.globalSearchInput) {
      dom.globalSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (query) {
          switchView("orders");
          if (dom.ordersSearchInput) {
            dom.ordersSearchInput.value = query;
            renderOrdersTable();
          }
        }
      });
    }

    // Dashboard Quick Buttons
    if (dom.dashCreateOrderBtn) {
      dom.dashCreateOrderBtn.addEventListener("click", () => openModal(dom.modalCreateOrder));
    }
    if (dom.ordersCreateOrderBtn) {
      dom.ordersCreateOrderBtn.addEventListener("click", () => openModal(dom.modalCreateOrder));
    }
    if (dom.ridersAddRiderBtn) {
      dom.ridersAddRiderBtn.addEventListener("click", () => openModal(dom.modalAddRider));
    }
    if (dom.dashQuickAssignBtn) {
      dom.dashQuickAssignBtn.addEventListener("click", () => switchView("assignments"));
    }
    if (dom.dashViewAllOrdersBtn) {
      dom.dashViewAllOrdersBtn.addEventListener("click", () => switchView("orders"));
    }
    if (dom.dashViewAllRidersBtn) {
      dom.dashViewAllRidersBtn.addEventListener("click", () => switchView("riders"));
    }

    // Filters
    if (dom.ordersSearchInput) dom.ordersSearchInput.addEventListener("input", renderOrdersTable);
    if (dom.ordersStatusFilter) dom.ordersStatusFilter.addEventListener("change", renderOrdersTable);
    if (dom.ordersPriorityFilter) dom.ordersPriorityFilter.addEventListener("change", renderOrdersTable);

    if (dom.ridersSearchInput) dom.ridersSearchInput.addEventListener("input", renderRidersCards);
    if (dom.ridersStatusFilter) dom.ridersStatusFilter.addEventListener("change", renderRidersCards);

    // Smart Auto Assign
    if (dom.autoAssignSmartBtn) {
      dom.autoAssignSmartBtn.addEventListener("click", autoAssignNearestRider);
    }

    // Settings Profile Save
    if (dom.saveProfileBtn) {
      dom.saveProfileBtn.addEventListener("click", () => {
        showToast("Dispatcher profile updated successfully.", "success");
      });
    }

    // Reset Demo Data
    if (dom.resetDemoDataBtn) {
      dom.resetDemoDataBtn.addEventListener("click", () => {
        if (confirm("Reset all orders and riders back to the default college demo dataset?")) {
          DataStore.resetToDefault();
          orders = DataStore.getOrders();
          riders = DataStore.getRiders();
          selectedAssignmentOrderId = null;
          activeCustomerPhoneOrderId = null;
          showToast("Demo data successfully reset to initial state.", "success");
          addNotification("System state restored to factory seed data.", "info");
          renderDashboard();
          renderOrdersTable();
          renderRidersCards();
          renderAssignmentsView();
          updateSimulationSummary();
        }
      });
    }

    // Export Orders (JSON)
    if (dom.exportOrdersBtn) {
      dom.exportOrdersBtn.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `delivery_orders_export_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Orders exported as JSON file.", "success");
      });
    }

    // Delegated Clicks
    document.addEventListener("click", (e) => {
      // 1. View Order Details
      const viewOrderBtn = e.target.closest(".view-order-details-btn");
      if (viewOrderBtn) {
        const orderId = viewOrderBtn.getAttribute("data-order-id");
        if (orderId) openOrderDetailsModal(orderId);
        return;
      }

      // 2. Open Customer Phone for a specific order
      const phoneOrderBtn = e.target.closest(".open-phone-for-order-btn");
      if (phoneOrderBtn) {
        const orderId = phoneOrderBtn.getAttribute("data-order-id");
        if (orderId) openCustomerDeviceModal(orderId);
        return;
      }

      // 3. Trigger Traffic from table row
      const trafficRowBtn = e.target.closest(".row-trigger-traffic-btn");
      if (trafficRowBtn) {
        const orderId = trafficRowBtn.getAttribute("data-order-id");
        if (orderId) triggerTrafficDelay(orderId, selectedTrafficDelayMinutes);
        return;
      }

      // 4. Assign Order from Dashboard / Orders Table
      const assignDashBtn = e.target.closest(".assign-order-dash-btn");
      if (assignDashBtn) {
        const orderId = assignDashBtn.getAttribute("data-order-id");
        if (orderId) openQuickAssignModal(orderId);
        return;
      }

      // 5. Quick dispatch rider from Dashboard Available Riders
      const quickRiderBtn = e.target.closest(".quick-dash-assign-rider-btn");
      if (quickRiderBtn) {
        const pendingOrders = orders.filter(o => o.status === "Pending");
        if (pendingOrders.length === 0) {
          showToast("No pending orders available to assign this rider to.", "info");
          return;
        }
        switchView("assignments");
        return;
      }

      // 6. Select Unassigned Order Card in Assignment View
      const unassignedCard = e.target.closest(".unassigned-card");
      if (unassignedCard) {
        const orderId = unassignedCard.getAttribute("data-assignment-order-id");
        if (orderId) {
          selectedAssignmentOrderId = orderId;
          renderAssignmentsView();
        }
        return;
      }

      // 7. Execute Rider Assignment from Assignment View
      const assignExecuteBtn = e.target.closest(".assign-execute-btn");
      if (assignExecuteBtn) {
        const orderId = assignExecuteBtn.getAttribute("data-order-id");
        const riderId = assignExecuteBtn.getAttribute("data-rider-id");
        if (orderId && riderId) {
          assignRiderToOrder(orderId, riderId);
        }
        return;
      }

      // 8. Execute Quick Assign from Quick Assign Modal
      const quickExecBtn = e.target.closest(".execute-quick-assign-btn");
      if (quickExecBtn) {
        const riderId = quickExecBtn.getAttribute("data-rider-id");
        if (quickAssignOrderId && riderId) {
          assignRiderToOrder(quickAssignOrderId, riderId);
          closeModal(dom.modalQuickAssign);
        }
        return;
      }

      // 9. Interactive Map elements (Rider markers, destination pins, telemetry row)
      const mapItem = e.target.closest(".map-rider-marker, .map-dest-pin, .rider-telemetry-row");
      if (mapItem) {
        const orderId = mapItem.getAttribute("data-order-id");
        if (orderId) {
          mapSelectedOrderId = orderId;
          if (dom.mapOrderFilter) dom.mapOrderFilter.value = orderId;
          updateMapRiders();
          const target = findOrderById(orderId);
          if (target) showToast(`GPS tracking focused on Order #${target.id} (${target.customerName})`, "info");
        }
        return;
      }
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    initTheme();
    orders = DataStore.getOrders();
    riders = DataStore.getRiders();

    setupEventListeners();
    initForms();
    renderNotifications();

    // Default to Dashboard
    switchView("dashboard");
    updateSimulationSummary();

    // Start simulation clock updates
    setInterval(updateClockAndCountdowns, 1000);
  }

  // Boot on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
