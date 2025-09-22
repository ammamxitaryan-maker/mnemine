"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const EnhancedTabs = TabsPrimitive.Root;

const EnhancedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills" | "underline" | "cards";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "default", size = "md", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center transition-all duration-200",
      {
        // Default variant
        "h-10 rounded-md bg-muted p-1 text-muted-foreground": variant === "default",
        // Pills variant
        "h-auto rounded-full bg-gray-100 dark:bg-gray-800 p-1 gap-1": variant === "pills",
        // Underline variant
        "h-auto border-b border-gray-200 dark:border-gray-700 bg-transparent p-0 gap-8": variant === "underline",
        // Cards variant
        "h-auto bg-transparent p-0 gap-2": variant === "cards",
      },
      {
        "text-sm": size === "sm",
        "text-base": size === "md", 
        "text-lg": size === "lg",
      },
      className
    )}
    {...props}
  />
));
EnhancedTabsList.displayName = "EnhancedTabsList";

const EnhancedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pills" | "underline" | "cards";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "default", size = "md", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        // Default variant
        "rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm": variant === "default",
        // Pills variant
        "rounded-full px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-white/50 dark:hover:bg-gray-700/50": variant === "pills",
        // Underline variant
        "px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:text-gray-600 dark:hover:text-gray-300": variant === "underline",
        // Cards variant
        "rounded-xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:border-blue-300 dark:data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:shadow-md transition-all duration-200": variant === "cards",
      },
      {
        "text-sm px-2 py-1": size === "sm",
        "text-base px-3 py-2": size === "md",
        "text-lg px-4 py-3": size === "lg",
      },
      className
    )}
    {...props}
  />
));
EnhancedTabsTrigger.displayName = "EnhancedTabsTrigger";

const EnhancedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    variant?: "default" | "card" | "minimal";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      {
        "": variant === "default",
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg": variant === "card",
        "mt-0": variant === "minimal",
      },
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {props.children}
    </motion.div>
  </TabsPrimitive.Content>
));
EnhancedTabsContent.displayName = "EnhancedTabsContent";

export { 
  EnhancedTabs, 
  EnhancedTabsList, 
  EnhancedTabsTrigger, 
  EnhancedTabsContent 
};
