# MedicsCare Design System Page Templates

**Reference templates for consistent page structure across the application**

---

## 📋 Standard Page Structure Template

### **Basic Page Structure**
```html
<ion-content class="[page-name]-page">
  <div class="container">
    <!-- Header Section -->
    <header class="header">
      <h1>Page Title</h1>
      <p class="subtitle">Descriptive subtitle text</p>
    </header>

    <!-- Main Content Card -->
    <div class="main-card">
      <!-- Page content here -->
    </div>

    <!-- Additional Sections -->
    <div class="record-section">
      <h3 class="section-title">Section Title</h3>
      <div class="section-content">
        <!-- Section content -->
      </div>
    </div>
  </div>
</ion-content>
```

### **Detail Item Pattern (MOST IMPORTANT)**
```html
<div class="detail-item">
  <ion-icon name="[icon-name]-outline" class="detail-icon"></ion-icon>
  <div class="detail-content">
    [Main text or component]
  </div>
</div>
```

### **With Doctor Information**
```html
<div class="detail-item">
  <ion-icon name="medical-outline" class="detail-icon"></ion-icon>
  <div class="detail-content">
    <div class="doctor-name">Dr. {{ doctorName }}</div>
    <div class="specialty">{{ specialtyName }}</div>
  </div>
</div>
```

---

## 🎨 Standard SCSS Structure Template

### **SCSS File Header**
```scss
/**
 * MedicsCare [Page Name] Page
 * Professional [description] using the MedicsCare Theme System
 */

// ===================================
// 📱 PAGE COMPONENTS
// ===================================

.page-name-page {
  --padding-top: var(--mc-spacing-2xl);
  --padding-bottom: var(--mc-spacing-2xl);

  // ===================================
  // 📱 CONTAINER LAYOUT
  // ===================================

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--mc-spacing-xl);
  }

  // ===================================
  // 📋 HEADER SECTION
  // ===================================

  .header {
    margin-bottom: var(--mc-spacing-2xl);

    h1 {
      font-size: var(--mc-font-heading-lg);
      font-weight: 600;
      color: var(--mc-text-primary);
      margin: 0 0 var(--mc-spacing-xs) 0;
    }

    .subtitle {
      font-size: var(--mc-font-body-md);
      color: var(--mc-text-secondary);
      margin: 0;
      font-weight: 400;
    }
  }

  // ===================================
  // 📋 MAIN CARD
  // ===================================

  .main-card {
    background: var(--mc-bg-primary);
    border-radius: var(--mc-radius-lg);
    padding: var(--mc-spacing-4) var(--mc-spacing-5);
    box-shadow: var(--mc-shadow-sm);
    margin-bottom: var(--mc-spacing-4);
    animation: fadeInUp 0.4s ease-out;
  }

  // ===================================
  // 📋 DETAIL ITEM PATTERN
  // ===================================

  .detail-item {
    display: flex;
    align-items: flex-start;
    padding: var(--mc-spacing-3) 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--mc-border-primary);
    }

    &:first-child .detail-content {
      font-weight: 600;
      color: var(--mc-text-primary);
    }
  }

  .detail-icon {
    font-size: var(--mc-font-heading-md);
    color: var(--mc-color-primary-500);
    margin-right: var(--mc-spacing-lg);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .detail-content {
    flex: 1;
    line-height: 1.5;
    font-size: var(--mc-font-body-md);
    color: var(--mc-text-primary);

    .doctor-name {
      font-weight: 600;
      margin-bottom: var(--mc-spacing-1);
      color: var(--mc-text-primary);
    }

    .specialty {
      color: var(--mc-text-secondary);
      font-size: var(--mc-font-body-sm);
    }
  }

  // ===================================
  // 📋 SECTION PATTERN
  // ===================================

  .record-section {
    margin-bottom: var(--mc-spacing-4);

    .section-title {
      font-size: var(--mc-font-heading-sm);
      font-weight: 600;
      color: var(--mc-text-primary);
      margin: 0 0 var(--mc-spacing-3) 0;
    }

    .section-content {
      // Section content styles
    }
  }

  // ===================================
  // 📋 EMPTY STATE
  // ===================================

  .empty-state {
    text-align: center;
    padding: var(--mc-spacing-6) var(--mc-spacing-4);
    color: var(--mc-text-secondary);
    animation: fadeInUp 0.5s ease-out;

    .empty-icon {
      font-size: 64px;
      margin-bottom: var(--mc-spacing-4);
      color: var(--mc-color-gray-400);
    }

    p {
      font-size: var(--mc-font-body-md);
      margin: 0 0 var(--mc-spacing-2) 0;
    }
  }

  // ===================================
  // 📋 LOADING STATE
  // ===================================

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    gap: var(--mc-spacing-3);
    animation: fadeIn 0.5s ease-out;

    ion-spinner {
      width: 40px;
      height: 40px;
      --color: var(--mc-color-primary-500);
    }

    .loading-text {
      color: var(--mc-text-secondary);
      font-size: var(--mc-font-body-md);
      font-weight: 500;
      margin: 0;
    }
  }

  // ===================================
  // 📱 RESPONSIVE DESIGN
  // ===================================

  @media (max-width: 600px) {
    .container {
      padding: 0 var(--mc-spacing-md);
    }

    .header h1 {
      font-size: var(--mc-font-heading-md);
    }

    .header .subtitle {
      font-size: var(--mc-font-body-sm);
    }

    .main-card {
      padding: var(--mc-spacing-3) var(--mc-spacing-4);
    }

    .detail-item {
      padding: var(--mc-spacing-2) 0;
    }
  }
}

// ===================================
// 🎬 REQUIRED ANIMATIONS
// ===================================

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

---

## 🎯 Icon Usage Guidelines

### **Always Use Outline Icons**
```html
<!-- ✅ CORRECT -->
<ion-icon name="person-outline"></ion-icon>
<ion-icon name="calendar-outline"></ion-icon>
<ion-icon name="medical-outline"></ion-icon>
<ion-icon name="receipt-outline"></ion-icon>
<ion-icon name="card-outline"></ion-icon>

