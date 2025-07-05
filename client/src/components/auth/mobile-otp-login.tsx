import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Lock, Globe, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface SendOtpResponse {
  message: string;
  otp?: string; // For development only
}

interface VerifyOtpResponse {
  _id: string;
  name: string;
  phone: string;
  preferredLanguage: string;
  isPhoneVerified: boolean;
}

export default function MobileOtpLogin() {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Registration form fields
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  
  const { toast } = useToast();
  const { login } = useAuth();

  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => 
      apiRequest('POST', '/api/auth/send-otp', { phone }),
    onSuccess: (data: SendOtpResponse) => {
      // Log OTP to console in development
      if (data.otp) {
        console.log(`🔐 OTP for ${phone}: ${data.otp}`);
        console.log(`📱 Copy this OTP: ${data.otp}`);
      }
      
      toast({
        title: "OTP Sent",
        description: data.otp ? `OTP: ${data.otp} (Check console for easy copy)` : `OTP has been sent to ${phone}`,
      });
      
      // Auto-fill OTP in development
      if (data.otp) {
        setOtp(data.otp);
      }
      
      setStep('otp');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      apiRequest('POST', '/api/auth/verify-otp', { phone, otp }),
    onSuccess: (data: VerifyOtpResponse) => {
      if (data.name.includes('Partner')) {
        // New user, needs registration
        setIsNewUser(true);
        setStep('register');
      } else {
        // Existing user, login successful
        login(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: "Please enter the correct OTP",
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: (formData: any) =>
      apiRequest('POST', '/api/auth/mobile-register', formData),
    onSuccess: (data: VerifyOtpResponse) => {
      toast({
        title: "Registration Successful",
        description: "Your account has been created"
      });
      login(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Registration failed",
        variant: "destructive"
      });
    }
  });

  const handleSendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid mobile number",
        variant: "destructive"
      });
      return;
    }
    sendOtpMutation.mutate(phone);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "OTP must be 6 digits",
        variant: "destructive"
      });
      return;
    }
    verifyOtpMutation.mutate({ phone, otp });
  };

  const handleRegister = () => {
    // Validation
    const errors = [];
    if (!name.trim()) errors.push('Enter name');
    if (!vehicleType) errors.push('Select vehicle type');
    if (!vehicleNumber.trim()) errors.push('Enter vehicle number');
    if (!licenseNumber.trim()) errors.push('Enter license number');
    if (!aadhaarNumber.trim()) errors.push('Enter Aadhaar number');
    if (!upiId.trim()) errors.push('Enter UPI ID');

    if (errors.length > 0) {
      toast({
        title: "Incomplete Information",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    // Submit registration
    registerMutation.mutate({ 
      phone, 
      name, 
      preferredLanguage: 'english',
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadhaarNumber,
      panNumber,
      upiId
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Aayuv Delivery
          </CardTitle>
          <CardDescription className="text-gray-600">
            Welcome to Delivery Partner App
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Phone Number Step */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">
                  Mobile Number
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-12 text-lg"
                    maxLength={10}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSendOtp}
                disabled={sendOtpMutation.isPending}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
              >
                {sendOtpMutation.isPending ? 'Sending...' : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600">
                  Enter OTP sent to +91 {phone}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700">
                  6-Digit OTP
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="otp"
                    type="number"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-12 h-12 text-lg text-center tracking-wider"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleVerifyOtp}
                disabled={verifyOtpMutation.isPending}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium"
              >
                {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
              </Button>
              
              <button
                onClick={() => setStep('phone')}
                className="w-full text-orange-500 text-sm"
              >
                Change Number
              </button>
            </div>
          )}

          {/* Registration Step */}
          {step === 'register' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600">
                  Complete delivery partner registration
                </p>
              </div>
              
              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">
                  📋 Personal Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Raj Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaar" className="text-gray-700">
                    Aadhaar Number *
                  </Label>
                  <Input
                    id="aadhaar"
                    type="text"
                    placeholder="1234 5678 9012"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="h-10"
                    maxLength={12}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pan" className="text-gray-700">
                    PAN Card (Optional)
                  </Label>
                  <Input
                    id="pan"
                    type="text"
                    placeholder="ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="h-10"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">
                  🏍️ Vehicle Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleType" className="text-gray-700">
                    Vehicle Type *
                  </Label>
                  <select
                    id="vehicleType"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">
                      Select Vehicle
                    </option>
                    <option value="bike">
                      Motorcycle/Scooter
                    </option>
                    <option value="bicycle">
                      Bicycle
                    </option>
                    <option value="car">
                      Car
                    </option>
                    <option value="auto">
                      Auto Rickshaw
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-gray-700">
                    Vehicle Number *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    type="text"
                    placeholder="DL 01 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license" className="text-gray-700">
                    Driving License *
                  </Label>
                  <Input
                    id="license"
                    type="text"
                    placeholder="DL-1420110012345"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">
                  💳 Payment Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="upi" className="text-gray-700">
                    UPI ID *
                  </Label>
                  <Input
                    id="upi"
                    type="text"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500">
                    Earnings will be sent to this UPI ID
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium"
              >
                {registerMutation.isPending ? 'Registering...' : 'Become Delivery Partner'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                * All required fields must be filled
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            By sending OTP, you agree to our terms
          </div>
        </CardContent>
      </Card>
    </div>
  );
}