// MegaMart Core JavaScript System

let isCartInitialized = false;

function initApp() {
    initScrollReveal();
    initHeroSlider();
    initMobileDrawer();
    initCartSystem();
    initGlobalNavigationListeners();
}

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

/* ==========================================
   1. SCROLL REVEAL SYSTEM (IntersectionObserver)
   ========================================== */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.mobile_info, .category, .brand-card, .daily_uses, .section1, .section2, .section3, .section4'
    );

    // Add reveal-on-scroll class dynamically
    revealElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    const observerOptions = {
        root: null, // Viewport
        threshold: 0.05, // Trigger when 5% visible
        rootMargin: "0px 0px -40px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
}

/* ==========================================
   2. PREMIUM HERO SLIDER SYSTEM
   ========================================== */
function initHeroSlider() {
    const gallery = document.querySelector(".gallery");
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!gallery || !backBtn || !nextBtn) return;

    let autoSlideInterval;

    function getScrollAmount() {
        return gallery.clientWidth;
    }

    function slideNext() {
        const maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;
        if (gallery.scrollLeft >= maxScrollLeft - 20) {
            // Loop back to start
            gallery.scrollTo({
                left: 0,
                behavior: "smooth"
            });
        } else {
            gallery.scrollBy({
                left: getScrollAmount(),
                behavior: "smooth"
            });
        }
    }

    function slidePrev() {
        if (gallery.scrollLeft <= 20) {
            // Loop to end
            gallery.scrollTo({
                left: gallery.scrollWidth,
                behavior: "smooth"
            });
        } else {
            gallery.scrollBy({
                left: -getScrollAmount(),
                behavior: "smooth"
            });
        }
    }

    // Next click
    nextBtn.addEventListener("click", () => {
        slideNext();
        resetAutoSlide();
    });

    // Back click
    backBtn.addEventListener("click", () => {
        slidePrev();
        resetAutoSlide();
    });

    function startAutoSlide() {
        autoSlideInterval = setInterval(slideNext, 6000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    startAutoSlide();
}

/* ==========================================
   3. MOBILE NAVIGATION DRAWER & INTERACTIONS
   ========================================== */
function initMobileDrawer() {
    // Check if we are inside components folder to set correct relative link for loading mobileDrawer.js
    const isSubpage = window.location.pathname.includes('/components/');
    const drawerScriptPath = isSubpage ? '../js/mobileDrawer.js' : 'js/mobileDrawer.js';

    // If the component initializer is already available, run it directly
    if (typeof window.initMobileDrawerComponent === 'function') {
        window.initMobileDrawerComponent();
    } else {
        // Dynamically load mobileDrawer.js
        const script = document.createElement('script');
        script.src = drawerScriptPath;
        script.onload = () => {
            if (typeof window.initMobileDrawerComponent === 'function') {
                window.initMobileDrawerComponent();
            }
        };
        script.onerror = () => {
            console.error("Failed to load MegaMart mobile navigation drawer component script.");
        };
        document.body.appendChild(script);
    }
}

/* ==========================================
   4. E-COMMERCE CART SYSTEM & TOAST NOTIFICATIONS
   ========================================== */
// Unified Cart Manager Module
window.MegaMartCart = {
    // 1. Get Cart
    getCart() {
        try {
            return JSON.parse(localStorage.getItem('megaMartCart')) || [];
        } catch (e) {
            console.error("Corrupted localStorage. Resetting cart.", e);
            localStorage.setItem('megaMartCart', JSON.stringify([]));
            return [];
        }
    },

    // 2. Save Cart
    saveCart(cart) {
        localStorage.setItem('megaMartCart', JSON.stringify(cart));
        this.updateCartCount();
    },

    // 3. Add to Cart (Increments quantity if duplicate, handles structured data)
    addToCart(product) {
        if (!product || !product.name) {
            console.error("Invalid product added", product);
            return;
        }

        let cart = this.getCart();
        const standardizedId = this.getStandardizedId(product);
        const category = product.category || "General";
        const price = this.parsePrice(product.price);
        const originalPrice = product.originalPrice ? this.parsePrice(product.originalPrice) : (product.oldPrice ? this.parsePrice(product.oldPrice) : null);
        const discount = product.discount || (originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) + "% OFF" : null);

        // Resolve fallback image
        const image = this.resolveImagePath(product.image || this.getFallbackImage(product.name));

        const existing = cart.find(item => String(item.id) === String(standardizedId));
        if (existing) {
            existing.quantity = (existing.quantity || 1) + (product.quantity || 1);
        } else {
            cart.push({
                id: standardizedId,
                name: product.name,
                category: category,
                price: price,
                originalPrice: originalPrice,
                image: image,
                quantity: product.quantity || 1,
                rating: product.rating || null,
                discount: discount
            });
        }

        this.saveCart(cart);
        // showToast(`${product.name} added to cart!`);
    },

    // 4. Remove from Cart
    removeFromCart(id) {
        let cart = this.getCart();
        cart = cart.filter(item => String(item.id) !== String(id));
        this.saveCart(cart);
        if (typeof window.renderCart === 'function') {
            window.renderCart();
        }
    },

    // 5. Update Quantity (Cannot go below 1)
    updateQuantity(id, quantity) {
        let cart = this.getCart();
        const item = cart.find(item => String(item.id) === String(id));
        if (item) {
            item.quantity = Math.max(1, parseInt(quantity) || 1);
            this.saveCart(cart);
        }
        if (typeof window.renderCart === 'function') {
            window.renderCart();
        }
    },

    // 6. Clear Cart
    clearCart() {
        this.saveCart([]);
        if (typeof window.renderCart === 'function') {
            window.renderCart();
        }
    },

    // 7. Update Cart Count Badges globally
    updateCartCount() {
        const cart = this.getCart();
        const totalQty = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        const badges = document.querySelectorAll('.cart-count, .mobile-cart-count, .badge.cart-count');
        badges.forEach(badge => {
            badge.textContent = totalQty;
            badge.style.display = totalQty > 0 ? 'inline-flex' : 'none';
        });
    },

    // 8. Calculate Totals (Subtotal, Discount, Delivery, Tax, Grand Total)
    calculateTotals() {
        const cart = this.getCart();
        let totalItems = 0;
        let subtotal = 0;
        let totalDiscount = 0;

        cart.forEach(item => {
            const qty = item.quantity || 1;
            const itemPrice = item.price || 0;
            const origPrice = item.originalPrice || itemPrice;

            totalItems += qty;
            subtotal += origPrice * qty;
            totalDiscount += (origPrice - itemPrice) * qty;
        });

        const finalSubtotal = subtotal - totalDiscount;
        const deliveryCharge = (finalSubtotal === 0 || finalSubtotal > 500) ? 0 : 50;
        const tax = Math.round(finalSubtotal * 0.05); // 5% optional tax
        const grandTotal = finalSubtotal + deliveryCharge + tax;

        return {
            totalItems,
            subtotal,
            discount: totalDiscount,
            deliveryCharge,
            tax,
            grandTotal
        };
    },

    // Standardized ID Generator
    generateProductId(name, category) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const catSlug = (category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `${catSlug}-${slug}`;
    },

    getStandardizedId(product) {
        if (!product.id) {
            return this.generateProductId(product.name, product.category);
        }
        if (typeof product.id === 'string' && product.id.includes('-')) {
            return product.id;
        }
        const cat = (product.category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `${cat}-${product.id}`;
    },

    // Price parsing helper
    parsePrice(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(String(val).replace(/[^\d.]/g, '')) || 0;
    },

    // Path resolution helper for images
    resolveImagePath(imgSrc) {
        if (!imgSrc) return "../img/download.svg";
        if (imgSrc.startsWith("http://") || imgSrc.startsWith("https://") || imgSrc.startsWith("data:")) {
            return imgSrc;
        }
        if (imgSrc.startsWith("../")) {
            return imgSrc;
        }
        const isSubpage = window.location.pathname.includes('/components/');
        return (isSubpage ? '../' : '') + imgSrc.replace(/^(\.\.\/)+/, '');
    },

    // Fallback image solver
    getFallbackImage(name) {
        const lower = name.toLowerCase();
        if (lower.includes("watch")) return "img/slide watch image2.png";
        if (lower.includes("tv")) return "img/slider_TV-removebg-preview.png";
        if (lower.includes("tomato")) return "https://images.unsplash.com/photo-1595855759920-86582396756a?w=200";
        if (lower.includes("broccoli")) return "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=200";
        if (lower.includes("potato")) return "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200";
        if (lower.includes("spinach")) return "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200";
        if (lower.includes("apple")) return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200";
        if (lower.includes("banana")) return "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200";
        if (lower.includes("grapes")) return "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200";
        if (lower.includes("strawberry")) return "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200";
        if (lower.includes("mango")) return "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200";
        if (lower.includes("cherry")) return "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200";
        if (lower.includes("milk")) return "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200";
        if (lower.includes("yogurt")) return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200";
        if (lower.includes("butter")) return "https://images.unsplash.com/photo-1589985270825-4b7f1357a3e2?w=200";
        if (lower.includes("s22")) return "img/mobile1.png";
        if (lower.includes("m13")) return "img/mobile2.png";
        if (lower.includes("m33")) return "img/mobile3.png";
        if (lower.includes("m53")) return "img/mobile4.png";
        if (lower.includes("s23")) return "img/mobile5.png";
        return "img/download.svg";
    }
};

function initCartSystem() {
    // 1. Initial Badge Update
    window.MegaMartCart.updateCartCount();

    // 2. Setup dynamic button injection styles
    injectStyles();

    // 3. Inject buttons dynamically on static lists
    injectAddToCartButtons();

    // 4. Set up Global Event Delegation for additions (bound once)
    if (isCartInitialized) return;
    isCartInitialized = true;

    document.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart') ||
            e.target.closest('.buy-btn') ||
            e.target.closest('.mobile_span') ||
            e.target.closest('.add-cart') ||
            e.target.closest('.buy-now');

        if (addToCartBtn) {
            // Skip dynamic buttons or modal quick add because they have custom click handlers
            if (addToCartBtn.classList.contains('dynamic-add-btn') || addToCartBtn.id === 'modalAddCart') {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            let productName = "Product Item";
            let productPrice = "₹0";
            let originalPrice = "";
            let productImage = "";
            let productCategory = "General";

            const detailWrapper = addToCartBtn.closest('.product-wrapper');
            if (detailWrapper) {
                // Detail Page Layout (e.g., m13.html, m33.html)
                const titleEl = detailWrapper.querySelector('.product-info h1');
                const priceEl = detailWrapper.querySelector('.price-section .price');
                const oldPriceEl = detailWrapper.querySelector('.price-section .old-price');
                const imgEl = detailWrapper.querySelector('.product-image img');

                if (titleEl) productName = titleEl.textContent.trim();
                if (priceEl) productPrice = priceEl.textContent.trim();
                if (oldPriceEl) originalPrice = oldPriceEl.textContent.trim();
                if (imgEl) productImage = imgEl.getAttribute('src');

                // Deduce Category
                const docTitle = document.title || "";
                if (docTitle.includes("Galaxy") || docTitle.includes("Mobiles") || docTitle.includes("M13") || docTitle.includes("M33") || docTitle.includes("M53") || docTitle.includes("S22") || docTitle.includes("S23")) {
                    productCategory = "Mobiles";
                }
            } else {
                // Home/Grid Product Layout
                const mobileInfo = addToCartBtn.closest('.mobile_info') ||
                    addToCartBtn.closest('.card') ||
                    addToCartBtn.closest('.daily_uses') ||
                    addToCartBtn.closest('.product-card');

                if (mobileInfo) {
                    const titleEl = mobileInfo.querySelector('p, h3, h4');
                    const priceEl = mobileInfo.querySelector('.mobile_infos span, .price, .current-price, .current');
                    const oldPriceEl = mobileInfo.querySelector('.mobile_infos span:nth-of-type(2), .old-price, .old-price-box, .old');
                    const imgEl = mobileInfo.querySelector('.img_div img:not(.discount), .product-img-wrapper img, .card-img img');

                    if (titleEl) productName = titleEl.textContent.trim();
                    if (priceEl) productPrice = priceEl.textContent.trim().split(' ')[0];
                    if (oldPriceEl) originalPrice = oldPriceEl.textContent.trim();
                    if (imgEl) productImage = imgEl.getAttribute('src');

                    // Deduce Category
                    if (mobileInfo.closest('.mobile_section')) productCategory = "Mobiles";
                    else if (mobileInfo.closest('.food_category') || mobileInfo.closest('.daily_uses')) productCategory = "Groceries";
                }
            }

            // Fallbacks & standard attributes overrides
            if (addToCartBtn.getAttribute('data-name')) productName = addToCartBtn.getAttribute('data-name');
            if (addToCartBtn.getAttribute('data-price')) productPrice = addToCartBtn.getAttribute('data-price');
            if (addToCartBtn.getAttribute('data-image')) productImage = addToCartBtn.getAttribute('data-image');
            if (addToCartBtn.getAttribute('data-category')) productCategory = addToCartBtn.getAttribute('data-category');

            window.MegaMartCart.addToCart({
                id: window.MegaMartCart.generateProductId(productName, productCategory),
                name: productName,
                price: productPrice,
                originalPrice: originalPrice,
                image: productImage,
                category: productCategory
            });
        }
    });
}

