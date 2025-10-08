import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  UserPlus,
  Tag,
  CheckSquare,
  Percent,
  MessageSquare,
  Settings,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Add Lead", url: "/leads/add", icon: UserPlus },
  { title: "Groups", url: "/groups", icon: Tag },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Discounts", url: "/discounts", icon: Percent },
  { title: "WhatsApp & Email", url: "/whatsapp", icon: MessageSquare },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-sidebar-foreground">Polymath-Kids</h1>
                <p className="text-xs text-sidebar-foreground/70">Lead Generation & Management</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-medium px-6 py-2">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
                      }`}
                    >
                      <item.icon className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}