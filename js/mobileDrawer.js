/**
 * MegaMart Upgraded Mobile Navigation Drawer Component
 * 
 * Data-driven, fully responsive, self-contained mobile drawer script.
 * Features:
 * - Dynamic path detection (works seamlessly on root & components pages)
 * - User Profile & local storage authentication integration
 * - Keyboard Trap & ESC close for Web Accessibility (A11y)
 * - Custom touch-swipe gestures to close
 * - Smooth custom ripple effects on items
 * - Auto page active state highlighting
 * - Interconnected search integration
 */

(function () {
    // 1. Core Config & Data
    const drawerData = {
        navigation: [
            { label: "Home", icon: "ri-home-line", path: "index.html" },
            { label: "Today's Deals", icon: "ri-percent-line", path: "components/groceries.html?sort=discount" },
            { label: "Best Sellers", icon: "ri-fire-line", path: "components/groceries.html?sort=rating" },
            { label: "New Arrivals", icon: "ri-sparkles-line", path: "components/groceries.html?sort=new" }
        ],
        categories: [
            { label: "Mobiles", icon: "ri-smartphone-line", path: "components/mobile.html" },
            { label: "Electronics", icon: "ri-cpu-line", path: "components/electronics.html" },
            { label: "Groceries", icon: "ri-shopping-basket-2-line", path: "components/groceries.html" },
            { label: "Fresh Food", icon: "ri-restaurant-line", path: "components/food.html" },
            { label: "Fashion", icon: "ri-shirt-line", path: "components/fashion.html" },
            { label: "Beauty", icon: "ri-magic-line", path: "components/cosmetics.html" },
            { label: "Home & Kitchen", icon: "ri-home-gear-line", path: "components/kitchen.html" },
            { label: "Accessories", icon: "ri-headphone-line", path: "components/accessories.html" }
        ],
        quickLinks: [
            { label: "Cart", icon: "ri-shopping-cart-2-line", path: "components/cart.html", isCart: true },
            { label: "Wishlist", icon: "ri-heart-line", path: "components/cart.html" },
            { label: "Orders", icon: "ri-file-list-3-line", path: "components/cart.html" },
            { label: "Notifications", icon: "ri-notification-3-line", path: "#" },
            { label: "Settings", icon: "ri-settings-4-line", path: "#" }
        ],
        support: [
            { label: "Help & Support", icon: "ri-question-line", path: "components/contact.html" },
            { label: "Contact Us", icon: "ri-mail-line", path: "components/contact.html" }
        ]
    };

    // Helper functions for path resolution
    function isSubpage() {
        return window.location.pathname.includes('/components/');
    }

    function resolvePath(targetPath) {
        if (!targetPath || targetPath === '#') return '#';
        
        // If it starts with components/
        if (targetPath.startsWith('components/')) {
            const file = targetPath.substring('components/'.length);
            return isSubpage() ? `./${file}` : targetPath;
        }
        
        if (targetPath === 'index.html') {
            return isSubpage() ? '../index.html' : 'index.html';
        }
        
        return targetPath;
    }

    function resolveAssetPath(assetPath) {
        return (isSubpage() ? '../' : '') + assetPath;
    }

    // Dynamic style injection
    function injectDrawerStylesheet() {
        const cssPath = resolveAssetPath('css/mobile-drawer.css');
        if (!document.querySelector(`link[href*="mobile-drawer.css"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }
    }

    // 2. Component Initialization
    window.initMobileDrawerComponent = function () {
        injectDrawerStylesheet();
        
        // Check if drawer elements already exist to prevent duplicates
        let drawer = document.getElementById('mobileDrawer');
        let overlay = document.getElementById('drawerOverlay');

        if (!drawer) {
            // Render drawer HTML structure dynamically
            overlay = document.createElement('div');
            overlay.id = 'drawerOverlay';
            overlay.className = 'drawer-overlay';
            document.body.appendChild(overlay);

            drawer = document.createElement('div');
            drawer.id = 'mobileDrawer';
            drawer.className = 'mobile-drawer';
            drawer.setAttribute('role', 'dialog');
            drawer.setAttribute('aria-modal', 'true');
            drawer.setAttribute('aria-labelledby', 'drawerTitle');
            
            drawer.innerHTML = `
                <div class="drawer-header">
                    <div class="logo" id="drawerLogoBtn">
                        <img src="${resolveAssetPath('img/download.svg')}" class="logo-img" alt="MegaMart Logo">
                        <h3 id="drawerTitle">MegaMart</h3>
                    </div>
                    <button class="close-drawer" id="closeDrawer" aria-label="Close menu">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div class="drawer-profile" id="drawerProfile">
                    <!-- Dynamic User Profile Info -->
                </div>
                <div class="drawer-body">
                    <div class="drawer-search">
                        <input type="text" id="drawerSearchInput" placeholder="Search essentials, groceries..." aria-label="Search">
                        <button class="search-btn-drawer" id="drawerSearchBtn" aria-label="Submit search">
                            <i class="ri-search-line"></i>
                        </button>
                    </div>
                    
                    <div class="drawer-section">
                        <h4 class="section-title">Navigation</h4>
                        <div class="drawer-links" id="drawerMainNav"></div>
                    </div>
                    
                    <div class="drawer-section">
                        <h4 class="section-title">Categories</h4>
                        <div class="drawer-categories-grid" id="drawerCats"></div>
                    </div>
                    
                    <div class="drawer-section">
                        <h4 class="section-title">My Account</h4>
                        <div class="drawer-links" id="drawerQuickLinks"></div>
                    </div>
                    
                    <div class="drawer-section">
                        <h4 class="section-title">Support</h4>
                        <div class="drawer-links" id="drawerSupportLinks"></div>
                    </div>
                    
                    <div class="drawer-footer" id="drawerFooter"></div>
                </div>
            `;
            document.body.appendChild(drawer);
        }

        // 3. Render Data-Driven Links
        renderDrawerLinks(drawerData);

        // 4. Update Profile Info based on Auth State
        updateDrawerProfileState();

        // 5. Wire Event Listeners
        const closeBtn = document.getElementById('closeDrawer');
        const overlayElement = document.getElementById('drawerOverlay');
        const menuBtn = document.querySelector('.list-img');
        const respIcons = document.querySelector('.resp_icon');
        const searchInput = document.getElementById('drawerSearchInput');
        const searchBtn = document.getElementById('drawerSearchBtn');
        const logoBtn = document.getElementById('drawerLogoBtn');

        function toggleDrawer() {
            const isActive = drawer.classList.toggle('active');
            overlayElement.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            
            if (isActive) {
                // Focus on search input or close button when opened
                setTimeout(() => {
                    if (searchInput) searchInput.focus();
                }, 100);
                highlightActiveLink();
            } else {
                // Return focus to menu toggle button if it exists
                if (menuBtn && window.innerWidth > 768) {
                    menuBtn.focus();
                } else if (respIcons) {
                    respIcons.focus();
                }
            }
        }

        // Attach toggles to menu triggers
        if (menuBtn) {
            menuBtn.setAttribute('tabindex', '0');
            menuBtn.setAttribute('aria-label', 'Open Menu Drawer');
            // Remove previous listeners using replacement to avoid duplicates
            const newMenuBtn = menuBtn.cloneNode(true);
            menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
            newMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleDrawer();
            });
            newMenuBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDrawer();
                }
            });
        }

        if (respIcons) {
            respIcons.setAttribute('tabindex', '0');
            respIcons.setAttribute('aria-label', 'Open Menu Drawer Mobile');
            const newRespIcons = respIcons.cloneNode(true);
            respIcons.parentNode.replaceChild(newRespIcons, respIcons);
            newRespIcons.addEventListener('click', (e) => {
                e.preventDefault();
                toggleDrawer();
            });
            newRespIcons.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDrawer();
                }
            });
        }

        // Close triggers
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                toggleDrawer();
            };
        }
        if (overlayElement) {
            overlayElement.onclick = (e) => {
                e.preventDefault();
                toggleDrawer();
            };
        }

        // Close drawer on ESC key (bound once to prevent duplicate listeners on window)
        if (!window.mobileDrawerEscListenerAdded) {
            window.mobileDrawerEscListenerAdded = true;
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const activeDrawer = document.getElementById('mobileDrawer');
                    if (activeDrawer && activeDrawer.classList.contains('active')) {
                        const closeBtn = document.getElementById('closeDrawer');
                        if (closeBtn) closeBtn.click();
                    }
                }
            });
        }

        // Logo action
        if (logoBtn) {
            logoBtn.addEventListener('click', () => {
                toggleDrawer();
                window.location.href = resolvePath('index.html');
            });
        }

        // Focus Trap for Accessibility
        drawer.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            // Find all focusable elements inside the drawer
            const focusables = drawer.querySelectorAll('button, input, a, [tabindex="0"]');
            const firstEl = focusables[0];
            const lastEl = focusables[focusables.length - 1];

            if (e.shiftKey) { // Shift + Tab (backwards)
                if (document.activeElement === firstEl) {
                    lastEl.focus();
                    e.preventDefault();
                }
            } else { // Tab (forwards)
                if (document.activeElement === lastEl) {
                    firstEl.focus();
                    e.preventDefault();
                }
            }
        });

        // 6. Search Bar functionality
        function executeSearch() {
            const query = searchInput.value.trim();
            if (!query) return;

            toggleDrawer();

            // If we are already on groceries or food components, update their local search boxes and dispatch input event
            const localGroceriesSearch = document.getElementById('searchInput');
            const localFoodSearch = document.getElementById('foodSearch');

            if (localGroceriesSearch) {
                localGroceriesSearch.value = query;
                localGroceriesSearch.dispatchEvent(new Event('input', { bubbles: true }));
                localGroceriesSearch.scrollIntoView({ behavior: 'smooth' });
            } else if (localFoodSearch) {
                localFoodSearch.value = query;
                localFoodSearch.dispatchEvent(new Event('input', { bubbles: true }));
                localFoodSearch.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Otherwise, redirect to groceries listing with a search query parameter
                window.location.href = resolvePath('components/groceries.html') + '?search=' + encodeURIComponent(query);
            }
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    executeSearch();
                }
            });
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', executeSearch);
        }

        // 7. Touch Swipe-to-Close Gestures
        let touchStartX = 0;
        let touchCurrentX = 0;
        const swipeThreshold = 80;

        drawer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchCurrentX = touchStartX;
            drawer.style.transition = 'none'; // Instant dragging feedback
        }, { passive: true });

        drawer.addEventListener('touchmove', (e) => {
            touchCurrentX = e.touches[0].clientX;
            const diffX = touchCurrentX - touchStartX;
            
            // Only swipe to the right (close direction since drawer is positioned on the right)
            if (diffX > 0) {
                drawer.style.transform = `translateX(${diffX - window.innerWidth}px)`;
                
                // Fade overlay opacity proportionally
                const opacityPercent = Math.max(0, 1 - (diffX / 280));
                overlayElement.style.opacity = opacityPercent;
            }
        }, { passive: true });

        drawer.addEventListener('touchend', () => {
            drawer.style.transition = ''; // Restore transition classes
            overlayElement.style.opacity = '';
            
            const diffX = touchCurrentX - touchStartX;
            
            if (diffX > swipeThreshold) {
                // Swiped past threshold -> close
                drawer.classList.remove('active');
                overlayElement.classList.remove('active');
                document.body.classList.remove('no-scroll');
                drawer.style.transform = '';
            } else {
                // Reset translation
                drawer.style.transform = '';
            }
        });

        // 8. Auto Active Page Highlight
        function highlightActiveLink() {
            const currentPath = window.location.pathname;
            const links = drawer.querySelectorAll('.drawer-item, .category-card');
            
            links.forEach(link => {
                link.classList.remove('active-link');
                const hrefAttr = link.getAttribute('href');
                if (hrefAttr && hrefAttr !== '#' && currentPath.includes(hrefAttr.replace(/^\.\//, '').replace(/^\.\.\//, ''))) {
                    link.classList.add('active-link');
                }
            });
        }

        // 9. Attach custom ripple effects and auto close to all interactive items
        const interactiveItems = drawer.querySelectorAll('.drawer-item, .category-card, .logout-btn');
        interactiveItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Append custom ripple
                createRippleEffect(e);
                
                // Auto close drawer if it's a same-page navigation or hash
                const href = item.getAttribute('href');
                if (!href || href === '#' || href === window.location.hash) {
                    // Do not close immediately if it is a link that triggers window navigation, browser will refresh anyway
                    // But if it is a mock or same page, close it.
                    setTimeout(() => {
                        toggleDrawer();
                    }, 350);
                }
            });
        });

        // Sync with existing global cart badge count
        if (window.MegaMartCart && typeof window.MegaMartCart.updateCartCount === 'function') {
            window.MegaMartCart.updateCartCount();
        }
    };

    // 10. Render Functions
    function renderDrawerLinks(data) {
        // Main Nav
        const mainNavContainer = document.getElementById('drawerMainNav');
        mainNavContainer.innerHTML = data.navigation.map(nav => `
            <a href="${resolvePath(nav.path)}" class="drawer-item">
                <i class="${nav.icon}"></i>
                <span>${nav.label}</span>
            </a>
        `).join('');

        // Categories Grid
        const catsContainer = document.getElementById('drawerCats');
        catsContainer.innerHTML = data.categories.map(cat => `
            <a href="${resolvePath(cat.path)}" class="category-card">
                <i class="${cat.icon}"></i>
                <span>${cat.label}</span>
            </a>
        `).join('');

        // Quick Links
        const quickContainer = document.getElementById('drawerQuickLinks');
        quickContainer.innerHTML = data.quickLinks.map(link => {
            const badgeHtml = link.isCart ? ` <span class="cart-badge cart-count">0</span>` : '';
            return `
                <a href="${resolvePath(link.path)}" class="drawer-item">
                    <i class="${link.icon}"></i>
                    <span>${link.label}</span>
                    ${badgeHtml}
                </a>
            `;
        }).join('');

        // Support
        const supportContainer = document.getElementById('drawerSupportLinks');
        supportContainer.innerHTML = data.support.map(link => `
            <a href="${resolvePath(link.path)}" class="drawer-item">
                <i class="${link.icon}"></i>
                <span>${link.label}</span>
            </a>
        `).join('');
    }

    // 11. Profile State management (Sign In/Out & Welcome Name Display)
    function updateDrawerProfileState() {
        const profileContainer = document.getElementById('drawerProfile');
        const footerContainer = document.getElementById('drawerFooter');
        
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('megaMartUser'));
        } catch (e) {
            console.error("Failed to parse user profile from localStorage", e);
        }

        if (user && (user.name || user.email)) {
            // User is signed in
            const displayName = user.name || user.email.split('@')[0];
            const initial = displayName.charAt(0).toUpperCase();

            profileContainer.innerHTML = `
                <div class="profile-avatar">${initial}</div>
                <div class="profile-info">
                    <span class="profile-welcome">Welcome back,</span>
                    <span class="profile-name" title="${displayName}">${displayName}</span>
                </div>
            `;

            footerContainer.innerHTML = `
                <button class="logout-btn" id="drawerLogoutBtn">
                    <i class="ri-logout-box-r-line"></i>
                    <span>Logout</span>
                </button>
            `;

            // Attach click to logout
            const logoutBtn = document.getElementById('drawerLogoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    createRippleEffect(e);
                    setTimeout(() => {
                        localStorage.removeItem('megaMartUser');
                        if (window.showToast) {
                            showToast("🔒 Logged out successfully. See you soon!");
                        } else {
                            alert("Logged out successfully.");
                        }
                        // Refresh profile state
                        updateDrawerProfileState();
                        // Close drawer
                        document.getElementById('closeDrawer').click();
                        // If we are in component or cart, redirect to index
                        if (isSubpage()) {
                            window.location.href = '../index.html';
                        } else {
                            window.location.reload();
                        }
                    }, 400);
                });
            }
        } else {
            // Guest mode
            profileContainer.innerHTML = `
                <div class="profile-avatar"><i class="ri-user-3-line" style="font-size: 2.2rem; color: #ffffff;"></i></div>
                <div class="profile-info">
                    <span class="profile-welcome">Hello, Guest</span>
                    <span class="profile-name">Access your account</span>
                </div>
                <a href="${resolvePath('components/signin.html')}" class="profile-auth-btn">Sign In</a>
            `;

            footerContainer.innerHTML = `
                <div style="text-align: center; font-size: 1.2rem; color: #94a3b8; font-weight: 500;">
                    MegaMart Portfolio Project v1.2.0
                </div>
            `;
        }
    }

    // 12. Micro-animation Ripple effect creator
    function createRippleEffect(event) {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        const rect = button.getBoundingClientRect();
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple-effect");

        // Clear previous ripples
        const existing = button.getElementsByClassName("ripple-effect")[0];
        if (existing) {
            existing.remove();
        }

        button.appendChild(circle);
    }
})();