// Injects styles for dynamically generated buttons
function injectStyles() {
    if (document.getElementById('megamart-cart-styles')) return;
    const style = document.createElement('style');
    style.id = 'megamart-cart-styles';
    style.textContent = `
        .dynamic-add-btn {
            width: 100%;
            margin-top: 15px;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: #008ECC;
            color: white;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 10;
        }
        .dynamic-add-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 142, 204, 0.2);
            background: #006b99;
        }
        .dynamic-add-btn.added {
            background: #22c55e !important;
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.35) !important;
        }
    `;
    document.head.appendChild(style);
}

// Injects Add to Cart buttons on static cards
function injectAddToCartButtons() {
    const cards = document.querySelectorAll('.mobile-grid .card');
    if (cards.length === 0) return;

    cards.forEach(card => {
        if (card.querySelector('.dynamic-add-btn') || card.querySelector('.add-to-cart')) return;

        const btn = document.createElement('button');
        btn.className = 'dynamic-add-btn';
        btn.innerHTML = 'Add to Cart';

        const cardInfo = card.querySelector('.card-info');
        if (cardInfo) {
            cardInfo.appendChild(btn);
        } else {
            card.appendChild(btn);
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const titleEl = card.querySelector('h3');
            const priceEl = card.querySelector('.price');
            const oldPriceEl = card.querySelector('.old-price');
            const imgEl = card.querySelector('.card-img img');

            const name = titleEl ? titleEl.textContent.trim() : "Product Item";
            const priceText = priceEl ? priceEl.textContent.trim() : "0";
            const oldPriceText = oldPriceEl ? oldPriceEl.textContent.trim() : "";
            const image = imgEl ? imgEl.getAttribute('src') : "";

            // Deduce category from page title
            const docTitle = document.title || "";
            const category = docTitle.replace("MegaMart - ", "").trim();

            window.MegaMartCart.addToCart({
                id: window.MegaMartCart.generateProductId(name, category),
                name: name,
                category: category,
                price: priceText,
                originalPrice: oldPriceText,
                image: image
            });

            btn.innerHTML = 'Added!';
            btn.classList.add('added');
            setTimeout(() => {
                btn.innerHTML = 'Add to Cart';
                btn.classList.remove('added');
            }, 1500);
        });
    });
}

