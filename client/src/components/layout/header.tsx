import { Bell, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { partner } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{partner?.name || 'Delivery Partner'}</h1>
            <p className="text-sm text-gray-500">Delivery Partner</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={partner?.isOnline ? "default" : "secondary"}
            className={partner?.isOnline ? "bg-secondary/10 text-secondary" : ""}
          >
            {partner?.isOnline ? 'Online' : 'Offline'}
          </Badge>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
