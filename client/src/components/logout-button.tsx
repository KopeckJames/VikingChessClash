import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { analytics } from "@/lib/analytics";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export default function LogoutButton({ 
  variant = "ghost", 
  size = "default", 
  showIcon = true, 
  showText = true,
  className = ""
}: LogoutButtonProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      
      if (currentUser?.id) {
        await apiRequest("POST", "/api/auth/logout", { userId: currentUser.id });
      }
      
      // Clear local storage
      localStorage.removeItem("currentUser");
      
      // Clear all cached queries
      queryClient.clear();
      
      return true;
    },
    onSuccess: () => {
      analytics.trackUserAction("logout");
      
      toast({
        title: "Farewell, Viking!",
        description: "You have been logged out successfully",
      });
      
      navigate("/");
    },
    onError: () => {
      // Even if server logout fails, clear local data
      localStorage.removeItem("currentUser");
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "Session ended (with errors)",
        variant: "destructive",
      });
      
      navigate("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className={className}
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      {showText && (
        <span className={showIcon ? "ml-2" : ""}>
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </span>
      )}
    </Button>
  );
}