/* ==========================================
   5. PREMIUM TOAST NOTIFICATION SYSTEM
   ========================================== */
function showToast(message) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <span class="toast-close">&times;</span>
    `;

    toastContainer.appendChild(toast);

    const removeTimeout = setTimeout(() => {
        removeToast(toast);
    }, 3000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(removeTimeout);
        removeToast(toast);
    });
}

function removeToast(toast) {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

// ==========================================
// 6. SPA ROUTER & GLOBAL HEADER/FOOTER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initSPA();
});

let cachedLayout = null;

async function getLayout() {
    if (cachedLayout) return cachedLayout;
    const isSubpage = window.location.pathname.includes('/components/');
    const indexPath = isSubpage ? '../index.html' : 'index.html';
    
    try {
        const res = await fetch(indexPath);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        cachedLayout = {
            header: doc.querySelector('header.header-fluid'),
            catBar: doc.querySelector('.category-bar'),
            footer: doc.querySelector('footer'),
            styles: Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
        };
        return cachedLayout;
    } catch (e) {
        console.error("Failed to load layout", e);
        return null;
    }
}

function fixPathsForSubpage(element) {
    const images = element.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('../') && !src.startsWith('data:')) {
            img.setAttribute('src', '../' + src);
        }
    });

    const links = element.querySelectorAll('a');
    links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('javascript:')) {
            if (href.startsWith('components/')) {
                a.setAttribute('href', href.replace('components/', ''));
            } else if (href === 'index.html' || href === './index.html' || href === '/') {
                a.setAttribute('href', '../index.html');
            } else if (!href.startsWith('../')) {
                // For any other root level links
                a.setAttribute('href', '../' + href);
            }
        }
    });
}

async function initSPA() {
    const currentPath = window.location.pathname;
    const isComponent = currentPath.includes('/components/');
    const isAuthPage = currentPath.includes('signin.html') || currentPath.includes('signup.html');

    // 1. On initial load, if it's a component (not auth), inject the header/footer
    if (isComponent && !isAuthPage) {
        const layout = await getLayout();
        if (layout) {
            const existingHeader = document.querySelector('header');
            const existingCatBar = document.querySelector('.category-bar');
            const existingFooter = document.querySelector('footer');
            
            if (existingHeader) existingHeader.remove();
            if (existingCatBar) existingCatBar.remove();
            if (existingFooter) existingFooter.remove();

            const headerClone = layout.header ? layout.header.cloneNode(true) : null;
            const catBarClone = layout.catBar ? layout.catBar.cloneNode(true) : null;
            const footerClone = layout.footer ? layout.footer.cloneNode(true) : null;

            if (headerClone) fixPathsForSubpage(headerClone);
            if (catBarClone) fixPathsForSubpage(catBarClone);
            if (footerClone) fixPathsForSubpage(footerClone);

            if (footerClone) document.body.appendChild(footerClone);
            // if (catBarClone) document.body.prepend(catBarClone);
            if (headerClone) document.body.prepend(headerClone);
            
            if (layout.styles) {
                layout.styles.forEach(styleNode => {
                    const href = styleNode.getAttribute('href');
                    if (href) {
                        const fixedHref = (!href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) ? '../' + href : href;
                        const exists = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).some(s => s.getAttribute('href') === fixedHref);
                        if (!exists) {
                            const newStyle = styleNode.cloneNode();
                            newStyle.setAttribute('href', fixedHref);
                            document.head.insertBefore(newStyle, document.head.firstChild);
                        }
                    }
                });
            }

            window.MegaMartCart.updateCartCount();
        }
    }

    // 2. Intercept link clicks
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href || link.target === '_blank' || link.href.startsWith('javascript:')) return;
        
        const url = new URL(link.href);
        if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return;

        // Allow normal navigation for auth pages
        if (url.pathname.includes('signin.html') || url.pathname.includes('signup.html')) {
            return; 
        }
        
        const currentIsAuth = window.location.pathname.includes('signin.html') || window.location.pathname.includes('signup.html');
        if (currentIsAuth) {
            return; // If navigating away from auth page, do a hard reload
        }

        e.preventDefault();
        
        if (window.location.pathname === url.pathname && window.location.search === url.search) {
            if (url.hash) {
                const targetEl = document.querySelector(url.hash);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }
        
        window.history.pushState({}, '', url);
        await navigateTo(url.href);
    });

    window.addEventListener('popstate', async () => {
        if (window.location.pathname.includes('signin.html') || window.location.pathname.includes('signup.html')) {
            window.location.reload();
            return;
        }
        await navigateTo(window.location.href);
    });
}

async function navigateTo(url) {
    try {
        const res = await fetch(url);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (doc.title) document.title = doc.title;
        
        // 1. Sync head tags (styles and links)
        const currentHeadTags = document.head.querySelectorAll('style, link');
        currentHeadTags.forEach(tag => tag.remove());
        
        const newHeadTags = doc.head.querySelectorAll('style, link');
        newHeadTags.forEach(tag => document.head.appendChild(tag.cloneNode(true)));
        
        const urlObj = new URL(url);
        const isTargetComponent = urlObj.pathname.includes('/components/');
        const isTargetAuth = urlObj.pathname.includes('signin.html') || urlObj.pathname.includes('signup.html');
        
        if (isTargetComponent && !isTargetAuth) {
            const layout = await getLayout();
            
            const docHeader = doc.querySelector('header');
            const docCatBar = doc.querySelector('.category-bar');
            const docFooter = doc.querySelector('footer');
            if (docHeader) docHeader.remove();
            if (docCatBar) docCatBar.remove();
            if (docFooter) docFooter.remove();

            if (layout) {
                const headerClone = layout.header ? layout.header.cloneNode(true) : null;
                const catBarClone = layout.catBar ? layout.catBar.cloneNode(true) : null;
                const footerClone = layout.footer ? layout.footer.cloneNode(true) : null;

                if (headerClone) fixPathsForSubpage(headerClone);
                if (catBarClone) fixPathsForSubpage(catBarClone);
                if (footerClone) fixPathsForSubpage(footerClone);

                if (footerClone) doc.body.appendChild(footerClone);
                // if (catBarClone) doc.body.prepend(catBarClone);
                if (headerClone) doc.body.prepend(headerClone);
                
                if (layout.styles) {
                    layout.styles.forEach(styleNode => {
                        const href = styleNode.getAttribute('href');
                        if (href) {
                            const fixedHref = (!href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) ? '../' + href : href;
                            const exists = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).some(s => s.getAttribute('href') === fixedHref);
                            if (!exists) {
                                const newStyle = styleNode.cloneNode();
                                newStyle.setAttribute('href', fixedHref);
                                document.head.insertBefore(newStyle, document.head.firstChild);
                            }
                        }
                    });
                }
            }
            document.body.innerHTML = doc.body.innerHTML;
        } else {
            document.body.innerHTML = doc.body.innerHTML;
        }
        
        // Re-run initialization
        initApp();
        executePageScripts(document.body);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error("Navigation error:", err);
        window.location.href = url;
    }
}

function executePageScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const src = oldScript.getAttribute('src') || "";
        if (src.includes('script.js') || src.includes('mobileDrawer.js') || src.includes('bootstrap.bundle.min.js')) {
            return;
        }
        
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        if (oldScript.src) {
            newScript.src = oldScript.src;
        } else {
            newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

/* ==========================================
   5. GLOBAL LOGO & SEARCH LISTENERS
   ========================================== */
function initGlobalNavigationListeners() {
    // 1. Logo Click Navigation
    const logo = document.querySelector('.header-fluid nav .logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        // Clear any inline onclicks
        logo.removeAttribute('onclick');
        
        // Clone and replace to clear existing click handlers if any
        const newLogo = logo.cloneNode(true);
        logo.parentNode.replaceChild(newLogo, logo);
        
        newLogo.addEventListener('click', () => {
            const isSubpage = window.location.pathname.includes('/components/');
            window.location.href = isSubpage ? '../index.html' : 'index.html';
        });
    }

    // 2. Search Navigation
    const searchInput = document.querySelector('.header-fluid nav .search input');
    const searchBtn = document.querySelector('.header-fluid nav .search .search-img');
    
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(searchInput.value.trim());
            }
        });
    }
    
    if (searchBtn && searchInput) {
        searchBtn.style.cursor = 'pointer';
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value.trim());
        });
    }
}

function performSearch(query) {
    if (!query) return;
    const isSubpage = window.location.pathname.includes('/components/');
    const searchUrl = (isSubpage ? '' : 'components/') + `groceries.html?search=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
}
