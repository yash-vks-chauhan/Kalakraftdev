# Admin Section Styling Consistency Fix

## Issue Identified
The "All Orders" admin item was styled differently from the other three admin items in the mobile dashboard, creating visual inconsistency.

## Problem Details
- **All Orders**: Was using `iosMenuItem` class with `iosMenuIcon` (22px icon) and `iosMenuTitle`/`iosMenuSubtitle`
- **Other 3 Items**: Were using `adminAccordionHeader` class with `adminAccordionIcon` (18px icon) and `adminAccordionTitle`/`adminAccordionSubtitle`

This created a visual mismatch where the "All Orders" item looked different from the other admin options.

## Solution Applied
Changed the "All Orders" item to use the same styling classes as the other admin items:

### Before:
```tsx
<Link href="/dashboard/admin/orders" className={styles.iosMenuItem}>
  <div className={styles.iosMenuIcon}>
    <Package size={22} />
  </div>
  <div className={styles.iosMenuContent}>
    <span className={styles.iosMenuTitle}>All Orders</span>
    <span className={styles.iosMenuSubtitle}>Manage customer orders</span>
  </div>
  <ChevronRight size={16} className={styles.iosChevron} />
</Link>
```

### After:
```tsx
<Link href="/dashboard/admin/orders" className={styles.adminAccordionHeader}>
  <div className={styles.adminAccordionIcon}>
    <Package size={18} />
  </div>
  <div className={styles.adminAccordionContent}>
    <span className={styles.adminAccordionTitle}>All Orders</span>
    <span className={styles.adminAccordionSubtitle}>Manage customer orders</span>
  </div>
  <ChevronRight size={14} className={styles.iosChevron} />
</Link>
```

## Changes Made
1. **Class Name**: `iosMenuItem` → `adminAccordionHeader`
2. **Icon Container**: `iosMenuIcon` → `adminAccordionIcon`
3. **Content Container**: `iosMenuContent` → `adminAccordionContent`
4. **Title Style**: `iosMenuTitle` → `adminAccordionTitle`
5. **Subtitle Style**: `iosMenuSubtitle` → `adminAccordionSubtitle`
6. **Icon Size**: `22px` → `18px` (consistent with other admin items)
7. **Chevron Size**: `16px` → `14px` (consistent with other admin items)

## Result
All four admin items now have consistent styling:
- ✅ All Orders
- ✅ Product Management 
- ✅ User Management
- ✅ System Management

They all use the same visual design, spacing, icon sizes, and typography, creating a unified and professional appearance in the admin section.

## Files Modified
- `app/dashboard/MobileDashboardHome.tsx` - Updated "All Orders" item styling

## Impact
- **Visual Consistency**: All admin items now look uniform
- **Professional Appearance**: Maintains design system consistency
- **User Experience**: Reduces visual confusion and improves navigation clarity
