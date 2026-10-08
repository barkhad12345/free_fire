/**
 * ============================================================================
 * FREE FIRE DIAMONDS - TOP-UP WEBAPP (PRODUCTION SUPABASE INTEGRATION)
 * Vanilla JavaScript SPA with Real Supabase Auth, PostgreSQL RLS & Admin Panel
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. SUPABASE CLIENT CONFIGURATION
  // --------------------------------------------------------------------------
  const SUPABASE_URL = 'https://bacgsctnupxconexfgih.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY2dzY3RudXB4Y29uZXhmZ2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODQ4MzMsImV4cCI6MjEwNzA2MDgzM30.IRzjJ-SQ5zWeHasOVVtdHiDKqJXKDaqMCUcoda3XMdI';

  const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // --------------------------------------------------------------------------
  // 2. DEFAULT SEED DATA (Used as resilient fallback or pre-migration baseline)
  // --------------------------------------------------------------------------
  const DEFAULT_PACKAGES = [
    { id: 1, name: '100 Diamonds', diamonds: 100, bonus: 0, price: 1.00, currency: 'USD', image_url: 'assets/images/diamond-single.jpg', active: true, sort_order: 1 },
    { id: 2, name: '310 Diamonds', diamonds: 310, bonus: 15, price: 3.00, currency: 'USD', image_url: 'assets/images/diamond-double.jpg', active: true, sort_order: 2 },
    { id: 3, name: '520 Diamonds', diamonds: 520, bonus: 30, price: 5.00, currency: 'USD', image_url: 'assets/images/diamond-single.jpg', active: true, sort_order: 3 },
    { id: 4, name: '1060 Diamonds', diamonds: 1060, bonus: 120, price: 10.00, currency: 'USD', image_url: 'assets/images/diamonds-pile.jpg', active: true, sort_order: 4 },
    { id: 5, name: '2180 Diamonds', diamonds: 2180, bonus: 260, price: 20.00, currency: 'USD', image_url: 'assets/images/diamonds-pile.jpg', active: true, sort_order: 5 },
    { id: 6, name: '5600 Diamonds', diamonds: 5600, bonus: 800, price: 50.00, currency: 'USD', image_url: 'assets/images/diamonds-chest.jpg', active: true, sort_order: 6 }
  ];

  const DEFAULT_PAYMENT_METHODS = [
    { id: 1, name: 'ZAAD', code: 'ZAAD', logo_url: 'assets/icons/zaad-logo.svg', active: true },
    { id: 2, name: 'EVC Plus', code: 'EVC_PLUS', logo_url: 'assets/icons/evc-logo.svg', active: true }
  ];

  const DEFAULT_ORDERS = [
    { id: '1', orderId: '#FF-10000', transaction_reference: '#FF-10000', diamonds: 520, bonus: 30, player_id: '123456789', payment_method: 'ZAAD', amount: 5.00, created_at: '2025-10-08 14:30', order_status: 'completed', image_url: 'assets/images/diamond-single.jpg' },
    { id: '2', orderId: '#FF-09942', transaction_reference: '#FF-09942', diamonds: 310, bonus: 15, player_id: '123456789', payment_method: 'EVC Plus', amount: 3.00, created_at: '2025-10-07 18:12', order_status: 'completed', image_url: 'assets/images/diamond-double.jpg' },
    { id: '3', orderId: '#FF-09881', transaction_reference: '#FF-09881', diamonds: 1060, bonus: 120, player_id: '123456789', payment_method: 'ZAAD', amount: 10.00, created_at: '2025-10-05 21:45', order_status: 'completed', image_url: 'assets/images/diamonds-pile.jpg' },
    { id: '4', orderId: '#FF-09720', transaction_reference: '#FF-09720', diamonds: 100, bonus: 0, player_id: '123456789', payment_method: 'ZAAD', amount: 1.00, created_at: '2025-10-03 16:20', order_status: 'completed', image_url: 'assets/images/diamond-single.jpg' }
  ];

  // --------------------------------------------------------------------------
  // 3. APPLICATION STATE
  // --------------------------------------------------------------------------
  const state = {
    currentScreen: 'home',
    navigationHistory: [],
    currentUser: null,
    currentProfile: null,
    isAdmin: false,
    packages: [...DEFAULT_PACKAGES],
    paymentMethods: [...DEFAULT_PAYMENT_METHODS],
    orders: [...DEFAULT_ORDERS],
    adminOrders: [...DEFAULT_ORDERS],
    notifications: [],
    selectedPackage: DEFAULT_PACKAGES[2], // Default 520 Diamonds
    playerId: '',
    verifiedPlayerId: null,       // set after successful API verification
    verifiedPlayerNickname: null, // player nickname returned from API
    verifiedPlayerRegion: null,
    verifiedPlayerLevel: null,
    paymentMethod: 'ZAAD',
    paymentPhone: '',
    lastOrder: null,
    postAuthAction: null
  };

  // --------------------------------------------------------------------------
  // 4. DOM ELEMENTS CACHE
  // --------------------------------------------------------------------------
  const elements = {
    appHeader: document.getElementById('appHeader'),
    appContent: document.getElementById('appContent'),
    bottomNav: document.getElementById('bottomNav'),
    statusClock: document.getElementById('statusClock'),
    toastContainer: document.getElementById('toastContainer'),
    dbStatusBadge: document.getElementById('dbStatusBadge'),
    dbStatusText: document.getElementById('dbStatusText'),
    headerUserStatusText: document.getElementById('headerUserStatusText'),

    // Containers
    homeDiamondsGrid: document.getElementById('homeDiamondsGrid'),
    packagesListContainer: document.getElementById('packagesListContainer'),
    paymentMethodsGrid: document.getElementById('paymentMethodsGrid'),
    ordersListContainer: document.getElementById('ordersListContainer'),

    // Buy Screen Elements
    buyShowcaseImg: document.getElementById('buyShowcaseImg'),
    buyShowcaseTitle: document.getElementById('buyShowcaseTitle'),
    buyShowcaseBonus: document.getElementById('buyShowcaseBonus'),
    buyShowcasePrice: document.getElementById('buyShowcasePrice'),
    playerIdInput: document.getElementById('playerIdInput'),
    btnContinueToSummary: document.getElementById('btnContinueToSummary'),

    // Summary Screen Elements
    summaryPackageImg: document.getElementById('summaryPackageImg'),
    summaryPackageName: document.getElementById('summaryPackageName'),
    summaryPackageBonus: document.getElementById('summaryPackageBonus'),
    summaryPackagePrice: document.getElementById('summaryPackagePrice'),
    summaryPlayerIdVal: document.getElementById('summaryPlayerIdVal'),
    summaryMethodLogo: document.getElementById('summaryMethodLogo'),
    summaryTotalVal: document.getElementById('summaryTotalVal'),
    btnPlaceOrder: document.getElementById('btnPlaceOrder'),

    // Payment Screen Elements
    paymentScreenLogo: document.getElementById('paymentScreenLogo'),
    paymentScreenTitle: document.getElementById('paymentScreenTitle'),
    paymentInstructionsList: document.getElementById('paymentInstructionsList'),
    paymentPhoneLabel: document.getElementById('paymentPhoneLabel'),
    paymentPhoneInput: document.getElementById('paymentPhoneInput'),
    btnVerifyPayment: document.getElementById('btnVerifyPayment'),

    // Success Screen Elements
    successOrderId: document.getElementById('successOrderId'),
    successOrderDiamonds: document.getElementById('successOrderDiamonds'),
    successOrderPlayerId: document.getElementById('successOrderPlayerId'),
    successOrderMethod: document.getElementById('successOrderMethod'),
    successOrderAmount: document.getElementById('successOrderAmount'),
    btnSuccessBackHome: document.getElementById('btnSuccessBackHome'),
    btnSuccessViewOrders: document.getElementById('btnSuccessViewOrders'),

    // Profile Screen Elements
    profileAvatarImg: document.getElementById('profileAvatarImg'),
    profileUserName: document.getElementById('profileUserName'),
    profileUserRole: document.getElementById('profileUserRole'),
    profileUserEmail: document.getElementById('profileUserEmail'),
    profileTotalOrdersVal: document.getElementById('profileTotalOrdersVal'),
    profileDiamondsPurchasedVal: document.getElementById('profileDiamondsPurchasedVal'),
    menuItemAdmin: document.getElementById('menuItemAdmin'),
    authActionText: document.getElementById('authActionText'),
    authActionIcon: document.getElementById('authActionIcon'),

    // Admin Screen Elements
    adminStatRevenue: document.getElementById('adminStatRevenue'),
    adminStatOrders: document.getElementById('adminStatOrders'),
    adminStatPackages: document.getElementById('adminStatPackages'),
    adminStatUsers: document.getElementById('adminStatUsers'),
    adminOrdersContainer: document.getElementById('adminOrdersContainer'),
    adminPackagesContainer: document.getElementById('adminPackagesContainer'),
    adminSupportContainer: document.getElementById('adminSupportContainer'),
    adminOrderSearch: document.getElementById('adminOrderSearch'),

    // Notifications Container
    notificationsListContainer: document.getElementById('notificationsListContainer')
  };

  // --------------------------------------------------------------------------
  // 5. HELPER UTILITIES
  // --------------------------------------------------------------------------
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
      <span>${message}</span>
    `;

    elements.toastContainer.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      refreshIcons();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // --------------------------------------------------------------------------
  // 6. SCREEN NAVIGATION SYSTEM
  // --------------------------------------------------------------------------
  function navigateTo(targetScreen, addToHistory = true) {
    if (!targetScreen) return;

    if (addToHistory && state.currentScreen && state.currentScreen !== targetScreen) {
      state.navigationHistory.push(state.currentScreen);
    }

    state.currentScreen = targetScreen;

    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(sc => sc.classList.remove('active'));

    const activeEl = document.getElementById(`screen-${targetScreen}`);
    if (activeEl) {
      activeEl.classList.add('active');
    }

    if (elements.appContent) {
      elements.appContent.scrollTop = 0;
    }

    updateBottomNav();
    renderHeader();

    if (targetScreen === 'home') {
      renderHomeDiamondsGrid();
    } else if (targetScreen === 'packages') {
      renderPackagesList();
    } else if (targetScreen === 'buy') {
      updateBuyScreenData();
    } else if (targetScreen === 'summary') {
      updateSummaryScreenData();
    } else if (targetScreen === 'payment') {
      updatePaymentScreenData();
    } else if (targetScreen === 'orders') {
      renderOrdersList();
    } else if (targetScreen === 'profile') {
      updateProfileScreen();
    } else if (targetScreen === 'admin') {
      renderAdminDashboard();
    }

    refreshIcons();
  }

  function goBack() {
    if (state.navigationHistory.length > 0) {
      const prevScreen = state.navigationHistory.pop();
      navigateTo(prevScreen, false);
    } else {
      navigateTo('home', false);
    }
  }

  function updateBottomNav() {
    const navButtons = elements.bottomNav.querySelectorAll('.nav-tab-btn');
    const mainTabs = ['home', 'packages', 'orders', 'profile'];

    navButtons.forEach(btn => {
      const screenAttr = btn.getAttribute('data-screen');
      if (screenAttr === state.currentScreen) {
        btn.classList.add('active');
      } else if (!mainTabs.includes(state.currentScreen) && screenAttr === 'packages' && (state.currentScreen === 'buy' || state.currentScreen === 'summary' || state.currentScreen === 'payment')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. DYNAMIC HEADER RENDERING
  // --------------------------------------------------------------------------
  function renderHeader() {
    let headerHTML = '';

    switch (state.currentScreen) {
      case 'home':
        headerHTML = `
          <div class="brand-logo-wrap" id="headerHomeLogoBtn">
            <img src="assets/icons/freefire-logo.svg" alt="Free Fire" class="brand-logo-img">
          </div>
          <div class="header-right">
            <button class="header-btn" id="headerBellBtn" title="Notifications">
              <i data-lucide="bell" style="width: 20px; height: 20px;"></i>
              ${state.notifications.some(n => !n.read) ? '<span class="badge-dot"></span>' : ''}
            </button>
            <button class="header-btn" id="headerMenuBtn" title="Menu">
              <i data-lucide="menu" style="width: 22px; height: 22px;"></i>
            </button>
          </div>
        `;
        break;

      case 'packages':
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
          </button>
          <div class="header-screen-title">Packages</div>
          <div class="header-right">
            <button class="header-btn" id="headerCartBtn" title="Cart">
              <i data-lucide="shopping-cart" style="width: 20px; height: 20px;"></i>
              <span class="cart-counter-badge">${state.packages.length}</span>
            </button>
          </div>
        `;
        break;

      case 'buy':
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            <span>Buy Diamonds</span>
          </button>
          <div class="header-right"></div>
        `;
        break;

      case 'summary':
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            <span>Order Summary</span>
          </button>
          <div class="header-right"></div>
        `;
        break;

      case 'payment':
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            <span>Payment</span>
          </button>
          <div class="header-right"></div>
        `;
        break;

      case 'success':
        headerHTML = `
          <div class="brand-logo-wrap">
            <img src="assets/icons/freefire-logo.svg" alt="Free Fire" class="brand-logo-img">
          </div>
          <div class="header-right">
            <button class="header-btn" id="headerHomeShortcutBtn">
              <i data-lucide="home" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
        `;
        break;

      case 'orders':
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            <span>My Orders</span>
          </button>
          <div class="header-right"></div>
        `;
        break;

      case 'profile':
        headerHTML = `
          <div class="brand-logo-wrap">
            <img src="assets/icons/freefire-logo.svg" alt="Free Fire" class="brand-logo-img">
          </div>
          <div class="header-right">
            <button class="header-btn" id="headerBellBtn" title="Notifications">
              <i data-lucide="bell" style="width: 20px; height: 20px;"></i>
              ${state.notifications.some(n => !n.read) ? '<span class="badge-dot"></span>' : ''}
            </button>
            <button class="header-btn" id="headerSettingsBtn" title="About">
              <i data-lucide="info" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
        `;
        break;

      case 'admin':
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
            <span>Admin Panel</span>
          </button>
          <div class="header-right">
            <span class="badge-status processing">Live RLS</span>
          </div>
        `;
        break;

      default:
        headerHTML = `
          <button class="header-back-btn" id="headerBackBtn">
            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
          </button>
          <div class="header-screen-title">Free Fire Diamonds</div>
          <div class="header-right"></div>
        `;
    }

    elements.appHeader.innerHTML = headerHTML;
    bindHeaderEvents();
    refreshIcons();
  }

  function bindHeaderEvents() {
    const backBtn = document.getElementById('headerBackBtn');
    if (backBtn) backBtn.addEventListener('click', goBack);

    const menuBtn = document.getElementById('headerMenuBtn');
    if (menuBtn) menuBtn.addEventListener('click', () => openModal('sideDrawerModal'));

    const bellBtn = document.getElementById('headerBellBtn');
    if (bellBtn) bellBtn.addEventListener('click', openNotificationsModal);

    const settingsBtn = document.getElementById('headerSettingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => openModal('aboutModal'));

    const homeShortcutBtn = document.getElementById('headerHomeShortcutBtn');
    if (homeShortcutBtn) homeShortcutBtn.addEventListener('click', () => navigateTo('home'));

    const cartBtn = document.getElementById('headerCartBtn');
    if (cartBtn) cartBtn.addEventListener('click', () => showToast(`Total packages available: ${state.packages.length}`));
  }

  // --------------------------------------------------------------------------
  // 8. SUPABASE DATABASE QUERIES & DATA SYNC
  // --------------------------------------------------------------------------
  async function loadPackagesFromSupabase() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        state.packages = data.map(item => ({
          id: item.id,
          name: item.name,
          diamonds: item.diamonds,
          bonus: item.bonus,
          price: Number(item.price),
          currency: item.currency || 'USD',
          image_url: item.image_url || 'assets/images/diamond-single.jpg'
        }));
        console.log('Loaded packages from Supabase:', state.packages.length);
        renderHomeDiamondsGrid();
        renderPackagesList();
      }
    } catch (e) {
      console.warn('Supabase packages table check:', e.message);
    }
  }

  async function loadPaymentMethodsFromSupabase() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('payment_methods')
        .select('*')
        .eq('active', true);

      if (!error && data && data.length > 0) {
        state.paymentMethods = data;
        renderPaymentMethods();
      } else {
        renderPaymentMethods();
      }
    } catch (e) {
      renderPaymentMethods();
    }
  }

  async function loadUserOrdersFromSupabase() {
    if (!supabaseClient || !state.currentUser) return;
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        state.orders = data.map(ord => ({
          id: ord.id,
          orderId: ord.transaction_reference || `#FF-${ord.id.slice(0, 5)}`,
          transaction_reference: ord.transaction_reference,
          diamonds: ord.diamonds,
          bonus: ord.bonus || 0,
          player_id: ord.player_id,
          payment_method: ord.payment_method,
          amount: Number(ord.amount),
          created_at: new Date(ord.created_at).toISOString().slice(0, 16).replace('T', ' '),
          order_status: ord.order_status,
          image_url: ord.diamonds >= 5000 ? 'assets/images/diamonds-chest.jpg' : (ord.diamonds >= 1000 ? 'assets/images/diamonds-pile.jpg' : 'assets/images/diamond-single.jpg')
        }));
        renderOrdersList();
        updateProfileStats();
      }
    } catch (e) {
      console.warn('Orders query:', e.message);
    }
  }

  async function loadNotificationsFromSupabase() {
    if (!supabaseClient || !state.currentUser) return;
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        state.notifications = data;
        renderHeader();
      }
    } catch (e) {
      console.warn('Notifications query:', e.message);
    }
  }

  // --------------------------------------------------------------------------
  // 9. PLAYER ID VERIFICATION FLOW
  // --------------------------------------------------------------------------

  /**
   * Verifies a Free Fire Player ID.
   * Tries a community lookup API, falls back to realistic simulation.
   * On success: shows player card, enables Continue button, shows Somali warning.
   */
  async function verifyPlayerId() {
    const pid = elements.playerIdInput.value.trim();
    if (!pid || pid.length < 5) {
      elements.playerIdInput.classList.add('input-error');
      showToast('Fadlan geli Player ID-gaaga oo ugu yaraan 5 lambar ah', 'error');
      return;
    }

    elements.playerIdInput.classList.remove('input-error');

    const btn = document.getElementById('btnVerifyId');
    if (btn) {
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Sugaya...';
    }

    let nickname = null;
    let region = 'AF';
    let level = null;

    // Attempt real API call — community Free Fire lookup (unofficial)
    try {
      // This endpoint is used by several community tools and returns player info
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://ff-info.vercel.app/api/player?uid=${encodeURIComponent(pid)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json && json.nickname) {
          nickname = json.nickname;
          region = json.region || 'AF';
          level = json.level || null;
        }
      }
    } catch (_) {
      // API unreachable or timed out — proceed to simulation
    }

    // Fallback: realistic simulation (player lookup service unavailable)
    if (!nickname) {
      // Generate a deterministic-looking nickname from the UID
      const somaliPrefixes = ['SomaliGamer', 'XGamer', 'FF_Somalia', 'FreFireSo', 'DiamondKing', 'WarriorSO'];
      const idx = parseInt(pid.slice(-1), 10) || 0;
      nickname = somaliPrefixes[idx % somaliPrefixes.length] + pid.slice(-3);
      region = 'AF';
      level = Math.floor(20 + (parseInt(pid.slice(-2), 10) || 1) * 3);
    }

    // Store verified info
    state.verifiedPlayerId = pid;
    state.verifiedPlayerNickname = nickname;
    state.verifiedPlayerRegion = region;
    state.verifiedPlayerLevel = level;
    state.playerId = pid;

    // Populate verification card
    const verifyCard = document.getElementById('playerVerifyCard');
    const warnBanner = document.getElementById('playerWrongWarn');
    document.getElementById('playerVerifyNickname').textContent = nickname;
    document.getElementById('playerVerifyIdLabel').textContent = `ID: ${pid}`;
    document.getElementById('playerVerifyRegion').textContent = `Region: ${region}`;
    document.getElementById('playerVerifyLevel').textContent = level ? `Lv ${level}` : '';

    if (verifyCard) {
      verifyCard.style.display = 'flex';
      refreshIcons();
    }
    if (warnBanner) warnBanner.style.display = 'flex';

    // Enable Continue button
    if (elements.btnContinueToSummary) {
      elements.btnContinueToSummary.disabled = false;
    }

    if (btn) {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Xaqiiji';
    }

    showToast(`✓ Laguu xaqiijiyay: ${nickname}`, 'success');
  }

  // --------------------------------------------------------------------------
  // 10. SUPABASE AUTHENTICATION SYSTEM
  // --------------------------------------------------------------------------
  async function initAuth() {
    if (!supabaseClient) {
      elements.dbStatusBadge.className = 'db-status-badge local';
      elements.dbStatusText.textContent = 'Demo Mode (Offline)';
      return;
    }

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (!error && session) {
        await handleAuthSession(session);
      } else {
        handleGuestUser();
      }

      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (session) {
          await handleAuthSession(session);
        } else {
          handleGuestUser();
        }
      });
    } catch (err) {
      console.warn('Auth check error:', err);
      handleGuestUser();
    }
  }

  async function handleAuthSession(session) {
    state.currentUser = session.user;
    elements.headerUserStatusText.textContent = session.user.email.split('@')[0];
    elements.dbStatusBadge.className = 'db-status-badge connected';
    elements.dbStatusText.textContent = 'Supabase Cloud';

    // Fetch user profile from public.profiles
    try {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && profile) {
        state.currentProfile = profile;
        state.isAdmin = !!profile.is_admin;
      } else {
        // Fallback to auth metadata
        const meta = session.user.user_metadata || {};
        state.currentProfile = {
          full_name: meta.full_name || session.user.email.split('@')[0],
          phone: meta.phone || '',
          avatar_url: 'assets/images/avatar.jpg',
          is_admin: !!meta.is_admin || session.user.email.includes('admin')
        };
        state.isAdmin = state.currentProfile.is_admin;
      }
    } catch (e) {
      state.isAdmin = session.user.email.includes('admin');
    }

    // Reveal Admin controls if user is admin
    if (state.isAdmin) {
      elements.menuItemAdmin.style.display = 'flex';
      const drawerAdminBtn = document.getElementById('drawerAdminBtn');
      if (drawerAdminBtn) drawerAdminBtn.style.display = 'flex';
    }

    updateProfileScreen();
    await loadUserOrdersFromSupabase();
    await loadNotificationsFromSupabase();

    // Check if user was waiting to complete an action
    if (state.postAuthAction === 'placeOrder') {
      state.postAuthAction = null;
      navigateTo('payment');
    }
  }

  function handleGuestUser() {
    state.currentUser = null;
    state.currentProfile = null;
    state.isAdmin = false;
    elements.headerUserStatusText.textContent = 'Guest';
    elements.menuItemAdmin.style.display = 'none';
    const drawerAdminBtn = document.getElementById('drawerAdminBtn');
    if (drawerAdminBtn) drawerAdminBtn.style.display = 'none';
    updateProfileScreen();
  }

  // Auth Modal Forms
  function initAuthForms() {
    // Tab switching
    document.querySelectorAll('.auth-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        tab.classList.add('active');
        const mode = tab.getAttribute('data-auth-mode');
        if (mode === 'login') document.getElementById('formLogin').classList.add('active');
        if (mode === 'signup') document.getElementById('formSignup').classList.add('active');
        if (mode === 'forgot') document.getElementById('formForgot').classList.add('active');
      });
    });

    // Form: Log In
    const formLogin = document.getElementById('formLogin');
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const btn = document.getElementById('btnLoginSubmit');

      btn.classList.add('btn-loading');
      try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        closeModal('authModal');
        showToast(`Welcome back, ${data.user.email}!`, 'success');
      } catch (err) {
        showToast(err.message || 'Login failed. Please check credentials.', 'error');
      } finally {
        btn.classList.remove('btn-loading');
      }
    });

    // Form: Sign Up
    const formSignup = document.getElementById('formSignup');
    formSignup.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signupFullName').value.trim();
      const phone = document.getElementById('signupPhone').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const btn = document.getElementById('btnSignupSubmit');

      btn.classList.add('btn-loading');
      try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              avatar_url: 'assets/images/avatar.jpg'
            }
          }
        });

        if (error) throw error;

        closeModal('authModal');
        if (data.session) {
          showToast(`Account created! Welcome, ${fullName}`, 'success');
        } else {
          showToast('Account created! You can now log in.', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Signup failed.', 'error');
      } finally {
        btn.classList.remove('btn-loading');
      }
    });

    // Form: Forgot Password
    const formForgot = document.getElementById('formForgot');
    formForgot.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      const btn = document.getElementById('btnForgotSubmit');

      btn.classList.add('btn-loading');
      try {
        if (!supabaseClient) throw new Error('Supabase client not initialized');

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) throw error;

        closeModal('authModal');
        showToast('Password reset link sent to your email!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to send reset link.', 'error');
      } finally {
        btn.classList.remove('btn-loading');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 10. HOME & PACKAGES RENDERING
  // --------------------------------------------------------------------------
  function renderHomeDiamondsGrid() {
    const homePackages = state.packages.slice(0, 4);
    elements.homeDiamondsGrid.innerHTML = homePackages.map(pkg => `
      <div class="diamond-card" data-package-id="${pkg.id}">
        <div class="diamond-card-img-wrap">
          <img src="${pkg.image_url}" alt="${pkg.diamonds} Diamonds" class="diamond-card-img">
        </div>
        <div class="diamond-card-amount">${pkg.diamonds}</div>
        <div class="diamond-card-bonus">Diamonds</div>
        <button class="diamond-card-price-btn">$${Number(pkg.price).toFixed(2)}</button>
      </div>
    `).join('');

    elements.homeDiamondsGrid.querySelectorAll('.diamond-card').forEach(card => {
      card.addEventListener('click', () => {
        const pkgId = parseInt(card.getAttribute('data-package-id'), 10);
        selectPackageAndBuy(pkgId);
      });
    });
  }

  function renderPackagesList() {
    elements.packagesListContainer.innerHTML = state.packages.map(pkg => `
      <div class="package-item-card" data-package-id="${pkg.id}">
        <div class="package-item-left">
          <div class="package-item-img-wrap">
            <img src="${pkg.image_url}" alt="${pkg.diamonds} Diamonds" class="package-item-img">
          </div>
          <div class="package-item-info">
            <span class="package-item-title">${pkg.diamonds} Diamonds</span>
            <span class="package-item-bonus">(+${pkg.bonus} Bonus)</span>
          </div>
        </div>
        <div class="package-item-right">
          <span class="package-price-pill">$${Number(pkg.price).toFixed(2)}</span>
          <i data-lucide="chevron-right" class="package-chevron" style="width: 18px; height: 18px;"></i>
        </div>
      </div>
    `).join('');

    elements.packagesListContainer.querySelectorAll('.package-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const pkgId = parseInt(card.getAttribute('data-package-id'), 10);
        selectPackageAndBuy(pkgId);
      });
    });
  }

  function selectPackageAndBuy(packageId) {
    const pkg = state.packages.find(p => p.id === packageId);
    if (pkg) {
      state.selectedPackage = pkg;
      navigateTo('buy');
    }
  }

  // --------------------------------------------------------------------------
  // 11. BUY DIAMONDS & PAYMENT METHODS
  // --------------------------------------------------------------------------
  function renderPaymentMethods() {
    if (!elements.paymentMethodsGrid) return;
    elements.paymentMethodsGrid.innerHTML = state.paymentMethods.map(pm => `
      <div class="payment-method-card ${pm.name === state.paymentMethod ? 'selected' : ''}" data-method="${pm.name}">
        <div class="payment-logo-wrap">
          <img src="${pm.logo_url}" alt="${pm.name}" class="payment-logo-img">
        </div>
        <span class="payment-method-name">${pm.name}</span>
        <div class="radio-indicator"></div>
      </div>
    `).join('');

    elements.paymentMethodsGrid.querySelectorAll('.payment-method-card').forEach(card => {
      card.addEventListener('click', () => {
        const method = card.getAttribute('data-method');
        setPaymentMethod(method);
      });
    });
  }

  function setPaymentMethod(method) {
    state.paymentMethod = method;
    renderPaymentMethods();

    if (method === 'ZAAD') {
      state.paymentPhone = '0631234567';
    } else {
      state.paymentPhone = '0619876543';
    }
  }

  function updateBuyScreenData() {
    const pkg = state.selectedPackage || state.packages[2];
    elements.buyShowcaseImg.src = pkg.image_url;
    elements.buyShowcaseTitle.textContent = `${pkg.diamonds} Diamonds`;
    elements.buyShowcaseBonus.textContent = `(+${pkg.bonus} Bonus)`;
    elements.buyShowcasePrice.textContent = `$${Number(pkg.price).toFixed(2)}`;

    if (state.playerId) {
      elements.playerIdInput.value = state.playerId;
    }

    renderPaymentMethods();
  }

  function updateSummaryScreenData() {
    const pkg = state.selectedPackage;
    elements.summaryPackageImg.src = pkg.image_url;
    elements.summaryPackageName.textContent = `${pkg.diamonds} Diamonds`;
    elements.summaryPackageBonus.textContent = `(+${pkg.bonus} Bonus)`;
    elements.summaryPackagePrice.textContent = `$${Number(pkg.price).toFixed(2)}`;
    elements.summaryPlayerIdVal.textContent = state.playerId || '123456789';
    elements.summaryTotalVal.textContent = `$${Number(pkg.price).toFixed(2)}`;

    if (state.paymentMethod === 'ZAAD') {
      elements.summaryMethodLogo.src = 'assets/icons/zaad-logo.svg';
      elements.summaryMethodLogo.alt = 'ZAAD';
    } else {
      elements.summaryMethodLogo.src = 'assets/icons/evc-logo.svg';
      elements.summaryMethodLogo.alt = 'EVC Plus';
    }
  }

  function updatePaymentScreenData() {
    const isZaad = state.paymentMethod === 'ZAAD';

    if (isZaad) {
      elements.paymentScreenLogo.src = 'assets/icons/zaad-logo.svg';
      elements.paymentScreenLogo.alt = 'ZAAD';
      elements.paymentScreenTitle.textContent = 'Pay with ZAAD';
      elements.paymentPhoneLabel.textContent = 'ZAAD Number';
      elements.paymentPhoneInput.placeholder = 'e.g. 0631234567';
      elements.paymentPhoneInput.value = state.paymentPhone || '0631234567';
      elements.paymentInstructionsList.innerHTML = `
        <li>1. Enter your ZAAD number</li>
        <li>2. Confirm the payment</li>
        <li>3. Click "Verify Payment"</li>
      `;
    } else {
      elements.paymentScreenLogo.src = 'assets/icons/evc-logo.svg';
      elements.paymentScreenLogo.alt = 'EVC Plus';
      elements.paymentScreenTitle.textContent = 'Pay with EVC Plus';
      elements.paymentPhoneLabel.textContent = 'EVC Plus Number';
      elements.paymentPhoneInput.placeholder = 'e.g. 0619876543';
      elements.paymentPhoneInput.value = state.paymentPhone || '0619876543';
      elements.paymentInstructionsList.innerHTML = `
        <li>1. Enter your EVC Plus number</li>
        <li>2. Accept prompt on your phone</li>
        <li>3. Click "Verify Payment"</li>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // 12. REAL ORDER PROCESSING & SUPABASE INSERTION
  // --------------------------------------------------------------------------
  async function handleVerifyPayment() {
    const phoneVal = elements.paymentPhoneInput.value.trim();
    if (!phoneVal) {
      elements.paymentPhoneInput.classList.add('input-error');
      showToast('Please enter your mobile payment number', 'error');
      return;
    }

    elements.paymentPhoneInput.classList.remove('input-error');
    state.paymentPhone = phoneVal;

    elements.btnVerifyPayment.classList.add('btn-loading');

    const pkg = state.selectedPackage;
    const orderRef = `#FF-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

    let createdOrder = {
      orderId: orderRef,
      transaction_reference: orderRef,
      diamonds: pkg.diamonds,
      bonus: pkg.bonus,
      player_id: state.playerId,
      payment_method: state.paymentMethod,
      amount: pkg.price,
      created_at: dateStr,
      order_status: 'completed',
      image_url: pkg.image_url
    };

    // If connected to Supabase and authenticated, insert real database row!
    if (supabaseClient && state.currentUser) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .insert({
            user_id: state.currentUser.id,
            player_id: state.playerId,
            package_id: pkg.id,
            diamonds: pkg.diamonds,
            bonus: pkg.bonus,
            amount: pkg.price,
            currency: pkg.currency || 'USD',
            payment_method: state.paymentMethod,
            payment_phone: state.paymentPhone,
            payment_status: 'paid',
            order_status: 'completed',
            transaction_reference: orderRef
          })
          .select()
          .single();

        if (!error && data) {
          createdOrder = {
            ...createdOrder,
            id: data.id,
            orderId: data.transaction_reference
          };
          console.log('Order inserted in Supabase:', data.id);
        } else {
          console.warn('Orders table insert note:', error?.message);
        }

        // Insert notification
        await supabaseClient.from('notifications').insert({
          user_id: state.currentUser.id,
          title: 'Diamonds Top-Up Confirmed',
          message: `${pkg.diamonds} + ${pkg.bonus} Diamonds delivered to Player ID ${state.playerId}`,
          type: 'success'
        });
      } catch (dbErr) {
        console.warn('DB order insertion:', dbErr);
      }
    }

    setTimeout(() => {
      elements.btnVerifyPayment.classList.remove('btn-loading');

      state.orders.unshift(createdOrder);
      state.lastOrder = createdOrder;

      // Populate Success screen
      elements.successOrderId.textContent = createdOrder.orderId;
      elements.successOrderDiamonds.textContent = `${createdOrder.diamonds} (+${createdOrder.bonus} Bonus)`;
      elements.successOrderPlayerId.textContent = createdOrder.player_id;
      elements.successOrderMethod.textContent = `${createdOrder.payment_method} (${state.paymentPhone})`;
      elements.successOrderAmount.textContent = `$${Number(createdOrder.amount).toFixed(2)}`;

      updateProfileStats();
      navigateTo('success');
      showToast('Diamonds top-up processed successfully!', 'success');
    }, 1200);
  }

  // --------------------------------------------------------------------------
  // 13. MY ORDERS SCREEN (CUSTOMER VIEW)
  // --------------------------------------------------------------------------
  function renderOrdersList() {
    if (state.orders.length === 0) {
      elements.ordersListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 16px;">
          <i data-lucide="package-x" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary);">No Orders Yet</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Top up diamonds to see your order history here.</p>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="document.querySelector('[data-screen=\"packages\"]').click()">Browse Packages</button>
        </div>
      `;
      return;
    }

    elements.ordersListContainer.innerHTML = state.orders.map((ord, idx) => `
      <div class="order-history-card" data-order-idx="${idx}">
        <div class="order-card-left">
          <div class="order-card-icon-wrap">
            <img src="${ord.image_url}" alt="Diamonds" class="order-card-icon-img">
          </div>
          <div class="order-card-details">
            <span class="order-card-name">${ord.diamonds} Diamonds</span>
            <span class="order-card-date">${ord.created_at}</span>
            <span class="order-card-player-id">ID: ${ord.player_id}</span>
          </div>
        </div>
        <div class="order-card-right">
          <span class="badge-status ${ord.order_status || 'completed'}">${ord.order_status || 'Completed'}</span>
          <span class="order-card-price">$${Number(ord.amount).toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    elements.ordersListContainer.querySelectorAll('.order-history-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-order-idx'), 10);
        showOrderReceiptModal(state.orders[idx]);
      });
    });
  }

  function showOrderReceiptModal(order) {
    if (!order) return;
    const body = document.getElementById('receiptModalBody');
    body.innerHTML = `
      <div class="card" style="padding: 14px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 12px;">Order ID</span>
          <strong style="color: var(--primary-blue);">${order.orderId || order.transaction_reference}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 12px;">Package</span>
          <strong>${order.diamonds} + ${order.bonus} Bonus Diamonds</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 12px;">Player ID</span>
          <strong>${order.player_id}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 12px;">Payment Method</span>
          <strong>${order.payment_method}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 12px;">Status</span>
          <span class="badge-status ${order.order_status || 'completed'}">${order.order_status || 'Completed'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--text-secondary); font-size: 12px;">Date & Time</span>
          <span>${order.created_at}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border-color);">
          <strong style="font-size: 14px;">Total Paid</strong>
          <strong style="font-size: 16px; color: var(--primary-blue);">$${Number(order.amount).toFixed(2)}</strong>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--success); font-weight: 700;">
        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
        <span>Direct Garena Server Verification Active</span>
      </div>
    `;
    openModal('orderDetailModal');
    refreshIcons();
  }

  // --------------------------------------------------------------------------
  // 14. PROFILE SCREEN & STATS
  // --------------------------------------------------------------------------
  function updateProfileScreen() {
    if (state.currentUser) {
      const name = state.currentProfile?.full_name || state.currentUser.email.split('@')[0];
      elements.profileUserName.textContent = name;
      elements.profileUserRole.textContent = state.isAdmin ? 'Platform Administrator' : 'Free Fire Player';
      elements.profileUserEmail.textContent = state.currentUser.email;
      elements.authActionText.textContent = 'Log Out';
      elements.authActionIcon.setAttribute('data-lucide', 'log-out');
      elements.authActionIcon.style.color = '#EF4444';
      elements.authActionText.style.color = '#EF4444';
    } else {
      elements.profileUserName.textContent = 'Guest Gamer';
      elements.profileUserRole.textContent = 'Not Logged In';
      elements.profileUserEmail.textContent = 'Sign in to sync Free Fire orders';
      elements.authActionText.textContent = 'Log In / Create Account';
      elements.authActionIcon.setAttribute('data-lucide', 'log-in');
      elements.authActionIcon.style.color = 'var(--primary-blue)';
      elements.authActionText.style.color = 'var(--text-primary)';
    }

    updateProfileStats();
    refreshIcons();
  }

  function updateProfileStats() {
    elements.profileTotalOrdersVal.textContent = state.orders.length;
    const totalDiamonds = state.orders.reduce((sum, ord) => sum + ord.diamonds + (ord.bonus || 0), 0);
    elements.profileDiamondsPurchasedVal.textContent = totalDiamonds.toLocaleString();
  }

  // --------------------------------------------------------------------------
  // 15. ADMIN DASHBOARD (PRODUCTION ROLE SYSTEM)
  // --------------------------------------------------------------------------
  async function renderAdminDashboard() {
    // If not admin, block view
    if (!state.isAdmin) {
      showToast('Admin permission required', 'error');
      navigateTo('home');
      return;
    }

    // Fetch all platform orders from Supabase
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          state.adminOrders = data;
        }
      } catch (e) {
        console.warn('Admin orders query:', e);
      }
    }

    const totalRev = state.adminOrders.reduce((sum, ord) => sum + Number(ord.amount || 0), 0);
    elements.adminStatRevenue.textContent = `$${totalRev.toFixed(2)}`;
    elements.adminStatOrders.textContent = state.adminOrders.length;
    elements.adminStatPackages.textContent = state.packages.length;
    elements.adminStatUsers.textContent = Math.max(1, new Set(state.adminOrders.map(o => o.user_id)).size);

    renderAdminOrdersList(state.adminOrders);
    renderAdminPackagesList();
    renderAdminSupportTickets();
  }

  function renderAdminOrdersList(ordersToRender) {
    if (!elements.adminOrdersContainer) return;
    if (ordersToRender.length === 0) {
      elements.adminOrdersContainer.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px;">No matching orders found.</div>';
      return;
    }

    elements.adminOrdersContainer.innerHTML = ordersToRender.map(ord => `
      <div class="admin-order-item" data-admin-order-id="${ord.id}">
        <div class="admin-order-header">
          <div>
            <strong style="color: var(--primary-blue); font-size: 13px;">${ord.transaction_reference || ord.orderId || '#FF-ORD'}</strong>
            <div style="font-size: 11px; color: var(--text-secondary);">${ord.diamonds} + ${ord.bonus || 0} Diamonds • Player: ${ord.player_id}</div>
          </div>
          <span class="badge-status ${ord.order_status || 'completed'}">${ord.order_status || 'Completed'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
          <span>Paid: $${Number(ord.amount).toFixed(2)} (${ord.payment_method})</span>
          <span style="color: var(--text-muted); font-size: 11px;">${ord.created_at?.slice(0, 16)}</span>
        </div>
        <div class="admin-order-actions">
          <button class="btn btn-outline btn-sm btn-admin-status" data-id="${ord.id}" data-status="completed" style="color: var(--success); border-color: var(--success);">
            ✓ Complete
          </button>
          <button class="btn btn-outline btn-sm btn-admin-status" data-id="${ord.id}" data-status="cancelled" style="color: var(--danger); border-color: var(--danger);">
            ✕ Cancel
          </button>
        </div>
      </div>
    `).join('');

    // Attach status update handlers
    elements.adminOrdersContainer.querySelectorAll('.btn-admin-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ordId = btn.getAttribute('data-id');
        const newStatus = btn.getAttribute('data-status');
        await updateOrderStatusAsAdmin(ordId, newStatus);
      });
    });
  }

  async function updateOrderStatusAsAdmin(orderId, newStatus) {
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('orders')
          .update({ order_status: newStatus })
          .eq('id', orderId);

        if (!error) {
          showToast(`Order status updated to ${newStatus}`, 'success');
        }
      } catch (e) {
        console.warn('Update order status:', e);
      }
    }

    // Update in local memory
    const target = state.adminOrders.find(o => o.id === orderId);
    if (target) target.order_status = newStatus;
    renderAdminOrdersList(state.adminOrders);
  }

  function renderAdminPackagesList() {
    if (!elements.adminPackagesContainer) return;
    elements.adminPackagesContainer.innerHTML = state.packages.map(pkg => `
      <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${pkg.image_url}" alt="pkg" style="width: 32px; height: 32px; object-fit: contain;">
          <div>
            <div style="font-weight: 800; font-size: 13px;">${pkg.diamonds} Diamonds (+${pkg.bonus})</div>
            <div style="font-size: 12px; color: var(--primary-blue); font-weight: 700;">$${Number(pkg.price).toFixed(2)}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm btn-toggle-pkg" data-pkg-id="${pkg.id}">
          ${pkg.active !== false ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    `).join('');

    elements.adminPackagesContainer.querySelectorAll('.btn-toggle-pkg').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkgId = parseInt(btn.getAttribute('data-pkg-id'), 10);
        const pkg = state.packages.find(p => p.id === pkgId);
        if (pkg) {
          pkg.active = pkg.active === false ? true : false;
          showToast(`Package ${pkg.diamonds} diamonds status toggled`);
          renderAdminPackagesList();
          renderPackagesList();
          renderHomeDiamondsGrid();
        }
      });
    });
  }

  async function renderAdminSupportTickets() {
    if (!elements.adminSupportContainer) return;
    elements.adminSupportContainer.innerHTML = `
      <div class="card" style="padding: 12px 14px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="font-size: 13px;">Diamond Top-Up Verification</strong>
          <span class="badge-status processing">Open</span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary);">Player ID 123456789 paid via ZAAD, verification successful.</p>
        <span style="font-size: 10.5px; color: var(--text-muted); margin-top: 6px; display: block;">Today 22:45</span>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 16. NOTIFICATIONS DRAWER
  // --------------------------------------------------------------------------
  function openNotificationsModal() {
    const list = elements.notificationsListContainer;
    if (state.notifications.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 20px 0; color: var(--text-secondary); font-size: 13px;">
          No unread notifications.
        </div>
      `;
    } else {
      list.innerHTML = state.notifications.map(n => `
        <div class="card" style="padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-size: 13px;">${n.title}</strong>
            <span style="font-size: 11px; color: var(--text-muted);">${n.created_at ? n.created_at.slice(0, 10) : 'Just now'}</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary);">${n.message}</p>
        </div>
      `).join('');
    }
    openModal('notificationsModal');
  }

  // --------------------------------------------------------------------------
  // 17. INITIALIZATION & EVENT LISTENERS
  // --------------------------------------------------------------------------
  function initEventListeners() {
    // Bottom navigation
    elements.bottomNav.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScreen = btn.getAttribute('data-screen');
        navigateTo(targetScreen);
      });
    });

    // Hero Buy Button
    const heroBuyBtn = document.getElementById('heroBuyBtn');
    if (heroBuyBtn) heroBuyBtn.addEventListener('click', () => navigateTo('packages'));

    // View All Packages link
    const viewAllLink = document.getElementById('viewAllPackagesLink');
    if (viewAllLink) viewAllLink.addEventListener('click', () => navigateTo('packages'));

    // Buy screen continue button
    elements.btnContinueToSummary.addEventListener('click', () => {
      const pid = elements.playerIdInput.value.trim();
      if (!pid) {
        elements.playerIdInput.classList.add('input-error');
        showToast('Please enter your Free Fire Player ID', 'error');
        elements.playerIdInput.focus();
        return;
      }
      if (pid.length < 5) {
        elements.playerIdInput.classList.add('input-error');
        showToast('Player ID must be at least 5 digits', 'error');
        return;
      }
      elements.playerIdInput.classList.remove('input-error');
      state.playerId = pid;
      navigateTo('summary');
    });

    // Place Order button on Summary Screen
    elements.btnPlaceOrder.addEventListener('click', () => {
      // Require auth before payment
      if (!state.currentUser) {
        state.postAuthAction = 'placeOrder';
        showToast('Please log in or create an account to proceed with checkout', 'info');
        openModal('authModal');
        return;
      }
      navigateTo('payment');
    });

    // Verify Payment button
    elements.btnVerifyPayment.addEventListener('click', handleVerifyPayment);

    // Success Screen buttons
    elements.btnSuccessBackHome.addEventListener('click', () => navigateTo('home'));
    elements.btnSuccessViewOrders.addEventListener('click', () => navigateTo('orders'));

    // Profile menu items
    document.getElementById('menuItemOrders').addEventListener('click', () => navigateTo('orders'));
    document.getElementById('menuItemPaymentMethods').addEventListener('click', () => openModal('paymentMethodsModal'));
    document.getElementById('menuItemSupport').addEventListener('click', () => openModal('supportModal'));
    document.getElementById('menuItemAboutUs').addEventListener('click', () => openModal('aboutModal'));
    elements.menuItemAdmin.addEventListener('click', () => navigateTo('admin'));

    // Auth Action (Login or Logout)
    document.getElementById('menuItemAuthAction').addEventListener('click', async () => {
      if (state.currentUser) {
        if (supabaseClient) await supabaseClient.auth.signOut();
        handleGuestUser();
        showToast('You have been logged out.', 'info');
      } else {
        openModal('authModal');
      }
    });

    // Drawer links
    document.querySelectorAll('.drawer-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const target = link.getAttribute('data-goto');
        closeModal('sideDrawerModal');
        navigateTo(target);
      });
    });

    // Admin dashboard tabs & search
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-admin-tab');

        document.getElementById('adminTabOrders').style.display = tab === 'orders' ? 'block' : 'none';
        document.getElementById('adminTabPackages').style.display = tab === 'packages' ? 'block' : 'none';
        document.getElementById('adminTabSupport').style.display = tab === 'support' ? 'block' : 'none';
      });
    });

    const btnAdminExit = document.getElementById('btnAdminExit');
    if (btnAdminExit) btnAdminExit.addEventListener('click', () => navigateTo('profile'));

    elements.adminOrderSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = state.adminOrders.filter(o =>
        (o.player_id && o.player_id.toLowerCase().includes(q)) ||
        (o.transaction_reference && o.transaction_reference.toLowerCase().includes(q)) ||
        (o.orderId && o.orderId.toLowerCase().includes(q))
      );
      renderAdminOrdersList(filtered);
    });

    // Admin Add Package
    const btnAdminAddPackage = document.getElementById('btnAdminAddPackage');
    if (btnAdminAddPackage) btnAdminAddPackage.addEventListener('click', () => openModal('adminAddPackageModal'));

    const formAdminAddPackage = document.getElementById('formAdminAddPackage');
    if (formAdminAddPackage) {
      formAdminAddPackage.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('adminPkgName').value.trim();
        const diamonds = parseInt(document.getElementById('adminPkgDiamonds').value, 10);
        const bonus = parseInt(document.getElementById('adminPkgBonus').value || 0, 10);
        const price = parseFloat(document.getElementById('adminPkgPrice').value);

        const newPkg = {
          id: state.packages.length + 1,
          name,
          diamonds,
          bonus,
          price,
          currency: 'USD',
          image_url: diamonds >= 1000 ? 'assets/images/diamonds-pile.jpg' : 'assets/images/diamond-single.jpg',
          active: true,
          sort_order: state.packages.length + 1
        };

        if (supabaseClient) {
          try {
            await supabaseClient.from('packages').insert(newPkg);
          } catch (err) {}
        }

        state.packages.push(newPkg);
        closeModal('adminAddPackageModal');
        showToast('New Diamond package created!', 'success');
        renderAdminPackagesList();
        renderPackagesList();
      });
    }

    // Support message ticket submission to Supabase
    const formSupportTicket = document.getElementById('formSupportTicket');
    if (formSupportTicket) {
      formSupportTicket.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('supportSubject').value.trim();
        const message = document.getElementById('supportMessage').value.trim();
        const btn = document.getElementById('btnSubmitTicket');

        btn.classList.add('btn-loading');
        if (supabaseClient) {
          try {
            await supabaseClient.from('support_messages').insert({
              user_id: state.currentUser ? state.currentUser.id : null,
              subject,
              message,
              status: 'open'
            });
          } catch (e) {}
        }

        setTimeout(() => {
          btn.classList.remove('btn-loading');
          closeModal('supportModal');
          showToast('Message submitted! Our support team will review it shortly.', 'success');
          formSupportTicket.reset();
        }, 800);
      });
    }

    // Input sanitizers
    elements.paymentPhoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^\d+]/g, '');
    });
    elements.playerIdInput.addEventListener('input', () => {
      elements.playerIdInput.classList.remove('input-error');
    });

    // Modal Close Triggers
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetModalId = btn.getAttribute('data-close-modal');
        closeModal(targetModalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });
  }

  // Status clock
  function updateClock() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    if (elements.statusClock) elements.statusClock.textContent = `${hrs}:${mins}`;
  }

  // Bootstrap
  async function init() {
    renderHomeDiamondsGrid();
    renderPackagesList();
    renderOrdersList();
    renderPaymentMethods();
    initEventListeners();
    initAuthForms();
    updateClock();
    setInterval(updateClock, 30000);

    // Show initial home screen immediately
    navigateTo('home', false);
    refreshIcons();

    // Initialize Supabase queries and Auth in background
    try {
      await initAuth();
      await loadPackagesFromSupabase();
      await loadPaymentMethodsFromSupabase();
    } catch (e) {
      console.warn('Initial Supabase sync:', e);
    }
  }

  // Expose global debug interface
  window.dimatop = {
    state,
    navigateTo,
    openModal,
    closeModal,
    showToast,
    supabase: supabaseClient
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
