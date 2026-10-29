# MegaMart — Dynamic Vanilla E-Commerce Application

MegaMart is a lightweight, responsive, and fully dynamic e-commerce frontend application built with semantic HTML5, custom Vanilla CSS, and modular JavaScript. 

It features a custom layout hydration system that unifies page navigation and loads subpages dynamically without requiring hard page refreshes, providing a Single Page Application (SPA) feel.

---

## 📂 Recommended Directory Structure

```text
project css - Copy - Copy/
├── index.html                   # Main entry point (Homepage & layout source)
├── style.css                    # Main design system & shared component styles
├── responsive_style.css         # Breakpoint definitions for tablet/mobile viewports
├── script.js                    # Core layout engine, SPA router, & cart system
├── js/
│   └── mobileDrawer.js          # Dynamic mobile menu drawer component
├── css/
│   └── pages-enhanced.css       # Layout styles for cart and checkout grids
├── img/                         # Application asset directory
│   ├── download.svg             # Brand Logo
│   ├── Search.png               # Search icons
│   ├── user.png                 # User profile icons
│   ├── Buy.png                  # Cart bag icons
│   └── [products...]            # Product images (mobile1.png, mobile2.png, etc.)
└── components/                  # Subpages & category listings
    ├── about.html               # About page
    ├── contact.html             # FAQs & Contact Us
    ├── signin.html              # Sign-In auth page
    ├── signup.html              # Sign-Up auth page
    ├── groceries.html           # Live search & grocery listings
    ├── food.html                # Premium organic listing
    ├── [categories...]          # Category lists (watches.html, mobile.html, etc.)
    ├── [brands...]              # Brand showcases (iphonebrand.html, xaiomibrand.html)
    └── [details...]             # Product detail views (m13.html, s23.html, etc.)
```

---

## ⚡ Core Architecture & Engineering Features

### 1. Reusable Layout Hydration (SPA Engine)
- Instead of duplicating header/footer markup on every HTML file, the system dynamically fetches the homepage layout ([index.html](file:///d:/Easyskill%20academy/CSS/project%20css%20-%20Copy%20-%20Copy/index.html)) at runtime.
- It parses the global navbar, category drawers, and footer blocks, resolves asset paths relatively (`../` relative correction), and injects them onto the subpage body.

### 2. Page-Specific Script Execution
To support custom DOM event binding on SPA navigation:
- `executePageScripts()` reads script tags from navigated pages.
- It dynamically recreates and runs page-specific scripts to activate lists, filters, and forms.
- It filters out globally loaded scripts (`script.js`, `mobileDrawer.js`, `bootstrap.bundle.min.js`) to prevent duplicate initialization.

### 3. Duplicate Listener & Memory Leak Prevention
- **Cart System**: A state manager tracks cart counts globally. Global click event delegation is attached only once on application startup using `isCartInitialized` guards.
- **Mobile Navigation Drawer**: Binds slide triggers and handles escape key dismissals on the `window` object exactly once using `window.mobileDrawerEscListenerAdded` conditional locks.

### 4. Dynamic URL Query Routing
- Navigation links and search controls automatically forward keyword parameters (e.g. `groceries.html?search=Premium`).
- Listing pages parse search queries, sort parameters, and category parameters directly on page load to display instant filtered listings.

---

## 🚀 Getting Started

1. **Deploying locally**:
   Since the application uses `fetch()` APIs to share header/footer layouts, it must be run on a local HTTP server to prevent security CORS restrictions.
   
   Run any local server in the root directory:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node (npx)
   npx http-server -p 8000
   ```
   Open `http://localhost:8000` in your web browser.

2. **Creating New Pages**:
   To add a page in the future, link [style.css](file:///d:/Easyskill%20academy/CSS/project%20css%20-%20Copy%20-%20Copy/style.css), [responsive_style.css](file:///d:/Easyskill%20academy/CSS/project%20css%20-%20Copy%20-%20Copy/responsive_style.css), and [script.js](file:///d:/Easyskill%20academy/CSS/project%20css%20-%20Copy%20-%20Copy/script.js). The layout engine will automatically load headers, footers, search, and mobile drawers seamlessly!
