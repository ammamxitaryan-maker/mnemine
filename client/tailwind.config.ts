import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        emerald: "#059669",
        cyan: "#06b6d4",
        gold: "#fbbf24",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "primary-glow": {
          '0%, 100%': { 'box-shadow': '0 0 25px -5px rgba(30, 58, 138, 0.5)' },
          '50%': { 'box-shadow': '0 0 25px 5px rgba(30, 58, 138, 0.3)' },
        },
        "yellow-glow": {
          '0%, 100%': { 'box-shadow': '0 0 20px -5px rgba(251, 191, 36, 0.6)' },
          '50%': { 'box-shadow': '0 0 20px 5px rgba(251, 191, 36, 0.4)' },
        },
        "pulse-subtle": {
          '0%, 100%': { transform: 'scale(1)', textShadow: '0 0 5px rgba(251, 191, 36, 0.4)' },
          '50%': { transform: 'scale(1.02)', textShadow: '0 0 15px rgba(251, 191, 36, 0.7)' },
        },
        "pulse-shadow": {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(30, 58, 138, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(30, 58, 138, 0)' },
        },
        "subtle-glow": {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "primary-glow": "primary-glow 4s ease-in-out infinite",
        "yellow-glow": "yellow-glow 3s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "pulse-shadow": "pulse-shadow 2s infinite",
        "subtle-glow": "subtle-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;