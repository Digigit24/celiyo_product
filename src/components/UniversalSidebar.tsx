import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  Stethoscope,
  Database,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  ClipboardList,
  Menu,
  X,
  Building2,
  UserCheck,
  Activity,
  Kanban,
  MessageCircle,
  FileText,
  Send,
  CheckSquare,
  Award,
  User,
  ClipboardPlus,
  Microscope,
  Package,
  Receipt,
  Shield,
  Settings2,
  UserCog,
  ShieldCheck,
  Bug,
  DollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  badge?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  // {
  //   id: "inbox",
  //   label: "Inbox",
  //   icon: Mail,
  //   path: "/inbox",
  //   badge: 3,
  // },

  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    children: [
      {
        id: "whatsapp-contacts",
        label: "Contacts",
        icon: Users,
        path: "/whatsapp/contacts",
      },
      {
        id: "whatsapp-chats",
        label: "Chats",
        icon: MessageCircle,
        path: "/whatsapp/chats",
      },
      {
        id: "whatsapp-groups",
        label: "Groups",
        icon: Users,
        path: "/whatsapp/groups",
      },
      {
        id: "whatsapp-templates",
        label: "Templates",
        icon: FileText,
        path: "/whatsapp/templates",
      },
      {
        id: "whatsapp-campaigns",
        label: "Campaigns",
        icon: Send,
        path: "/whatsapp/campaigns",
      },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Building2,
    children: [
      {
        id: "crm-leads",
        label: "Leads",
        icon: Users,
        path: "/crm/leads",
      },
      {
        id: "crm-activities",
        label: "Activities",
        icon: Activity,
        path: "/crm/activities",
      },
      {
        id: "crm-statuses",
        label: "Lead Statuses",
        icon: ClipboardList,
        path: "/crm/statuses",
      },
      {
        id: "crm-pipeline",
        label: "Pipeline",
        icon: Kanban,
        path: "/crm/pipeline",
      },
      {
        id: "crm-tasks",
        label: "Tasks",
        icon: CheckSquare,
        path: "/crm/tasks",
      },
      {
        id: "crm-meetings",
        label: "Meetings",
        icon: Calendar,
        path: "/crm/meetings",
      },
      {
        id: "crm-settings",
        label: "Settings",
        icon: Settings2,
        path: "/crm/settings",
      },
    ],
  },
  {
    id: "hms",
    label: "HMS",
    icon: Stethoscope,
    children: [
      {
        id: "hms-doctors",
        label: "Doctors",
        icon: UserCheck,
        path: "/hms/doctors",
      },
      {
        id: "hms-specialties",
        label: "Specialties",
        icon: Award,
        path: "/hms/specialties",
      },
      {
        id: "hms-patients",
        label: "Patients",
        icon: User,
        path: "/patients",
      },
      {
        id: "hms-appointments",
        label: "Appointments",
        icon: Calendar,
        path: "/appointments",
      },
    ],
  },
  {
    id: "opd",
    label: "OPD",
    icon: Stethoscope,
    children: [
      {
        id: "opd-visits",
        label: "Visits",
        icon: ClipboardPlus,
        path: "/opd/visits",
      },
      {
        id: "opd-bills",
        label: "OPD Bills",
        icon: FileText,
        path: "/opd/bills",
      },
      {
        id: "clinical-notes",
        label: "Clinical Notes",
        icon: ClipboardList,
        path: "/opd/clinical-notes",
      },
      {
        id: "visit-findings",
        label: "Visit Findings",
        icon: Activity,
        path: "/opd/findings",
      },
      {
        id: "procedure-masters",
        label: "Procedures",
        icon: Microscope,
        path: "/opd/procedures",
      },
      {
        id: "procedure-packages",
        label: "Packages",
        icon: Package,
        path: "/opd/packages",
      },
      {
        id: "procedure-bills",
        label: "Procedure Bills",
        icon: Receipt,
        path: "/opd/procedure-bills",
      },
      {
        id: "opd-settings",
        label: "Settings",
        icon: Settings2,
        path: "/opd/settings",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: DollarSign,
    children: [
      {
        id: "payment-transactions",
        label: "Transactions",
        icon: CreditCard,
        path: "/payments/transactions",
      },
      {
        id: "payment-categories",
        label: "Categories",
        icon: Package,
        path: "/payments/categories",
      },
      {
        id: "accounting-periods",
        label: "Accounting Periods",
        icon: TrendingUp,
        path: "/payments/periods",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    children: [
      {
        id: "admin-users",
        label: "Users",
        icon: UserCog,
        path: "/admin/users",
      },
      {
        id: "admin-roles",
        label: "Roles",
        icon: ShieldCheck,
        path: "/admin/roles",
      },
      {
        id: "admin-settings",
        label: "Settings",
        icon: Settings2,
        path: "/admin/settings",
      },
      {
        id: "admin-debug",
        label: "Debug",
        icon: Bug,
        path: "/admin/debug",
      },
    ],
  },
];

interface UniversalSidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function UniversalSidebar({
  collapsed = false,
  onCollapse,
  mobileOpen = false,
  setMobileOpen,
}: UniversalSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState<string[]>(["masters"]);
  const [logoError, setLogoError] = useState(false);

  // Get tenant logo from settings
  // Logo can be a URL or base64 string (data:image/...;base64,...)
  const tenantLogo = user?.tenant?.settings?.logo && user?.tenant?.settings?.logo.trim() !== ''
    ? user.tenant.settings.logo
    : undefined;
  const tenantName = user?.tenant?.name || 'HMS';

  // Debug logging
  console.log('Tenant data:', {
    hasTenant: !!user?.tenant,
    hasSettings: !!user?.tenant?.settings,
    logoValue: user?.tenant?.settings?.logo,
    logoLength: user?.tenant?.settings?.logo?.length,
    tenantName: user?.tenant?.name,
    isBase64: user?.tenant?.settings?.logo?.startsWith('data:image')
  });

  // Reset logo error when logo changes
  useEffect(() => {
    setLogoError(false);
  }, [tenantLogo]);

  const handleLogoError = () => {
    console.error('Failed to load tenant logo:', tenantLogo);
    setLogoError(true);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && location.pathname === child.path);
  };

  const closeMobileSidebar = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
              <img
                src="https://gorehospital.netlify.app/assets/images/logo/logo.jpeg"
                alt={`${tenantName} logo`}
                className="w-8 h-8 object-contain rounded-lg"
                onError={handleLogoError}
              />
            <span className="font-bold text-lg">{tenantName}</span>
          </div>
        )}
        {collapsed && (
          tenantLogo && !logoError ? (
            <img
              src={tenantLogo}
              alt={`${tenantName} logo`}
              className="w-8 h-8 object-contain rounded-lg mx-auto"
              onError={handleLogoError}
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
          )
        )}
        {mobileOpen && setMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            if (item.children) {
              // Menu item with children (collapsible)
              const isOpen = openSections.includes(item.id);
              const hasActiveChild = isParentActive(item.children);

              return (
                <Collapsible
                  key={item.id}
                  open={isOpen}
                  onOpenChange={() => toggleSection(item.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3",
                        hasActiveChild && "bg-sidebar-accent text-sidebar-accent-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  {!collapsed && (
                    <CollapsibleContent className="pl-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          to={child.path || "#"}
                          onClick={closeMobileSidebar}
                        >
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 h-9 px-3",
                              isActive(child.path) &&
                                "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm">{child.label}</span>
                          </Button>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              );
            }

            // Regular menu item
            return (
              <Link
                key={item.id}
                to={item.path || "#"}
                onClick={closeMobileSidebar}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3",
                    isActive(item.path) &&
                      "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="min-w-[20px] justify-center">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Button (Desktop only) */}
      {!mobileOpen && onCollapse && (
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={onCollapse}
            className={cn(
              "w-full justify-start gap-3 h-10",
              collapsed && "justify-center"
            )}
          >
            <Menu className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile Sidebar (Drawer)
  if (mobileOpen !== undefined && setMobileOpen !== undefined) {
    return (
      <>
        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 h-full w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 transition-transform duration-300 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent />
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 hidden lg:block",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}