<!-- ❌ INCORRECT -->
<ion-icon name="person"></ion-icon>
<ion-icon name="calendar"></ion-icon>
<ion-icon name="medical"></ion-icon>
```

### **Icon + Text Pattern**
```html
<div class="detail-item">
  <ion-icon name="icon-outline" class="detail-icon"></ion-icon>
  <div class="detail-content">
    <div class="doctor-name">Dr. John Smith</div>
    <div class="specialty">Cardiology</div>
  </div>
</div>
```

---

## 🎨 Color Usage Guidelines

### **Always Use Theme Variables**
```scss
// ✅ CORRECT
background: var(--mc-bg-primary);
color: var(--mc-text-primary);
border-color: var(--mc-border-primary);
padding: var(--mc-spacing-md);
font-size: var(--mc-font-body-md);

// ❌ INCORRECT
background: #ffffff;
color: #333333;
border-color: #e5e7eb;
padding: 16px;
font-size: 14px;
```

### **Medical Context Colors**
```scss
// Patient Status
background: var(--mc-patient-active-bg);
color: var(--mc-patient-active-text);

// Appointment Status
background: var(--mc-appointment-confirmed-bg);
color: var(--mc-appointment-confirmed-text);

// Bill Status
background: var(--mc-bill-paid-bg);
color: var(--mc-bill-paid-text);
```

---

## 📱 Responsive Design Guidelines

### **Standard Breakpoints**
```scss
// Mobile-first approach
@media (max-width: 600px) {
  // Mobile styles
}

@media (max-width: 768px) {
  // Tablet styles
}

// Desktop is default
```

### **Consistent Spacing**
```scss
// Container padding
.container {
  padding: 0 var(--mc-spacing-xl);  // Desktop

  @media (max-width: 600px) {
    padding: 0 var(--mc-spacing-md);  // Mobile
  }
}
```

---

## ✅ Compliance Checklist

### **HTML Structure**
- [ ] Semantic HTML structure with proper landmarks
- [ ] Consistent `.container` > `.header` > `.main-card` pattern
- [ ] `.detail-item` pattern for all information rows
- [ ] Outline icons with `detail-icon` class
- [ ] Proper empty state with `.empty-state` class
- [ ] Loading state with `.loading-container` class

### **SCSS Structure**
- [ ] File header comment
- [ ] Page class wrapper (`.page-name-page`)
- [ ] Organized section comments with emojis
- [ ] All theme variables (`--mc-*`)
- [ ] Required `fadeInUp` animation
- [ ] Responsive design at 600px breakpoint

### **Content**
- [ ] Doctor names prefixed with "Dr."
- [ ] Specialties in muted color
- [ ] Icons are outline variants
- [ ] Consistent typography hierarchy
- [ ] Professional healthcare-appropriate styling

### **Technical**
- [ ] iOS-safe layout (var(--app-height, 100vh))
- [ ] No hardcoded values
- [ ] Cross-platform compatibility
- [ ] Semantic accessibility
- [ ] Proper ARIA labels where needed