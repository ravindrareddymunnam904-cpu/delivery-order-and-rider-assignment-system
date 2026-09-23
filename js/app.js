/**
 * Delivery Order & Rider Assignment - Application Controller
 * Handles SPA navigation, theme switching, state synchronization,
 * assignment workflows, live timeline progression, and modal forms.
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

  let notifications = [
    { id: 1, text: "System initialized with Kakinada logistics demo data.", time: "Just now", type: "info" },
    { id: 2, text: "Order #ORD-1025 marked as Urgent medical dispatch.", time: "45m ago", type: "warning" },
    { id: 3, text: "Rider Ananya Roy is Out for Delivery with #ORD-1021.", time: "1h ago", type: "info" }
  ];

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
    detailTimelineActions: document.getElementById("detail-timeline-actions")
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
    }, 3800);
  }

  function addNotification(text, type = "info") {
    const notif = {
      id: Date.now(),
      text,
      time: "Just now",
      type
    };
    notifications.unshift(notif);
    if (notifications.length > 8) notifications.pop();
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

  function findRiderById(riderId) {
    return riders.find(r => r.id === riderId) || null;
  }

  function findOrderById(orderId) {
    return orders.find(o => o.id === orderId) || null;
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
    // Update active nav link
    dom.navLinks.forEach(link => {
      if (link.getAttribute("data-view") === viewName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Update active section
    dom.viewSections.forEach(sec => {
      if (sec.id === `view-${viewName}`) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    // Update header title
    const titles = {
      dashboard: "Dashboard Overview",
      orders: "Order Management",
      riders: "Delivery Fleet & Riders",
      assignments: "Rider Assignment Console",
      settings: "Settings & Demo Controls"
    };
    dom.pageTitle.textContent = titles[viewName] || "Dashboard";

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Rerender view if necessary
    if (viewName === "assignments") {
      renderAssignmentsView();
    } else if (viewName === "orders") {
      renderOrdersTable();
    } else if (viewName === "riders") {
      renderRidersCards();
    } else if (viewName === "dashboard") {
      renderDashboard();
    }
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

    // Update KPI card numbers
    if (dom.kpiTotalOrders) dom.kpiTotalOrders.textContent = totalOrders;
    if (dom.kpiPendingOrders) dom.kpiPendingOrders.textContent = pendingOrders;
    if (dom.kpiDeliveredOrders) dom.kpiDeliveredOrders.textContent = deliveredOrders;
    if (dom.kpiAvailableRiders) dom.kpiAvailableRiders.textContent = availableRiders;

    // Update Sidebar Badges
    if (dom.navOrdersCount) dom.navOrdersCount.textContent = totalOrders;
    if (dom.navRidersCount) dom.navRidersCount.textContent = riders.length;
    if (dom.navUnassignedCount) dom.navUnassignedCount.textContent = pendingOrders;

    // Assignment pane count
    if (dom.unassignedBadgeCount) dom.unassignedBadgeCount.textContent = `${pendingOrders} Pending`;
    if (dom.availableBadgeCount) dom.availableBadgeCount.textContent = `${availableRiders} Available`;
  }

  // ==========================================================================
  // Render: Dashboard View
  // ==========================================================================
  function renderDashboard() {
    updateKPIsAndBadges();

    // 1. Recent Orders Table (Top 5)
    const recentOrders = [...orders]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);

    if (dom.dashRecentOrdersTbody) {
      if (recentOrders.length === 0) {
        dom.dashRecentOrdersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No orders recorded yet.</td></tr>`;
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

          return `
            <tr>
              <td>
                <span class="order-id-link view-order-details-btn" data-order-id="${order.id}">#${escapeHTML(order.id)}</span>
              </td>
              <td>
                <div style="font-weight:600;">${escapeHTML(order.customerName)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(order.phone)}</div>
              </td>
              <td style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(order.address)}">
                ${escapeHTML(order.address)}
              </td>
              <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">${escapeHTML(order.status)}</span>
              </td>
              <td>${riderText}</td>
              <td>${actionBtn}</td>
            </tr>
          `;
        }).join("");
      }
    }

    // 2. Available Riders Roster List
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
  // Render: Orders Page
  // ==========================================================================
  function renderOrdersTable() {
    updateKPIsAndBadges();

    const searchQuery = (dom.ordersSearchInput ? dom.ordersSearchInput.value : "").trim().toLowerCase();
    const statusFilter = dom.ordersStatusFilter ? dom.ordersStatusFilter.value : "ALL";
    const priorityFilter = dom.ordersPriorityFilter ? dom.ordersPriorityFilter.value : "ALL";

    let filtered = orders.filter(order => {
      // Status filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== "ALL" && order.priority !== priorityFilter) return false;
      // Search
      if (searchQuery) {
        const matchId = order.id.toLowerCase().includes(searchQuery);
        const matchCust = order.customerName.toLowerCase().includes(searchQuery);
        const matchPhone = order.phone.toLowerCase().includes(searchQuery);
        const matchAddress = order.address.toLowerCase().includes(searchQuery);
        if (!matchId && !matchCust && !matchPhone && !matchAddress) return false;
      }
      return true;
    });

    // Update count label
    if (dom.ordersCountLabel) {
      dom.ordersCountLabel.textContent = `Showing ${filtered.length} of ${orders.length} orders`;
    }

    if (!dom.ordersTableTbody) return;

    if (filtered.length === 0) {
      dom.ordersTableTbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
            No matching orders found.
          </td>
        </tr>
      `;
      return;
    }

    dom.ordersTableTbody.innerHTML = filtered.map(order => {
      const rider = order.assignedRiderId ? findRiderById(order.assignedRiderId) : null;
      const riderDisplay = rider 
        ? `<div style="font-weight:600;">${escapeHTML(rider.name)}</div><div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(rider.vehicleType)}</div>`
        : `<span style="color:var(--text-muted);">Not Assigned</span>`;

      return `
        <tr>
          <td>
            <span class="order-id-link view-order-details-btn" data-order-id="${order.id}">#${escapeHTML(order.id)}</span>
          </td>
          <td>
            <div style="font-weight:600;">${escapeHTML(order.customerName)}</div>
            <span class="priority-tag priority-${order.priority}">${escapeHTML(order.priority)}</span>
          </td>
          <td>${escapeHTML(order.phone)}</td>
          <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(order.address)}">
            ${escapeHTML(order.address)}
          </td>
          <td style="font-weight:600; color:var(--primary);">₹${Number(order.amount).toLocaleString('en-IN')}</td>
          <td style="font-size:0.8rem; color:var(--text-secondary);">${escapeHTML(order.orderTime || "Today")}</td>
          <td>
            <span class="badge ${getStatusBadgeClass(order.status)}">${escapeHTML(order.status)}</span>
          </td>
          <td>${riderDisplay}</td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-outline btn-sm view-order-details-btn" data-order-id="${order.id}">Details</button>
              ${order.status === "Pending" ? `<button class="btn btn-primary btn-sm assign-order-dash-btn" data-order-id="${order.id}">Assign</button>` : ""}
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>${escapeHTML(rider.phone)}</span>
            </div>

            <div class="rider-card-info-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
              <span>${escapeHTML(rider.vehicle)}</span>
            </div>

            <div class="rider-card-info-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(rider.location)}</span>
            </div>
          </div>

          ${activeOrderText}

          <div style="border-top:1px dashed var(--border-color); padding-top:0.75rem; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-secondary); margin-top:auto;">
            <div>⭐ ${rider.rating || '4.8'} rating</div>
            <div>${rider.deliveriesCompleted || 0} deliveries done</div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ==========================================================================
  // Render: Assignments View (Core Showcase)
  // ==========================================================================
  function renderAssignmentsView() {
    updateKPIsAndBadges();

    const pendingOrders = orders.filter(o => o.status === "Pending");
    const availableRiders = riders
      .filter(r => r.status === "Available")
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // If current selectedAssignmentOrderId is not in pendingOrders, select first available
    if (pendingOrders.length > 0) {
      if (!selectedAssignmentOrderId || !pendingOrders.some(o => o.id === selectedAssignmentOrderId)) {
        selectedAssignmentOrderId = pendingOrders[0].id;
      }
    } else {
      selectedAssignmentOrderId = null;
    }

    // 1. Render Left Pane (Unassigned Orders)
    if (dom.unassignedOrdersContainer) {
      if (pendingOrders.length === 0) {
        dom.unassignedOrdersContainer.innerHTML = `
          <div class="empty-state-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div style="font-weight:600; color:var(--text-primary);">All Orders Dispatched!</div>
            <div style="font-size:0.8rem;">There are no pending orders waiting for rider assignment right now.</div>
          </div>
        `;
      } else {
        dom.unassignedOrdersContainer.innerHTML = pendingOrders.map(order => {
          const isSelected = order.id === selectedAssignmentOrderId;
          return `
            <div class="unassigned-card ${isSelected ? 'selected' : ''}" data-assignment-order-id="${order.id}">
              <div class="unassigned-card-top">
                <span style="font-weight:700; color:var(--primary); font-size:0.95rem;">#${escapeHTML(order.id)}</span>
                <span class="priority-tag priority-${order.priority}">${escapeHTML(order.priority)}</span>
              </div>
              <div class="unassigned-card-cust">${escapeHTML(order.customerName)}</div>
              <div class="unassigned-card-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(order.address)}</span>
              </div>
              <div class="unassigned-card-bottom">
                <span>₹${Number(order.amount).toLocaleString('en-IN')}</span>
                <span>${escapeHTML(order.orderTime)}</span>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // 2. Render Right Pane (Available Riders for Selected Order)
    const selectedOrder = selectedAssignmentOrderId ? findOrderById(selectedAssignmentOrderId) : null;

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
            <div>All delivery riders are currently on delivery or offline. Check the Riders tab to update status.</div>
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

  // ==========================================================================
  // Action: Assign Rider Workflow (Core Prototype Logic)
  // ==========================================================================
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
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      step: "Rider Assigned",
      time: currentTime,
      completed: true,
      note: `Assigned to ${rider.name} (${rider.vehicle})`
    });

    // 2. Update Rider State
    rider.status = "On Delivery";
    rider.currentOrderId = order.id;

    // 3. Persist State
    DataStore.saveOrders(orders);
    DataStore.saveRiders(riders);

    // 4. Feedback & Notifications
    const successMsg = `Rider ${rider.name} assigned to Order #${order.id} successfully!`;
    showToast(successMsg, "success");
    addNotification(`Order #${order.id} assigned to ${rider.name} for dispatch.`, "info");

    // 5. Select next unassigned order if available
    const remainingPending = orders.filter(o => o.status === "Pending");
    selectedAssignmentOrderId = remainingPending.length > 0 ? remainingPending[0].id : null;

    // 6. Refresh UI
    renderAssignmentsView();
    renderDashboard();
    renderOrdersTable();
    renderRidersCards();

    // If order details modal is open for this order, refresh it
    if (activeDetailOrderId === order.id) {
      openOrderDetailsModal(order.id);
    }
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

    // Pick highest priority order or first pending
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

    // Fill metadata
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

    // Render Timeline Stepper
    renderTimelineStepper(order, rider);

    // Render Interactive Action Buttons
    renderTimelineActionButtons(order, rider);

    openModal(dom.modalOrderDetails);
  }

  function renderTimelineStepper(order, rider) {
    if (!dom.orderTimelineStepper) return;
    
    // Determine the furthest step reached
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

    let note = "";
    if (newStatus === "Picked Up") {
      note = "Order picked up by rider from merchant hub";
    } else if (newStatus === "Out for Delivery") {
      note = "Rider en route to delivery destination";
    } else if (newStatus === "Delivered") {
      note = "Delivered to customer with OTP confirmation";
      
      // Free up the rider!
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
      // Free up rider if previously assigned
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

    showToast(`Order #${order.id} status changed to ${newStatus}`, newStatus === "Delivered" ? "success" : "info");
    addNotification(`Order #${order.id} is now ${newStatus}.`, newStatus === "Delivered" ? "success" : "info");

    // Re-render
    openOrderDetailsModal(order.id);
    renderDashboard();
    renderOrdersTable();
    renderRidersCards();
    renderAssignmentsView();
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

      // Generate next order ID
      const orderCount = orders.length + 1024;
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

      showToast(`Order #${newId} created successfully!`, "success");
      addNotification(`New Order #${newId} registered from ${customerName}.`, "info");

      renderDashboard();
      renderOrdersTable();
      renderAssignmentsView();
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
    // Sidebar navigation clicks
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

    // Global Search Input
    if (dom.globalSearchInput) {
      dom.globalSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        // If user types in global search, switch to Orders view and sync search input
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

    // Orders Filter Listeners
    if (dom.ordersSearchInput) dom.ordersSearchInput.addEventListener("input", renderOrdersTable);
    if (dom.ordersStatusFilter) dom.ordersStatusFilter.addEventListener("change", renderOrdersTable);
    if (dom.ordersPriorityFilter) dom.ordersPriorityFilter.addEventListener("change", renderOrdersTable);

    // Riders Filter Listeners
    if (dom.ridersSearchInput) dom.ridersSearchInput.addEventListener("input", renderRidersCards);
    if (dom.ridersStatusFilter) dom.ridersStatusFilter.addEventListener("change", renderRidersCards);

    // Smart Auto Assign Button
    if (dom.autoAssignSmartBtn) {
      dom.autoAssignSmartBtn.addEventListener("click", autoAssignNearestRider);
    }

    // Settings Profile Save
    if (dom.saveProfileBtn) {
      dom.saveProfileBtn.addEventListener("click", () => {
        showToast("Dispatcher profile updated successfully.", "success");
      });
    }

    // Reset Demo Data Button
    if (dom.resetDemoDataBtn) {
      dom.resetDemoDataBtn.addEventListener("click", () => {
        if (confirm("Reset all orders and riders back to the default college demo dataset?")) {
          DataStore.resetToDefault();
          orders = DataStore.getOrders();
          riders = DataStore.getRiders();
          selectedAssignmentOrderId = null;
          showToast("Demo data successfully reset to initial state.", "success");
          addNotification("System state restored to factory seed data.", "info");
          renderDashboard();
          renderOrdersTable();
          renderRidersCards();
          renderAssignmentsView();
        }
      });
    }

    // Export Orders (JSON) Button
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

    // Delegated Clicks: Order Details, Quick Assign, Card Selection
    document.addEventListener("click", (e) => {
      // 1. View Order Details
      const viewOrderBtn = e.target.closest(".view-order-details-btn");
      if (viewOrderBtn) {
        const orderId = viewOrderBtn.getAttribute("data-order-id");
        if (orderId) openOrderDetailsModal(orderId);
        return;
      }

      // 2. Assign Order from Dashboard / Orders Table (Opens quick assign modal)
      const assignDashBtn = e.target.closest(".assign-order-dash-btn");
      if (assignDashBtn) {
        const orderId = assignDashBtn.getAttribute("data-order-id");
        if (orderId) openQuickAssignModal(orderId);
        return;
      }

      // 3. Quick dispatch rider from Dashboard Available Riders
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

      // 4. Select Unassigned Order Card in Assignment View
      const unassignedCard = e.target.closest(".unassigned-card");
      if (unassignedCard) {
        const orderId = unassignedCard.getAttribute("data-assignment-order-id");
        if (orderId) {
          selectedAssignmentOrderId = orderId;
          renderAssignmentsView();
        }
        return;
      }

      // 5. Execute Rider Assignment from Assignment View
      const assignExecuteBtn = e.target.closest(".assign-execute-btn");
      if (assignExecuteBtn) {
        const orderId = assignExecuteBtn.getAttribute("data-order-id");
        const riderId = assignExecuteBtn.getAttribute("data-rider-id");
        if (orderId && riderId) {
          assignRiderToOrder(orderId, riderId);
        }
        return;
      }

      // 6. Execute Quick Assign from Quick Assign Modal
      const quickExecBtn = e.target.closest(".execute-quick-assign-btn");
      if (quickExecBtn) {
        const riderId = quickExecBtn.getAttribute("data-rider-id");
        if (quickAssignOrderId && riderId) {
          assignRiderToOrder(quickAssignOrderId, riderId);
          closeModal(dom.modalQuickAssign);
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
  }

  // Boot on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
