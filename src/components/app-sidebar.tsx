'use client';

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FullLogo } from "@/components/logo";
import {
  LayoutDashboard,
  ReceiptText,
  Banknote,
  CalendarDays,
  ListTodo,
  Calculator,
  Building,
  PackageOpen
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import * as React from 'react';

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/facturas", icon: ReceiptText, label: "Facturas" },
  { href: "/echeqs", icon: Banknote, label: "E-Cheqs" },
  { href: "/proveedores", icon: Building, label: "Proveedores" },
  { href: "/remitos", icon: PackageOpen, label: "Remitos" },
  { href: "/calendario", icon: CalendarDays, label: "Calendario de Pago" },
  { href: "/tareas", icon: ListTodo, label: "Tareas" },
  { href: "/calculadora", icon: Calculator, label: "Calculadora" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader>
        <FullLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
