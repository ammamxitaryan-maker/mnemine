"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const EnhancedAccordion = AccordionPrimitive.Root;

const EnhancedAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
    variant?: "default" | "compact" | "card";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "transition-all duration-300 ease-in-out",
      {
        "border-b border-gray-200 dark:border-gray-700": variant === "default",
        "mb-2": variant === "compact",
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300": variant === "card",
      },
      className
    )}
    {...props}
  />
));
EnhancedAccordionItem.displayName = "EnhancedAccordionItem";

const EnhancedAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    variant?: "default" | "compact" | "card";
    showChevron?: boolean;
  }
>(({ className, children, variant = "default", showChevron = true, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between font-medium transition-all duration-200 ease-in-out group",
        {
          "py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-4 rounded-lg": variant === "default",
          "py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 rounded-md": variant === "compact",
          "py-4 px-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 rounded-xl": variant === "card",
        },
        "[&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {children}
      </div>
      {showChevron && (
        <motion.div
          className="flex items-center justify-center w-6 h-6"
          animate={{ rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-gray-500 dark:text-gray-400" />
        </motion.div>
      )}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
EnhancedAccordionTrigger.displayName = "EnhancedAccordionTrigger";

const EnhancedAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
    variant?: "default" | "compact" | "card";
  }
>(({ className, children, variant = "default", ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all duration-300 ease-in-out",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      {
        "pb-4 pt-0 px-4": variant === "default",
        "pb-2 pt-0 px-3": variant === "compact", 
        "pb-4 pt-0 px-6": variant === "card",
      },
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {children}
    </motion.div>
  </AccordionPrimitive.Content>
));
EnhancedAccordionContent.displayName = "EnhancedAccordionContent";

export { 
  EnhancedAccordion, 
  EnhancedAccordionItem, 
  EnhancedAccordionTrigger, 
  EnhancedAccordionContent 
};
