import { User, Phone, Mail, Star, MapPin, LogOut, Edit } from 'lucide-react';
import Header from '@/components/layout/header';
import BottomNavigation from '@/components/layout/bottom-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

export default function Profile() {
  const { partner, logout } = useAuth();

  const formatRating = (rating: string) => {
    const numRating = parseFloat(rating);
    return numRating > 0 ? numRating.toFixed(1) : 'Not rated';
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i}
          className={`w-4 h-4 ${numRating >= i ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      
      <main className="pb-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
          
          {/* Profile Overview */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{partner?.name}</h2>
                  <p className="text-gray-500">Delivery Partner</p>
                  <div className="flex items-center mt-1">
                    <Badge 
                      variant={partner?.isOnline ? "default" : "secondary"}
                      className={partner?.isOnline ? "bg-secondary/10 text-secondary" : ""}
                    >
                      {partner?.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              
              {/* Rating */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center mt-1">
                      {renderStars(partner?.rating || "0")}
                      <span className="text-sm text-gray-600 ml-2">
                        {formatRating(partner?.rating || "0")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Deliveries</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {partner?.totalDeliveries || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{partner?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{partner?.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Current Location</p>
                  <p className="text-gray-900">
                    {partner?.currentLatitude && partner?.currentLongitude ? 
                      `${parseFloat(partner.currentLatitude).toFixed(4)}, ${parseFloat(partner.currentLongitude).toFixed(4)}` : 
                      'Location not available'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Edit className="w-4 h-4 mr-3" />
                Edit Profile
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Phone className="w-4 h-4 mr-3" />
                Support
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
