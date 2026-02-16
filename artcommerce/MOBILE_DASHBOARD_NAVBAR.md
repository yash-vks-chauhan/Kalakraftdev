# Mobile Dashboard Navbar Implementation Guide

This guide shows how to implement the custom mobile dashboard navbar in your mobile dashboard pages.

## Overview

The `MobileDashboardNavbar` component provides a consistent navigation experience for mobile dashboard views by:
- Removing the logo
- Adding a back button
- Displaying "Dashboard" as the title
- Providing space for right-side content (like action buttons)

## Implementation

### 1. Import the component

```tsx
import MobileDashboardNavbar from '../../../../components/MobileDashboardNavbar'
```

### 2. Use the navbar in your page component

```tsx
return (
  <div className={styles.container}>
    {/* Custom Mobile Navbar */}
    <MobileDashboardNavbar 
      title="Your Page Title"
      backUrl="/dashboard"
      rightContent={
        // Optional: Add buttons or other content to the right
        <button onClick={handleAction} className={styles.actionButton}>
          <FiPlus />
        </button>
      }
    />

    {/* Your page content goes here */}
    {/* ... */}
  </div>
)
```

### 3. Update your CSS

Hide the old header section and adjust spacing:

```css
/* Hide the old header since we're using the navbar */
.header {
  display: none;
}

/* Adjust spacing for the first content section */
.filterSection {
  margin: 20px 20px 24px 20px; /* Add top margin */
}

/* Responsive adjustments */
@media (max-width: 375px) {
  .filterSection {
    margin: 16px 16px 20px 16px;
  }
}
```

## Props

The `MobileDashboardNavbar` component accepts the following props:

- `title: string` - The title to display (will show "Dashboard" in the navbar)
- `showBackButton?: boolean` - Whether to show the back button (default: true)
- `backUrl?: string` - Custom URL to navigate to when back button is pressed
- `rightContent?: React.ReactNode` - Optional content to display on the right side

## Examples

### Basic usage
```tsx
<MobileDashboardNavbar 
  title="User Management"
  backUrl="/dashboard"
/>
```

### With right content
```tsx
<MobileDashboardNavbar 
  title="Products"
  backUrl="/dashboard"
  rightContent={
    <button onClick={handleAddProduct} className={styles.addButton}>
      <FiPlus />
    </button>
  }
/>
```

### Without back button
```tsx
<MobileDashboardNavbar 
  title="Settings"
  showBackButton={false}
/>
```

## Applied Examples

This pattern has been implemented in:
- `/dashboard/admin/users/mobile` - User Management page
- `/dashboard/admin/products/mobile` - Products Management page

Both pages demonstrate the complete implementation including CSS updates and proper spacing adjustments.
