import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Crown } from "lucide-react";
import LogoutButton from "@/components/logout-button";

interface UserMenuProps {
  user: {
    id: number;
    displayName: string;
    username: string;
    rating: number;
    wins: number;
    losses: number;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user.displayName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="text-left hidden md:block">
            <div className="text-sm font-medium">{user.displayName}</div>
            <div className="text-xs text-gray-400">Rating: {user.rating}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
        <div className="px-3 py-2">
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="font-medium text-white">{user.displayName}</div>
              <div className="text-xs text-gray-400">@{user.username}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Rating: <span className="text-yellow-400 font-medium">{user.rating}</span> • 
            <span className="text-green-400"> {user.wins}W</span> - 
            <span className="text-red-400">{user.losses}L</span>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-slate-700" />
        
        <DropdownMenuItem className="text-white hover:bg-slate-700 cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-white hover:bg-slate-700 cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-slate-700" />
        
        <DropdownMenuItem className="text-red-400 hover:bg-red-600 hover:text-white cursor-pointer" asChild>
          <div>
            <LogOut className="w-4 h-4 mr-2" />
            <LogoutButton 
              variant="ghost" 
              showIcon={false}
              className="p-0 h-auto text-current hover:bg-transparent"
            />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}