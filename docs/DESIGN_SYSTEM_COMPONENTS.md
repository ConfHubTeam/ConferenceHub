# 🎨 Design System Component Documentation

## 📋 Component Library Overview

This document provides usage examples and guidelines for the Getspace design system components. All components follow SOLID principles and use the new color palette.

---

## 🎨 Color System

### New Design System Colors
```jsx
// Use these semantic color tokens in your components
'bg-primary'        // #F8F9FA - Main background
'bg-card'           // #FFFFFF - Cards/blocks background  
'bg-secondary'      // #FAFAFA - Alternative background

'text-primary'      // #0E1220 - Primary text (logo color)
'text-secondary'    // #5F6373 - Secondary text
'text-muted'        // #9FA4B1 - Disabled/inactive text

'border-light'      // #E2E4E9 - Lines/borders
'border-default'    // #D6D8DD - Default borders

'accent-primary'    // #1D2A50 - Main accent color
'accent-hover'      // #2E3D69 - Hover effects
'accent-highlight'  // #4F6EF7 - Buttons, links, active elements
```

---

## 🧩 Component Usage

### Button Component

```jsx
import { Button, PrimaryButton, AccentButton } from '../ui';

// Standard usage with variants
<Button variant="primary" size="md">Primary Action</Button>
<Button variant="accent" size="lg">Accent Button</Button>
<Button variant="outline" fullWidth>Full Width Outline</Button>

// Shorthand variants (DRY principle)
<PrimaryButton>Primary Action</PrimaryButton>
<AccentButton loading>Loading State</AccentButton>

// With states
<Button variant="success" disabled>Disabled Success</Button>
<Button variant="error" loading>Loading Error</Button>
```

### Card Component

```jsx
import { Card, ElevatedCard } from '../ui';

// Basic usage
<Card variant="default">
  <div className="spacing-card">
    Content here
  </div>
</Card>

// With variants
<ElevatedCard hover={true}>
  <div className="spacing-card">
    Elevated card with hover effect
  </div>
</ElevatedCard>

// Status cards
<Card variant="success" size="lg">
  <div className="spacing-content">
    Success message card
  </div>
</Card>
```

### Input Component

```jsx
import { Input } from '../ui';

// Basic input
<Input 
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  fullWidth
/>

// With validation states
<Input 
  label="Username"
  value={username}
  onChange={handleChange}
  error={errors.username}
  fullWidth
/>

<Input 
  label="Confirmation"
  success="Email verified!"
  disabled
/>
```

### Badge Component

```jsx
import { Badge, SuccessBadge, WarningBadge } from '../ui';

// Status badges
<Badge variant="success">Confirmed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Cancelled</Badge>

// Shorthand variants
<SuccessBadge>Active</SuccessBadge>
<WarningBadge size="lg">Warning</WarningBadge>

// Custom styling
<Badge variant="accent" className="font-bold">
  Featured
</Badge>
```

### Modal Component

```jsx
import { Modal } from '../ui';

<Modal 
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Edit Profile"
  size="md"
>
  <div className="space-y-4">
    <Input label="Name" fullWidth />
    <Input label="Email" type="email" fullWidth />
  </div>
</Modal>
```

### Avatar Component

```jsx
import { Avatar } from '../ui';

// With image
<Avatar 
  src="/path/to/image.jpg"
  alt="John Doe"
  size="md"
/>

// With initials fallback
<Avatar 
  initials="JD"
  alt="John Doe"
  size="lg"
  variant="square"
/>

// Automatic initials from name
<Avatar 
  alt="Jane Smith"
  size="xl"
/>
```

---

## 📐 Layout Components

### PageLayout

```jsx
import { PageLayout } from '../ui';

<PageLayout backgroundVariant="primary">
  {/* Page content with automatic container and spacing */}
</PageLayout>
```

### SectionLayout

```jsx
import { SectionLayout } from '../ui';

<SectionLayout spacing={true}>
  {/* Section content with proper spacing */}
</SectionLayout>
```

### GridLayout

```jsx
import { GridLayout } from '../ui';

// Responsive grid (1 col mobile, 2 tablet, 3 desktop)
<GridLayout columns={3} gap="6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</GridLayout>
```

### FlexLayout

```jsx
import { FlexLayout } from '../ui';

<FlexLayout 
  justify="between" 
  align="center" 
  className="w-full"
>
  <div>Left content</div>
  <div>Right content</div>
</FlexLayout>
```

### StackLayout

```jsx
import { StackLayout } from '../ui';

<StackLayout spacing="6">
  <Card>First item</Card>
  <Card>Second item</Card>
  <Card>Third item</Card>
</StackLayout>
```

---

## 🎯 Usage Patterns

### Standard Page Layout

```jsx
import { PageLayout, SectionLayout, Card, GridLayout } from '../ui';

const MyPage = () => (
  <PageLayout>
    <SectionLayout>
      <Card variant="elevated">
        <div className="spacing-content">
          <h1 className="text-2xl font-semibold text-text-primary mb-6">
            Page Title
          </h1>
          
          <GridLayout columns={3} gap="6">
            {items.map(item => (
              <Card key={item.id} hover>
                <div className="spacing-card">
                  {/* Item content */}
                </div>
              </Card>
            ))}
          </GridLayout>
        </div>
      </Card>
    </SectionLayout>
  </PageLayout>
);
```

### Form Layout

```jsx
import { Card, Input, Button, StackLayout } from '../ui';

const FormExample = () => (
  <Card variant="elevated">
    <div className="spacing-content">
      <h2 className="text-lg font-semibold text-text-primary mb-6">
        Contact Information
      </h2>
      
      <StackLayout spacing="4">
        <Input 
          label="Full Name"
          fullWidth
        />
        <Input 
          label="Email"
          type="email"
          fullWidth
        />
        <Input 
          label="Phone"
          type="tel"
          fullWidth
        />
        
        <div className="flex gap-4 pt-4">
          <Button variant="outline" fullWidth>
            Cancel
          </Button>
          <Button variant="accent" fullWidth>
            Save
          </Button>
        </div>
      </StackLayout>
    </div>
  </Card>
);
```

---

## ✅ Best Practices

### DO ✅
- Use semantic color tokens (`text-primary`, `bg-card`)
- Follow the 8px spacing grid with utility classes
- Use component variants instead of custom styling
- Implement mobile-first responsive design
- Follow SOLID principles in component composition

### DON'T ❌
- Use arbitrary color values (`text-gray-700` instead of `text-text-secondary`)
- Mix spacing systems (stick to `.spacing-*` utilities)
- Override component internals (extend through variants)
- Forget accessibility (labels, focus states, ARIA)
- Break existing functionality when styling

---

## 🔧 Customization

### Extending Components

```jsx
// Create specialized components by extending base ones
const PlaceCard = ({ place, ...props }) => (
  <Card variant="elevated" hover {...props}>
    <div className="spacing-card">
      <h3 className="text-lg font-semibold text-text-primary">
        {place.title}
      </h3>
      {/* Place-specific content */}
    </div>
  </Card>
);
```

### Custom Variants

```jsx
// Add custom variants while maintaining consistency
const CustomButton = (props) => (
  <Button 
    className="bg-gradient-to-r from-accent-primary to-accent-highlight"
    {...props}
  />
);
```

This documentation ensures consistent usage of the design system across the platform while maintaining flexibility for specific use cases.
