# 🏆 The Ultimate Shadcn UI Master Reference & Responsive Catalog

Welcome to the complete, self-contained **Shadcn UI & Tailwind CSS Blueprint Manual**. This guide serves as an absolute reference manual for all core Shadcn UI components, utilities, and configurations. For each component, you will find its **installation command**, a **clean React/TSX blueprint**, its **desktop vs. mobile responsive adaptation**, and **accessibility rules**.

---

## 🧭 Master Navigation Index
1. [🎨 Core Design System & Configuration](#-core-design-system--configuration)
2. [⚙️ Shadcn UI CLI Initialization Prompt Options](#%EF%B8%8F-shadcn-ui-cli-initialization-prompt-options)
3. [🔌 Core Tailwind Helper: `lib/utils.ts`](#-core-tailwind-helper-libutilsts)
4. [🌓 Dark Mode Setup: ThemeProvider & ThemeToggle](#-dark-mode-setup-themeprovider--themetoggle)
5. [✍️ Interactive Inputs & Form Components](#%EF%B8%8F-interactive-inputs--form-components)
   - *Button, Input, Textarea, Label, Select, Switch, Checkbox, Radio Group, Slider, Calendar, Combobox, Toggle & Toggle Group, Form*
6. [💬 Dialogs, Overlays & Drawers](#-dialogs-overlays--drawers)
   - *Dialog, Drawer, Sheet, Popover, Tooltip, Hover Card, Alert Dialog*
7. [🧭 Navigation, Menus & Tabs](#-navigation-menus--tabs)
   - *Navigation Menu, Dropdown Menu, Menubar, Tabs, Breadcrumb, Pagination*
8. [📊 Data Display, Lists & Progress](#-data-display-lists--progress)
   - *Table, Badge, Avatar, Progress, Scroll Area, Separator, Skeleton, Alert, Carousel*
9. [📦 Structural Layout & Containers](#-structural-layout--containers)
   - *Card, Aspect Ratio, Resizable, Collapsible*
10. [🔔 Toasts & Notifications](#-toasts--notifications)
    - *Toast, Sonner*
11. [📝 Shadcn UI Typographic System Cheatsheet](#-shadcn-ui-typographic-system-cheatsheet)
12. [📲 Responsive Layout & Touch Target Cheatsheet](#-responsive-layout--touch-target-cheatsheet)

---

## 🎨 Core Design System & Configuration

### A. Color Tokens Setup (`frontend/app/globals.css`)
This setup uses a professional slate, deep indigo, and emerald accent system.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;      /* Slate 50 tint */
    --foreground: 222.2 84% 4.9%;   /* Slate 950 */
    --card: 0 0% 100%;              /* White */
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 262.1 83.3% 57.8%;  /* Indigo 500 */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;    /* Light Gray */
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 262.1 83.3% 95%;     /* Indigo tint */
    --accent-foreground: 262.1 83.3% 40%;
    --destructive: 0 84.2% 60.2%;   /* Rose Red */
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 262.1 83.3% 57.8%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;   /* Midnight Slate */
    --foreground: 210 40% 98%;
    --card: 222.2 84% 7%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 6%;
    --popover-foreground: 210 40% 98%;
    --primary: 263.4 90% 64.3%;     /* Bright Purple-Indigo */
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 262.1 83.3% 15%;
    --accent-foreground: 263.4 90% 75%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 263.4 90% 64.3%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground antialiased; }
}
```

### B. Tailwind Dynamic Config (`tailwind.config.ts`)
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

---

## ⚙️ Shadcn UI CLI Initialization Prompt Options

When setting up a blank project or configuring Shadcn UI for the first time, run the standard initializer command in your terminal:

```bash
npx shadcn@latest init
```

To configure an optimized **Next.js App Router Setup** using dynamic CSS variables, select these answers in the interactive prompt:

```text
✔ Would you like to use TypeScript? … Yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? … app/globals.css
✔ Would you like to use CSS variables for colors? … Yes
✔ Are you using a custom tailwind.config.ts? … Yes
✔ Where is your tailwind.config.ts located? … tailwind.config.ts
✔ Configure the import alias for components: … @/components
✔ Configure the import alias for utils: … @/lib/utils
✔ Are you using React Server Components? … Yes
✔ Write configuration to components.json? … Yes
```

---

## 🔌 Core Tailwind Helper: `lib/utils.ts`

Every core Shadcn UI component uses a utility helper to merge Tailwind styles dynamically without stylesheet class collisions. Create the following utility file at `lib/utils.ts` (or `frontend/lib/utils.ts` depending on your directory structure):

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple ClassNames, resolves conditional styling branches,
 * and merges conflicting Tailwind classes using dynamic tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
*Make sure to install dependencies first:* `npm install clsx tailwind-merge`

---

## 🌓 Dark Mode Setup: ThemeProvider & ThemeToggle

To let users transition between the light and dark HSL variables defined in `globals.css`, install `next-themes` and create a global ThemeProvider wrapper and dynamic toggle button.

### 1. Install Next-Themes
```bash
npm install next-themes
```

### 2. Create the Theme Provider wrapper (`components/theme-provider.tsx`)
```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 3. Wrap your root layout (`app/layout.tsx`)
```tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 4. Create an Animated Theme Toggle Button (`components/ThemeToggle.tsx`)
This button smoothly switches between Light, Dark, and System settings, rotating the icon on trigger.
```tsx
"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 flex items-center justify-center rounded-lg border hover:bg-accent focus-visible:ring-2" aria-label="Toggle visual theme">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-1 border rounded-xl bg-card shadow-lg">
        <DropdownMenuItem onClick={() => setTheme("light")} className="py-2 px-3 flex gap-2 cursor-pointer rounded-lg hover:bg-accent text-sm">
          <Sun className="h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="py-2 px-3 flex gap-2 cursor-pointer rounded-lg hover:bg-accent text-sm">
          <Moon className="h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="py-2 px-3 flex gap-2 cursor-pointer rounded-lg hover:bg-accent text-sm">
          <Laptop className="h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## ✍️ Interactive Inputs & Form Components

### 1. Button
* **CLI Command**: `npx shadcn@latest add button`
* **Desktop / Mobile Guidelines**: Use `h-10 px-4` for desktop, expand to `h-12 w-full` on mobile forms to satisfy the $\ge 44\text{px}$ touch target standard.
* **Blueprint**:
```tsx
import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button variant="default" className="shadow-sm">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost Trigger</Button>
    </div>
  )
}
```

### 2. Input
* **CLI Command**: `npx shadcn@latest add input`
* **Desktop / Mobile Guidelines**: Add `text-base` (not `text-sm`) inside mobile CSS inputs. iOS Safari auto-zooms pages if input fonts are smaller than `16px`, which breaks layout sizing.
* **Blueprint**:
```tsx
import { Input } from "@/components/ui/input"

export function InputDemo() {
  return <Input type="email" placeholder="Enter email (e.g. yash@domain.com)" className="text-base sm:text-sm" />
}
```

### 3. Textarea
* **CLI Command**: `npx shadcn@latest add textarea`
* **Desktop / Mobile Guidelines**: Limit width using grid sizing. On mobile, ensure `min-h-[120px]` so input content is easily readable without constant scrolling.
* **Blueprint**:
```tsx
import { Textarea } from "@/components/ui/textarea"

export function TextareaDemo() {
  return <Textarea placeholder="Type your audit context..." className="min-h-[120px] text-base sm:text-sm" />
}
```

### 4. Label
* **CLI Command**: `npx shadcn@latest add label`
* **Desktop / Mobile Guidelines**: Couple labels explicitly with form triggers using `htmlFor` and unique IDs.
* **Blueprint**:
```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function LabelDemo() {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="client-id">Client Reference Number</Label>
      <Input id="client-id" placeholder="ID-4820" />
    </div>
  )
}
```

### 5. Select
* **CLI Command**: `npx shadcn@latest add select`
* **Desktop / Mobile Guidelines**: Popovers dynamically fit viewports. On mobile, ensure select items have sufficient height (`py-3`) for thumb selectors.
* **Blueprint**:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger className="w-full sm:w-[200px] h-11 sm:h-10">
        <SelectValue placeholder="Select Model Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="deterministic" className="py-3 sm:py-2">Deterministic Harness</SelectItem>
        <SelectItem value="stochastic" className="py-3 sm:py-2">Standard LLM RAG</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### 6. Switch
* **CLI Command**: `npx shadcn@latest add switch`
* **Desktop / Mobile Guidelines**: Use flexible row layouts (`flex items-center justify-between`) with a labels side. Keep the switch on the right side for easy thumb tapping on mobile.
* **Blueprint**:
```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function SwitchDemo() {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border rounded-xl bg-card">
      <div className="grid gap-0.5">
        <Label htmlFor="strict-mode">Enforce 100% Provenance</Label>
        <span className="text-xs text-muted-foreground">Refuse requests missing document bounds.</span>
      </div>
      <Switch id="strict-mode" />
    </div>
  )
}
```

### 7. Checkbox
* **CLI Command**: `npx shadcn@latest add checkbox`
* **Desktop / Mobile Guidelines**: Maintain a min `44x44px` interactive touch padding around the label and checkbox.
* **Blueprint**:
```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function CheckboxDemo() {
  return (
    <div className="flex items-start gap-3 p-2">
      <Checkbox id="terms" className="h-5 w-5 mt-0.5" />
      <Label htmlFor="terms" className="leading-snug font-medium cursor-pointer">
        Agree to deterministic compliance logging rules
      </Label>
    </div>
  )
}
```

### 8. Radio Group
* **CLI Command**: `npx shadcn@latest add radio-group`
* **Desktop / Mobile Guidelines**: Display radio fields vertically (`flex flex-col`) on mobile to avoid row truncation.
* **Blueprint**:
```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="low-risk" className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center gap-2 border p-3 rounded-lg flex-1">
        <RadioGroupItem value="low-risk" id="r1" className="h-5 w-5" />
        <Label htmlFor="r1" className="cursor-pointer">Low-Risk Wealth Plan</Label>
      </div>
      <div className="flex items-center gap-2 border p-3 rounded-lg flex-1">
        <RadioGroupItem value="high-growth" id="r2" className="h-5 w-5" />
        <Label htmlFor="r2" className="cursor-pointer">Aggressive Growth Strategy</Label>
      </div>
    </RadioGroup>
  )
}
```

### 9. Slider
* **CLI Command**: `npx shadcn@latest add slider`
* **Desktop / Mobile Guidelines**: Ensure slider tracks have highly visible, high-contrast borders and handles that are large enough for thumb manipulation.
* **Blueprint**:
```tsx
import { Slider } from "@/components/ui/slider"

export function SliderDemo() {
  return (
    <div className="space-y-2 p-4">
      <span className="text-sm font-semibold">Model Temperature Range: 0.0</span>
      <Slider defaultValue={[0]} max={1} step={0.1} className="w-full h-8" />
    </div>
  )
}
```

### 10. Calendar
* **CLI Command**: `npx shadcn@latest add calendar`
* **Desktop / Mobile Guidelines**: Calendar elements take up significant visual space. On mobile, wrap calendar elements within dynamic dropdowns, drawers, or dialog popovers.
* **Blueprint**:
```tsx
"use client"
import * as React from "react"
import { Calendar } from "@/components/ui/calendar"

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <div className="border rounded-xl p-3 bg-card w-fit mx-auto shadow-sm">
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
    </div>
  )
}
```

### 11. Combobox
* **CLI Command**: Built by combining `popover` and `command` packages.
* **Desktop / Mobile Guidelines**: Reflows list results on screen. On mobile, render a full-screen drawer or select interface instead of a floating dropdown.
* **Blueprint**:
```tsx
"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const frameworks = [{ value: "advisor", label: "Wealth Advisor" }, { value: "audit", label: "Audit Ledger" }]

export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-[200px] justify-between h-11 sm:h-10">
          {value ? frameworks.find((f) => f.value === value)?.label : "Select agent..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search system..." className="h-11 sm:h-9" />
          <CommandList>
            <CommandEmpty>No agent matches.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((f) => (
                <CommandItem
                  key={f.value}
                  value={f.value}
                  onSelect={(cur) => {
                    setValue(cur === value ? "" : cur)
                    setOpen(false)
                  }}
                  className="py-3 sm:py-2"
                >
                  <Check className={`mr-2 h-4 w-4 ${value === f.value ? "opacity-100" : "opacity-0"}`} />
                  {f.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### 12. Toggle & Toggle Group
* **CLI Command**: `npx shadcn@latest add toggle toggle-group`
* **Desktop / Mobile Guidelines**: Use inside toolbars or layouts. Ensure active states have high HSL contrast against inactive elements.
* **Blueprint**:
```tsx
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Bold, Italic } from "lucide-react"

export function ToggleDemo() {
  return (
    <div className="flex gap-4 p-2 items-center bg-card border rounded-lg w-fit">
      <Toggle aria-label="Toggle bold"><Bold className="h-4 w-4" /></Toggle>

      <ToggleGroup type="multiple">
        <ToggleGroupItem value="bold" aria-label="Toggle bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
```

### 13. Form (Form Validation)
* **CLI Command**: `npx shadcn@latest add form`
* **Desktop / Mobile Guidelines**: Integrates `react-hook-form` and `zod` for client-side forms. Ensure errors are announced dynamically to screen readers using ARIA labels.
* **Blueprint**:
```tsx
"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  username: z.string().min(2, { message: "Name must be at least 2 characters." }),
})

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Submitting form: ", values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Agent Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g. Yash" {...field} className="h-11 sm:h-10 text-base sm:text-sm" />
              </FormControl>
              <FormDescription>This identifier appears on audit trails.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10">Save Configuration</Button>
      </form>
    </Form>
  )
}
```

---

## 💬 Dialogs, Overlays & Drawers

### 1. Dialog
* **CLI Command**: `npx shadcn@latest add dialog`
* **Desktop / Mobile Guidelines**: Reflow layouts for smaller viewports. Tapping triggers outside the popover window dismisses the overlay automatically.
* **Blueprint**:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Audit Trail Details</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>Audit Session ID #1092</DialogTitle>
          <DialogDescription>
            This ledger contains retrieved nodes and exact cosine similarities.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm text-muted-foreground leading-relaxed">
          The vector lookup returned 3 compliance nodes. System verified source limits strictly.
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 2. Drawer
* **CLI Command**: `npx shadcn@latest add drawer`
* **Desktop / Mobile Guidelines**: Use **Drawers** as the default bottom sheet popup container on mobile devices. Slide-overs from the bottom provide superior ease-of-use for one-handed phone users.
* **Blueprint**:
```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="md:hidden">Adjust Configuration</Button>
      </DrawerTrigger>
      <DrawerContent className="px-4">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Compliance Parameters</DrawerTitle>
            <DrawerDescription>Adjust precision levels.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
             Sliders and options go here.
          </div>
          <DrawerFooter className="pt-4 flex flex-col gap-2">
            <Button className="h-12">Save Configuration</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-12">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
```

### 3. Sheet
* **CLI Command**: `npx shadcn@latest add sheet`
* **Desktop / Mobile Guidelines**: Sheets are slide-out panels typically used for sidebars. Use `side="left"` for primary mobile navigation grids, and `side="right"` for secondary utility drawers.
* **Blueprint**:
```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open Sidebar Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>GlassBox Navigation</SheetTitle>
          <SheetDescription>Navigate auditable sections.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 py-6 font-semibold">
          <a href="#" className="p-2 hover:bg-accent rounded-lg">Home Advisor</a>
          <a href="#" className="p-2 hover:bg-accent rounded-lg">Risk Dashboard</a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### 4. Popover
* **CLI Command**: `npx shadcn@latest add popover`
* **Desktop / Mobile Guidelines**: Popovers display quick options on hover/click. Add `w-screen sm:w-80` to dynamically fit small phone viewports.
* **Blueprint**:
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">View Meta Information</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] sm:w-80 p-4 rounded-xl shadow-lg border">
        <h4 className="font-semibold leading-none">Provenance Node #8</h4>
        <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
          Similarity Score: 0.942 | Temperature Constraint: strict
        </p>
      </PopoverContent>
    </Popover>
  )
}
```

### 5. Tooltip
* **CLI Command**: `npx shadcn@latest add tooltip`
* **Desktop / Mobile Guidelines**: Avoid relying *exclusively* on tooltips to show critical information. Tooltips are highly inaccessible to touch-only devices since they lack hover controls.
* **Blueprint**:
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-sm font-semibold border-b border-dashed border-muted-foreground pb-0.5">
          Deterministic Playback
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground border shadow-md p-2 max-w-xs text-xs rounded-md">
          Guarantees that re-running identical queries yields identical citations.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### 6. Hover Card
* **CLI Command**: `npx shadcn@latest add hover-card`
* **Desktop / Mobile Guidelines**: Similar to tooltips, hover cards display additional context on hover. Hide these components on mobile screens, or transform them to trigger on tap (`Dialog`).
* **Blueprint**:
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger className="underline cursor-pointer">@GlassBoxAgent</HoverCardTrigger>
      <HoverCardContent className="w-80 p-4 border rounded-xl shadow-lg bg-card">
        <h5 className="font-bold text-sm">Verified Audit Bot</h5>
        <p className="text-xs text-muted-foreground mt-1 leading-normal">
          Operates live 24/7 scanning active brokerage compliance logs for ground-truth deviations.
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}
```

### 7. Alert Dialog
* **CLI Command**: `npx shadcn@latest add alert-dialog`
* **Desktop / Mobile Guidelines**: Prompts users to confirm destructive actions. Make action triggers visually distinct, and place the 'Cancel' control on the left side of the prompt.
* **Blueprint**:
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Purge Audit Log</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] sm:max-w-[425px] rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. It permanently deletes all audit history files from the active host volume.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel className="h-11 sm:h-10">Cancel Action</AlertDialogCancel>
          <AlertDialogAction className="h-11 sm:h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 🧭 Navigation, Menus & Tabs

### 1. Navigation Menu
* **CLI Command**: `npx shadcn@latest add navigation-menu`
* **Desktop / Mobile Guidelines**: Perfect for complex desktop header links. Always hide this navbar component on mobile, replacing it with a collapsible slide-out sidebar or `Sheet`.
* **Blueprint**:
```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export function NavigationMenuDemo() {
  return (
    <NavigationMenu className="hidden lg:block">
      <NavigationMenuList className="flex gap-4">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-semibold">Resources</NavigationMenuTrigger>
          <NavigationMenuContent className="p-4 border rounded-xl w-64 bg-card shadow-lg flex flex-col gap-2">
            <NavigationMenuLink href="#" className="p-2 hover:bg-accent rounded-md block text-sm">
              Vector Database Settings
            </NavigationMenuLink>
            <NavigationMenuLink href="#" className="p-2 hover:bg-accent rounded-md block text-sm">
              Model Playback Logs
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

### 2. Dropdown Menu
* **CLI Command**: `npx shadcn@latest add dropdown-menu`
* **Desktop / Mobile Guidelines**: Use dropdowns for secondary header menus or quick actions. Ensure dropdown options are spaced out (`py-3`) on mobile for easy tap selection.
* **Blueprint**:
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Manage Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-1.5 border rounded-xl shadow-lg bg-card">
        <DropdownMenuLabel>Compliance Officer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-2.5 sm:py-2">Active Sessions</DropdownMenuItem>
        <DropdownMenuItem className="py-2.5 sm:py-2 text-destructive focus:bg-destructive/10">Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 3. Menubar
* **CLI Command**: `npx shadcn@latest add menubar`
* **Desktop / Mobile Guidelines**: Ideal for complex web apps (e.g. mock code editors). On mobile, replace this with a nested popup menu inside a mobile sheet.
* **Blueprint**:
```tsx
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"

export function MenubarDemo() {
  return (
    <Menubar className="border rounded-lg p-1.5 flex gap-1 w-fit">
      <MenubarMenu>
        <MenubarTrigger className="px-3 py-1 font-semibold text-sm rounded cursor-pointer">File</MenubarTrigger>
        <MenubarContent className="p-1 border rounded-lg bg-card shadow-md">
          <MenubarItem>New Session</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Export Ledger</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
```

### 4. Tabs
* **CLI Command**: `npx shadcn@latest add tabs`
* **Desktop / Mobile Guidelines**: On mobile screens, set the tab triggers list to scroll horizontally (`overflow-x-auto`) to prevent labels from compressing or wrapping onto multiple lines.
* **Blueprint**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TabsDemo() {
  return (
    <Tabs defaultValue="visual" className="w-full">
      {/* Scrollable list container on mobile */}
      <TabsList className="w-full flex justify-start overflow-x-auto scrollbar-none border-b rounded-none bg-transparent gap-6 p-0 h-12">
        <TabsTrigger
          value="visual"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm font-semibold whitespace-nowrap"
        >
          Visual Analytics
        </TabsTrigger>
        <TabsTrigger
          value="raw-json"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm font-semibold whitespace-nowrap"
        >
          Raw JSON Trace
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visual" className="py-4 text-sm leading-relaxed text-muted-foreground">
        Visual charts render here.
      </TabsContent>
      <TabsContent value="raw-json" className="py-4 text-sm leading-relaxed text-muted-foreground">
        JSON traces render here.
      </TabsContent>
    </Tabs>
  )
}
```

### 5. Breadcrumb
* **CLI Command**: `npx shadcn@latest add breadcrumb`
* **Desktop / Mobile Guidelines**: Perfect for deeply-nested directories. On mobile screens, truncate middle items dynamically inside an ellipsis menu to save horizontal space.
* **Blueprint**:
```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function BreadcrumbDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Audit Playback</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

### 6. Pagination
* **CLI Command**: `npx shadcn@latest add pagination`
* **Desktop / Mobile Guidelines**: Avoid rendering too many visible page index buttons on mobile viewports. On smaller screens, simplify pagination to standard 'Previous' and 'Next' button links.
* **Blueprint**:
```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function PaginationDemo() {
  return (
    <Pagination className="py-4">
      <PaginationContent className="flex gap-1 justify-center items-center">
        <PaginationItem>
          <PaginationPrevious href="#" className="h-10 px-3 flex items-center justify-center border rounded" />
        </PaginationItem>
        {/* Render page numbers only on desktop */}
        <PaginationItem className="hidden sm:inline-block">
          <PaginationLink href="#" isActive className="h-10 w-10 flex items-center justify-center border rounded bg-primary text-primary-foreground">1</PaginationLink>
        </PaginationItem>
        <PaginationItem className="hidden sm:inline-block">
          <PaginationLink href="#" className="h-10 w-10 flex items-center justify-center border rounded">2</PaginationLink>
        </PaginationItem>
        <PaginationItem className="hidden sm:inline-block">
          <PaginationEllipsis className="h-10 w-10 flex items-center justify-center" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" className="h-10 px-3 flex items-center justify-center border rounded" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

---

## 📊 Data Display, Lists & Progress

### 1. Table
* **CLI Command**: `npx shadcn@latest add table`
* **Desktop / Mobile Guidelines**: Wrap data tables in responsive containers (`w-full overflow-x-auto block`) to allow horizontal scrolling on mobile viewports without breaking page boundaries.
* **Blueprint**:
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TableDemo() {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold py-3 px-4">Session Hash</TableHead>
            <TableHead className="font-semibold py-3 px-4">Total Tokens</TableHead>
            <TableHead className="font-semibold py-3 px-4 text-right">Integrity Verification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-muted/30">
            <TableCell className="font-mono py-3 px-4">sha256-829d</TableCell>
            <TableCell className="py-3 px-4">1,402</TableCell>
            <TableCell className="text-right py-3 px-4 font-semibold text-emerald-500">Verified</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
```

### 2. Badge
* **CLI Command**: `npx shadcn@latest add badge`
* **Desktop / Mobile Guidelines**: Use badges for metadata tags. Ensure text remains on a single line (`whitespace-nowrap`) and matches standard light/dark modes.
* **Blueprint**:
```tsx
import { Badge } from "@/components/ui/badge"

export function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <Badge variant="default">Verified Grounded</Badge>
      <Badge variant="secondary">RAG Active</Badge>
      <Badge variant="destructive" className="bg-destructive/15 text-destructive border-transparent">Deviation Alert</Badge>
    </div>
  )
}
```

### 3. Avatar
* **CLI Command**: `npx shadcn@latest add avatar`
* **Desktop / Mobile Guidelines**: Use avatars for profiles. Ensure you provide high-contrast initials as a fallback in case image loads fail.
* **Blueprint**:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AvatarDemo() {
  return (
    <Avatar className="h-10 w-10 border shadow-sm rounded-full overflow-hidden">
      <AvatarImage src="https://github.com/shadcn.png" alt="User profile avatar" />
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center h-full w-full">
        YC
      </AvatarFallback>
    </Avatar>
  )
}
```

### 4. Progress
* **CLI Command**: `npx shadcn@latest add progress`
* **Desktop / Mobile Guidelines**: Visually communicates operation completion status. Keep progress bars clear, and complement them with text labels for accessibility.
* **Blueprint**:
```tsx
import { Progress } from "@/components/ui/progress"

export function ProgressDemo() {
  return (
    <div className="space-y-2 p-4">
      <div className="flex justify-between text-xs font-semibold">
        <span>Ledger Playback Progress</span>
        <span>70% Complete</span>
      </div>
      <Progress value={70} className="h-2 bg-secondary" />
    </div>
  )
}
```

### 5. Scroll Area
* **CLI Command**: `npx shadcn@latest add scroll-area`
* **Desktop / Mobile Guidelines**: Scroll areas isolate vertical scrollbars. On mobile screens, disable forced scroll boundaries to leverage native momentum touch scrolling.
* **Blueprint**:
```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-72 w-full rounded-xl border p-4 bg-card leading-relaxed text-sm">
      Scroll Area content goes here.
    </ScrollArea>
  )
}
```

### 6. Separator
* **CLI Command**: `npx shadcn@latest add separator`
* **Desktop / Mobile Guidelines**: Use separators to divide content areas. Ensure they are tagged as `decorative` to prevent screen readers from reading them as blank space.
* **Blueprint**:
```tsx
import { Separator } from "@/components/ui/separator"

export function SeparatorDemo() {
  return (
    <div className="space-y-1 py-4">
      <h4 className="text-sm font-semibold">System Details</h4>
      <Separator className="my-2 bg-border" decorative />
      <p className="text-xs text-muted-foreground">Version 1.0.4 - Deterministic harness enabled</p>
    </div>
  )
}
```

### 7. Skeleton
* **CLI Command**: `npx shadcn@latest add skeleton`
* **Desktop / Mobile Guidelines**: Skeletons display loading states to improve Largest Contentful Paint (LCP) performance. Ensure skeleton layouts match actual loaded elements exactly.
* **Blueprint**:
```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-xl bg-card">
      <Skeleton className="h-12 w-12 rounded-full bg-muted animate-pulse" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[250px] bg-muted animate-pulse" />
        <Skeleton className="h-4 w-[200px] bg-muted animate-pulse" />
      </div>
    </div>
  )
}
```

### 8. Alert
* **CLI Command**: `npx shadcn@latest add alert`
* **Desktop / Mobile Guidelines**: Alerts highlight critical information. Pair them with icons and use appropriate HSL border values for visibility.
* **Blueprint**:
```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function AlertDemo() {
  return (
    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground rounded-xl flex gap-3 p-4">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
      <div>
        <AlertTitle className="font-bold text-sm text-destructive-foreground">Attention: Deviation Found</AlertTitle>
        <AlertDescription className="text-xs leading-normal mt-1 opacity-90">
          The wealth advisory AI answered a request missing retrieved context. Strictly review parameters.
        </AlertDescription>
      </div>
    </Alert>
  )
}
```

### 9. Carousel
* **CLI Command**: `npx shadcn@latest add carousel`
* **Desktop / Mobile Guidelines**: Use for rotating content cards. Support horizontal swipe gestures on mobile viewports so users can browse slides intuitively.
* **Blueprint**:
```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export function CarouselDemo() {
  return (
    <Carousel className="w-full max-w-xs mx-auto">
      <CarouselContent>
        <CarouselItem>
          <Card className="rounded-xl border">
            <CardContent className="flex aspect-square items-center justify-center p-6 bg-card font-semibold text-lg">
              Slide #1
            </CardContent>
          </Card>
        </CarouselItem>
      </CarouselContent>
      {/* Hide controls on mobile; support swipe gestures */}
      <CarouselPrevious className="hidden sm:inline-flex" />
      <CarouselNext className="hidden sm:inline-flex" />
    </Carousel>
  )
}
```

---

## 📦 Structural Layout & Containers

### 1. Card
* **CLI Command**: `npx shadcn@latest add card`
* **Desktop / Mobile Guidelines**: The building blocks of your layout. Ensure card components scale fluidly, and reduce padding (`p-4` instead of `p-6`) on mobile to maximize space.
* **Blueprint**:
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CardDemo() {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-5 sm:p-6">
        <CardTitle className="text-xl font-bold">Vector Verification Node</CardTitle>
        <CardDescription>Validates grounding data parameters.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6 pt-0 text-sm leading-relaxed text-muted-foreground">
        Cosine metrics are validated automatically at standard thresholds.
      </CardContent>
      <CardFooter className="p-5 sm:p-6 pt-0 flex justify-end">
        <Button className="h-10 px-4">Run Validation</Button>
      </CardFooter>
    </Card>
  )
}
```

### 2. Aspect Ratio
* **CLI Command**: `npx shadcn@latest add aspect-ratio`
* **Desktop / Mobile Guidelines**: Use to maintain image or video ratios. Aspect ratios prevent visual layout shifts (CLS) as media assets load.
* **Blueprint**:
```tsx
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"

export function AspectRatioDemo() {
  return (
    <div className="w-[300px] overflow-hidden rounded-xl border bg-muted shadow-sm">
      <AspectRatio ratio={16 / 9}>
        <Image
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Technical landscape schematic blueprint"
          fill
          className="object-cover"
        />
      </AspectRatio>
    </div>
  )
}
```

### 3. Resizable
* **CLI Command**: `npx shadcn@latest add resizable`
* **Desktop / Mobile Guidelines**: Resizable layouts are ideal for desktop dashboards. Disable resizable handles on mobile viewports; render stacked panels instead.
* **Blueprint**:
```tsx
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function ResizableDemo() {
  return (
    <div className="hidden lg:block border rounded-xl overflow-hidden shadow-sm h-[200px] bg-card">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} className="p-4 text-sm font-semibold">Sidebar controls</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} className="p-4 text-sm text-muted-foreground">Main workspace content</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
```

### 4. Collapsible
* **CLI Command**: `npx shadcn@latest add collapsible`
* **Desktop / Mobile Guidelines**: Perfect for building compact navigation trees or menus. Ensure toggle states are accessible to screen readers via `aria-expanded` and `aria-controls`.
* **Blueprint**:
```tsx
"use client"
import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[300px] border p-4 rounded-xl bg-card">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">Advanced Provenance Data</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0 h-9 flex items-center justify-center">
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3 text-xs leading-relaxed text-muted-foreground border-t pt-3">
        Node Address: vector-492.db | Memory Index: 0x932f. Strict compliance locked.
      </CollapsibleContent>
    </Collapsible>
  )
}
```

---

## 🗂️ Accordion (Standard v3/v4 & High-Accessibility Native Search versions)

Accordions are a critical visual pattern for displaying large amounts of hierarchical content cleanly. We have provided two different patterns depending on your implementation goals:
- **Option A (Standard React-Radix Accordion)**: Highly customizable, custom animations, Radix state model.
- **Option B (Modern Native Searchable Accordion)**: The gold standard for modern SEO and browser findability (`hidden="until-found"` & shared-name `<details>`), as outlined in modern web accessibility standards.

#### Option A: Standard Shadcn / Radix UI Component Setup
If you run `npx shadcn@latest add accordion`, Shadcn generates a modular file at `components/ui/accordion.tsx` wrapping the Radix UI primitives.

##### The Shadcn Under-the-Hood Component Code (`components/ui/accordion.tsx`)
```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-border transition-colors duration-150", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-semibold text-foreground transition-all hover:text-primary [&[data-state=open]>svg]:rotate-180 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down text-muted-foreground"
    {...props}
  >
    <div className={cn("pb-4 pt-0 leading-relaxed", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

##### Implementing standard Accordion in your pages (`page.tsx`)
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  return (
    <section className="w-full max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="bg-card border border-border rounded-xl px-6 py-2 shadow-sm">
        <AccordionItem value="faq-1" className="border-b last:border-b-0">
          <AccordionTrigger className="text-base py-5">
            How does the GlassBox audit trail keep operations deterministic?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-5 leading-6">
            GlassBox uses structured JSON metadata and state playback harnesses. Each decision
            made by the wealth-advisory AI agent is bound directly to the precise documents in
            the vector database, logging absolute query inputs and model temperatures so auditors
            can replay sessions verbatim.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq-2" className="border-b last:border-b-0">
          <AccordionTrigger className="text-base py-5">
            Is the desktop layout optimized for keyboard-only users?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-5 leading-6">
            Yes, fully. Radix UI primitives automatically inject key controls. Tabbing moves
            focus logically through headers, and tapping Space or Enter triggers panel expansion
            complying with standard W3C ARIA specs.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
```

---

#### Option B: Searchable & Indexable Native Accordion (Modern CSS / Progressive Enhancement)
> [!NOTE]
> Traditional React Accordions hide collapsed text behind `display: none`. This completely prevents the browser's native **"Find in page" (Cmd+F/Ctrl+F)** search from finding hidden words, hurts SEO indexing, and breaks deep text-fragment linking.
>
> To maximize accessibility and search capabilities, use this native component which leverages the **HTML `<details>` element with a shared `name` attribute** for mutual exclusion, or the **`hidden="until-found"` HTML attribute** paired with a JS fallback.

##### The Searchable/Indexable Component (`components/SearchableAccordion.tsx`)
```tsx
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

export function SearchableAccordion({ items, groupName }: { items: AccordionItem[]; groupName: string }) {
  // We use standard HTML <details> with a shared 'name' attribute.
  // In modern browsers, this enforces that only one details element in the group is open at a time (like an accordion).
  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {items.map((item) => (
        <details
          key={item.id}
          name={groupName}
          className="group border border-border bg-card rounded-xl overflow-hidden transition-all duration-200 open:ring-1 open:ring-primary shadow-sm"
        >
          <summary
            className="flex items-center justify-between px-6 py-5 font-semibold text-foreground cursor-pointer list-none hover:text-primary transition-colors focus-visible:outline-none focus-visible:bg-accent/40"
          >
            <span>{item.title}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-6 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed animate-fade-in">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
```

---

## 🔔 Toasts & Notifications

### 1. Toast
* **CLI Command**: `npx shadcn@latest add toast`
* **Desktop / Mobile Guidelines**: Traditional React notifications. Position notifications at the top or bottom of the viewport so they remain highly visible across all screen sizes.
* **Blueprint**:
```tsx
"use client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

export function ToastDemo() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: "Audit ledger synchronised",
          description: "All recent sessions were parsed with 100% determinism.",
        })
      }}
    >
      Run Audit Verification
    </Button>
  )
}
```

### 2. Sonner (Toaster)
* **CLI Command**: `npx shadcn@latest add sonner`
* **Desktop / Mobile Guidelines**: A modern, lightweight alternative to standard toasts. Position notifications at the **top-right** on desktop and **bottom-center** on mobile viewports.
* **Blueprint**:
```tsx
"use client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function SonnerDemo() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        toast("Grounding verified", {
          description: "Cosine index resolved within strict compliance bounds.",
          action: { label: "View Ledger", onClick: () => console.log("Directing to ledger") }
        })
      }}
    >
      Check Grounding
    </Button>
  )
}
```

---

## 📝 Shadcn UI Typographic System Cheatsheet

Use these standardized Tailwind typographic utilities to style text blocks. This guarantees layout compliance with the official Shadcn typographic standards.

### A. Typographic Elements
* **H1 (Large Page Title)**:
  ```tsx
  <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
    GlassBox Auditable Advisory
  </h1>
  ```
* **H2 (Section Header)**:
  ```tsx
  <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
    Operational Ledgers
  </h2>
  ```
* **H3 (Sub-section Header)**:
  ```tsx
  <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
    Grounding Vectors
  </h3>
  ```
* **H4 (Small Context Heading)**:
  ```tsx
  <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
    System Address
  </h4>
  ```
* **Lead / Intro Paragraph**:
  ```tsx
  <p className="text-xl text-muted-foreground leading-normal">
    A self-contained wealth management client analysis agent operating under verified grounding.
  </p>
  ```
* **Standard Body Copy**:
  ```tsx
  <p className="leading-7 [&:not(:first-child)]:mt-6 text-sm sm:text-base">
    All audit inputs are hashed and committed dynamically to avoid compliance deviations.
  </p>
  ```
* **Blockquote**:
  ```tsx
  <blockquote className="mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground">
    "Grounding prevents semantic hallucinations by locking LLM response parameters to retrieved SQLite boundaries."
  </blockquote>
  ```
* **Inline Code Snippet**:
  ```tsx
  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
    GLASSBOX_LOCAL_LLM=1
  </code>
  ```

---

## 📲 Responsive Layout & Touch Target Cheatsheet

| CSS Breakpoint | Screen Width Range | Recommended Viewport Layout Model |
| :--- | :--- | :--- |
| **`sm`** | $\ge 640\text{px}$ | Small phone / vertical stacking. Form buttons expand to full width (`w-full`). |
| **`md`** | $\ge 768\text{px}$ | Tablet / dual columns. Side navigation remains collapsed inside hamburger drawer (`Sheet`). |
| **`lg`** | $\ge 1024\text{px}$ | Small desktop / persistent sidebar. Navigation layout expands, side overlays convert to sidebars. |
| **`xl`** | $\ge 1280\text{px}$ | Desktop / multi-column grid layout. Wide cards and grids expand across screen. |
| **`2xl`** | $\ge 1536\text{px}$ | Ultra-wide desktop. Layout centered using `mx-auto max-w-7xl` to prevent stretching. |

### Mobile Touch Target Standard
To comply with standard accessibility guidelines, ensure all mobile interactive elements (buttons, inputs, select triggers, switch buttons) satisfy:
- **Minimum Tap Size**: $44\text{px} \times 44\text{px}$ (or `h-11 px-4`).
- **Input Text Minimum**: $16\text{px}$ font sizing (`text-base` class) to prevent iOS Safari auto-zooming.
- **Form Columns**: Use vertical stacks (`grid-cols-1`) on screens $< 640\text{px}$ to avoid text wrapping.
- **Scroll Safeties**: Add horizontal scroll wrappers (`w-full overflow-x-auto block scrollbar-none`) around tables, metrics, and navigation rails on mobile viewports.
