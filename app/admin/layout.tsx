"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import NotificationPanel from "@/components/admin/NotificationPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  TrendingUp,
  DollarSign,
  Settings,
  Bell,
  HelpCircle,
  Share,
  Plus,
  ChevronDown,
  Menu,
  X,
  Shield,
  Wrench,
  Sparkles,
  LogOut,
  User,
} from "lucide-react";
import { MoneyTick } from "iconsax-reactjs";
import Image from "next/image";
import { TwoFactorVerification } from "@/components/admin/two-factor-verification";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/admin-dashboard/overview",
    icon: LayoutDashboard,
    current: true,
  },
  {
    name: "Users",
    href: "/admin/admin-dashboard/users",
    icon: Users,
    current: false,
  },
  {
    name: "Campaigns",
    href: "/admin/admin-dashboard/campaigns",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Ambassadors",
    href: "/admin/admin-dashboard/ambassadors",
    icon: Share,
    current: false,
  },
  {
    name: "Donations",
    href: "/admin/admin-dashboard/donations",
    icon: DollarSign,
    current: false,
  },
  {
    name: "Payouts",
    href: "/admin/admin-dashboard/payouts",
    icon: MoneyTick,
    current: false,
  },
  {
    name: "Analytics",
    href: "/admin/admin-dashboard/analytics",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Notifications",
    href: "/admin/admin-dashboard/notifications",
    icon: Bell,
    current: false,
  },
  {
    name: "Settings",
    href: "/admin/admin-dashboard/settings",
    icon: Settings,
    current: false,
  },
];

const adminTools = [
  {
    name: "User Management",
    href: "/admin/admin-dashboard/users",
    icon: Users,
  },
  {
    name: "Campaign Moderation",
    href: "/admin/admin-dashboard/campaigns",
    icon: BarChart3,
  },
  {
    name: "Ambassador Analytics",
    href: "/admin/admin-dashboard/ambassadors",
    icon: TrendingUp,
  },
  {
    name: "Payout Approval",
    href: "/admin/admin-dashboard/payouts",
    icon: DollarSign,
  },
];

const whatsNew = [
  {
    title: "Enhanced Security",
    description: "2FA authentication now available",
    icon: Shield,
  },
  {
    title: "Advanced Analytics",
    description: "New reporting dashboard",
    icon: BarChart3,
  },
  {
    title: "Bulk Operations",
    description: "Process multiple items at once",
    icon: Wrench,
  },
];

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "super_admin";
  isVerified: boolean;
  accountLocked: boolean;
  twoFactorEnabled: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);

          // Check if 2FA is required and verified
          if (data.user.twoFactorEnabled) {
            const twoFactorCookie = document.cookie
              .split("; ")
              .find((row) => row.startsWith("2fa_verified="));
            setTwoFactorVerified(twoFactorCookie?.split("=")[1] === "true");
          } else {
            setTwoFactorVerified(true);
          }
        } else {
          router.push(
            "/signin?redirect=" + encodeURIComponent(window.location.pathname)
          );
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push(
          "/signin?redirect=" + encodeURIComponent(window.location.pathname)
        );
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104901] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.twoFactorEnabled && !twoFactorVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <TwoFactorVerification
          userEmail={user.email}
          onSuccess={() => setTwoFactorVerified(true)}
          onCancel={() => router.push("/signin")}
        />
      </div>
    );
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/signin");
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const handleNotifications = () => {
    toast.info("Notifications feature coming soon!");
  };

  const handleHelp = () => {
    window.open("/faq", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/logo.svg"
                alt="ChainFundIt"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold text-gray-900">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-[#5F8555] text-white"
                      : "text-[#5F8555] hover:bg-[#5F8555] hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive
                        ? "text-[#104901]"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/logo.svg"
                alt="ChainFundIt"
                width={32}
                height={32}
              />
              <div>
                <span className="text-xl font-bold text-gray-900">Admin</span>
                <p className="text-xs text-gray-500">ChainFundIt</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-[#5F8555] text-white"
                      : "text-[#5F8555] hover:bg-[#5F8555] hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 group-hover:text-white"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <Badge
                  variant={
                    user.role === "super_admin" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {user.role === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogoutClick}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* What's New Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-[#5F8555] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  What's New
                </span>
              </div>
              <div className="space-y-2">
                {whatsNew.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <ChevronDown className="h-3 w-3 text-white mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-white">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <NotificationPanel />

              {/* Help */}
              <Button variant="ghost" size="sm" onClick={handleHelp}>
                <HelpCircle className="h-5 w-5" />
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {user?.fullName || "Admin"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutClick}
                  className="h-8 w-8 bg-[#104901] rounded-full flex items-center justify-center"
                >
                  <span className="text-sm font-medium text-white">
                    {user?.fullName?.charAt(0) || "A"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your dashboard? 
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleLogoutCancel}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1 sm:flex-none rounded-none"
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
