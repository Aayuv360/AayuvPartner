import { Home, Package, BarChart3, User, Power } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';

export default function BottomNavigation() {
  const [location] = useLocation();
  const { partner, updatePartner } = useAuth();

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/partner/status', {
        isOnline: !partner?.isOnline
      });
      return response.json();
    },
    onSuccess: (data) => {
      updatePartner({ isOnline: data.isOnline });
    },
  });

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/earnings', icon: BarChart3, label: 'Earnings' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} href={path}>
              <button 
                className={`flex flex-col items-center py-2 px-4 ${
                  location === path ? 'text-primary' : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Action Button */}
      <button 
        onClick={() => toggleStatusMutation.mutate()}
        disabled={toggleStatusMutation.isPending}
        className={`fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          partner?.isOnline 
            ? 'bg-primary text-white hover:bg-primary/90' 
            : 'bg-gray-400 text-white hover:bg-gray-500'
        }`}
      >
        <Power className="w-6 h-6" />
      </button>
    </>
  );
}
