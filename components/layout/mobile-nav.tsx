"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, IndianRupee, Database, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/mileage", label: "Mileage Intelligence", icon: TrendingUp },
  { href: "/finance", label: "Financial Analytics", icon: IndianRupee },
  { href: "/data", label: "Data Manager", icon: Database },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
          <Fuel className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight">
            {"H'ness Fuel"}
          </h1>
          <p className="text-xs text-muted-foreground">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary neu-inset"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
