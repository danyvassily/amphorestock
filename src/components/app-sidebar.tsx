"use client";

import * as React from "react";
import {
  BarChart3,
  Package,
  PlusCircle,
  History,
  User,
  Settings,
  Brain,
  Wine,
  Coffee,
  Zap,
  LogOut,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu items avec leurs icônes et routes
const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Intelligence IA",
    url: "/ai",
    icon: Brain,
  },
  {
    title: "Service Rapide",
    url: "/service",
    icon: Zap,
  },
  {
    title: "Gestion Stock",
    url: "/stock",
    icon: Package,
  },
  {
    title: "Ajouter Produit",
    url: "/produits/add",
    icon: PlusCircle,
  },
          {
          title: "Historique",
          url: "/historique",
          icon: History,
        },
        {
          title: "Import IA",
          url: "/import-ai",
          icon: Brain,
        },
  {
    title: "Statistiques",
    url: "/statistiques",
    icon: BarChart3,
  },
];

const categoryItems = [
  {
    title: "Vins",
    url: "/vins",
    icon: Wine,
  },
  {
    title: "Spiritueux",
    url: "/spiritueux",
    icon: Coffee,
  },
  {
    title: "Bières & Softs",
    url: "/boissons",
    icon: Coffee,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wine className="h-4 w-4" />
          </div>
          <span className="font-semibold">Amphore</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Section Catégories */}
        <div className="px-3 py-2">
          <h4 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
            Catégories
          </h4>
          <SidebarMenu>
            {categoryItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profil">
              <Link href="/profil">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Paramètres">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Profil utilisateur */}
        <div className="flex items-center gap-2 px-4 py-2">
          {loading ? (
            <SidebarMenuSkeleton />
          ) : user ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email} />
                <AvatarFallback>
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Non connecté</div>
          )}
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
} 