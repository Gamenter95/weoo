# WeooWallet Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from leading Indian fintech apps (Paytm, PhonePe, Google Pay) with emphasis on trust, security, and simplicity. This is a utility-focused financial application where clarity and security visual cues are paramount.

## Core Design Principles
1. **Security First**: Visual indicators of secure actions (S-PIN entry, authentication)
2. **Minimal Cognitive Load**: Clean, uncluttered interfaces focusing on single actions
3. **Trust & Professionalism**: Polished, reliable aesthetics appropriate for financial transactions
4. **Mobile-First**: Optimized primarily for mobile devices with desktop support

---

## Typography

**Font Family**: 
- Primary: Inter or Poppins (modern, clean, excellent readability for numbers)
- Monospace: JetBrains Mono (for WWID, S-PIN displays)

**Hierarchy**:
- Page Titles: text-2xl md:text-3xl, font-bold
- Balance Display: text-5xl md:text-6xl, font-bold (dashboard ₹ amount)
- Section Headers: text-xl, font-semibold
- Body Text: text-base, font-normal
- Labels: text-sm, font-medium, uppercase tracking-wide
- Input Fields: text-base
- WWID/Codes: text-lg, font-mono

---

## Layout System

**Spacing Units**: Tailwind units of 3, 4, 6, 8, 12, 16
- Tight spacing: p-3, gap-3
- Standard spacing: p-4, gap-4, mb-6
- Generous spacing: p-8, gap-8, mb-12
- Section spacing: py-12 md:py-16

**Container Strategy**:
- Auth pages: max-w-md mx-auto (centered cards)
- Dashboard: Full width with safe padding (px-4 md:px-6)
- Forms: max-w-sm mx-auto

**Grid System**: Minimal grid usage; primarily single-column stacked layouts for clarity

---

## Component Library

### Authentication Screens (Register/Login)

**Registration Flow**:
1. **Initial Registration Card**
   - Centered card with subtle shadow (shadow-lg)
   - Logo at top (h-12 mb-8)
   - Form fields with floating labels or top-aligned labels
   - Input fields: rounded-lg, border-2, py-3 px-4, focus states with ring
   - Submit button: Full width, rounded-lg, py-3, font-semibold
   - Link to login at bottom

2. **WWID Creation Screen**
   - Large icon/illustration at top (mb-6)
   - Explanation text: "Create your unique WeooWallet ID"
   - Input with @ww suffix visually attached (input-group style)
   - Example shown: "e.g., yourname@ww"
   - Real-time validation indicator (checkmark/cross icon)

3. **S-PIN Setup Screen**
   - Security icon at top
   - Title: "Create 4-Digit Security PIN"
   - 4 individual boxes for PIN digits (w-14 h-14, text-2xl, rounded-lg)
   - Boxes auto-advance on input
   - "Re-enter S-PIN" confirmation step
   - Security tips in small text below

**Login Flow**:
1. **Login Screen**
   - Similar card layout to registration
   - Single input accepting username OR phone
   - Password field with show/hide toggle
   - "Forgot Password?" link (text-sm)
   
2. **S-PIN Verification Screen**
   - Minimal screen with centered content
   - User identifier shown at top (Welcome back, @username)
   - 4-digit PIN entry (same boxes as setup)
   - "Forgot S-PIN?" link below

### Dashboard

**Header**:
- Fixed at top, subtle shadow or border-bottom
- Hamburger icon (left, p-3, tap target 44x44px)
- "WeooWallet" text (center or left after hamburger, font-bold)
- Height: h-16

**Main Content Area**:
- Centered vertically and horizontally
- Large balance display: "₹0" (text-6xl, font-bold, mb-2)
- Subtle text below: "Available Balance" (text-sm, opacity-70)

**Bottom Navigation Bar**:
- Fixed at bottom (fixed bottom-0)
- 3 equally spaced icon buttons in flex layout
- Each button: Circular or rounded-xl container (w-16 h-16)
- Icons: Clear, bold stroke (stroke-width-2)
  - Add Fund: Plus icon
  - Pay to User: Arrow-right or send icon  
  - Withdraw: Arrow-down or withdraw icon
- Labels below icons (text-xs, mt-1)
- Active tap states with subtle scale

**Hamburger Menu (Slide-out)**:
- Full-height overlay from left
- Width: w-80 max on desktop, w-4/5 on mobile
- Navigation items in vertical list:
  - Each item: py-4 px-6, flex with icon + text
  - Icons left-aligned (mr-4)
  - Hover/active states with background change
  - Divider between sections
- Logout at bottom with distinctive styling (border-top)

### Form Elements

**Input Fields**:
- Height: h-12
- Rounded: rounded-lg
- Border: border-2, focus:ring-2
- Padding: px-4
- Placeholder: opacity-50

**Buttons**:
- Primary: Full width or auto, rounded-lg, py-3 px-6, font-semibold
- Secondary: Same size, bordered style
- Icon buttons: w-12 h-12 minimum, rounded-full or rounded-lg
- All buttons: Active states with slight scale (active:scale-95)

**PIN Entry Boxes**:
- 4 boxes in flex row (gap-3 or gap-4)
- Each: w-14 h-14, text-center, text-2xl, rounded-lg, border-2
- Active box: distinct border/ring
- Type: number, maxLength: 1

---

## Key Screens Structure

**Registration**: Multi-step wizard feel with progress indicators (optional dots at top)

**Dashboard**: Minimal centered design, 60% vertical space for balance, 20% header, 20% bottom nav

**Menu**: Slide-in from left with backdrop overlay (bg-black/50)

---

## Interaction Patterns

**Navigation**: 
- No page reloads; smooth transitions between screens
- Back buttons where appropriate (top-left)
- Bottom nav persists on main screens

**Feedback**:
- Loading states: Spinner or skeleton screens
- Success: Green checkmark with message
- Error: Red alert with clear message
- Toast notifications for quick feedback (top-right, slide-in)

**Animations**: 
- Minimal and purposeful
- Slide-in for menu (300ms ease-out)
- Fade for modals (200ms)
- Button press: scale transform (100ms)
- NO balance animations or excessive motion

---

## Security Visual Cues

- S-PIN screens: Lock/shield icons prominently displayed
- Sensitive inputs: Eye icon for password visibility toggle
- Secure badge/indicator near sensitive operations
- Password strength indicator on registration (color bar)

---

## Responsive Behavior

**Mobile (default)**:
- Single column layouts
- Full-width buttons
- Bottom navigation visible
- Larger tap targets (min 44x44px)

**Desktop (md: and up)**:
- Centered auth cards (max-w-md)
- Dashboard stays mobile-like or slightly wider (max-w-lg centered)
- Hamburger menu stays or converts to sidebar (optional)

---

## Accessibility

- All interactive elements keyboard accessible
- Focus visible rings on all inputs/buttons
- ARIA labels on icon-only buttons
- Sufficient contrast ratios for all text
- Screen reader friendly form labels
- Error messages associated with inputs