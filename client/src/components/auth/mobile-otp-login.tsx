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
  const [language, setLanguage] = useState<'hindi' | 'english'>('hindi');
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
      toast({
        title: "OTP भेजा गया",
        description: `आपके नंबर ${phone} पर OTP भेजा गया है`,
      });
      
      // Auto-fill OTP in development
      if (data.otp) {
        setOtp(data.otp);
      }
      
      setStep('otp');
    },
    onError: (error: any) => {
      toast({
        title: "त्रुटि",
        description: error.message || "OTP भेजने में समस्या हुई",
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
        title: "गलत OTP",
        description: "कृपया सही OTP डालें",
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: (formData: any) =>
      apiRequest('POST', '/api/auth/mobile-register', formData),
    onSuccess: (data: VerifyOtpResponse) => {
      toast({
        title: language === 'hindi' ? "पंजीकरण सफल" : "Registration Successful",
        description: language === 'hindi' ? "आपका खाता बन गया है" : "Your account has been created"
      });
      login(data);
    },
    onError: (error: any) => {
      toast({
        title: language === 'hindi' ? "त्रुटि" : "Error",
        description: language === 'hindi' ? "पंजीकरण में समस्या हुई" : "Registration failed",
        variant: "destructive"
      });
    }
  });

  const handleSendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast({
        title: "गलत नंबर",
        description: "कृपया सही मोबाइल नंबर डालें",
        variant: "destructive"
      });
      return;
    }
    sendOtpMutation.mutate(phone);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      toast({
        title: "गलत OTP",
        description: "OTP 6 अंकों का होना चाहिए",
        variant: "destructive"
      });
      return;
    }
    verifyOtpMutation.mutate({ phone, otp });
  };

  const handleRegister = () => {
    // Validation
    const errors = [];
    if (!name.trim()) errors.push(language === 'hindi' ? 'नाम डालें' : 'Enter name');
    if (!vehicleType) errors.push(language === 'hindi' ? 'वाहन प्रकार चुनें' : 'Select vehicle type');
    if (!vehicleNumber.trim()) errors.push(language === 'hindi' ? 'वाहन नंबर डालें' : 'Enter vehicle number');
    if (!licenseNumber.trim()) errors.push(language === 'hindi' ? 'लाइसेंस नंबर डालें' : 'Enter license number');
    if (!aadhaarNumber.trim()) errors.push(language === 'hindi' ? 'आधार नंबर डालें' : 'Enter Aadhaar number');
    if (!upiId.trim()) errors.push(language === 'hindi' ? 'UPI ID डालें' : 'Enter UPI ID');

    if (errors.length > 0) {
      toast({
        title: language === 'hindi' ? "जानकारी अधूरी" : "Incomplete Information",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    // Submit registration
    registerMutation.mutate({ 
      phone, 
      name, 
      preferredLanguage: language,
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
            {language === 'hindi' ? 'आयुव डिलीवरी' : 'Aayuv Delivery'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {language === 'hindi' 
              ? 'डिलीवरी पार्टनर ऐप में आपका स्वागत है' 
              : 'Welcome to Delivery Partner App'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Language Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage('hindi')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                language === 'hindi' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('english')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                language === 'english' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              English
            </button>
          </div>

          {/* Phone Number Step */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">
                  {language === 'hindi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={language === 'hindi' ? 'अपना नंबर डालें' : 'Enter your number'}
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
                {sendOtpMutation.isPending ? (
                  language === 'hindi' ? 'भेजा जा रहा है...' : 'Sending...'
                ) : (
                  <>
                    {language === 'hindi' ? 'OTP भेजें' : 'Send OTP'}
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
                  {language === 'hindi' 
                    ? `+91 ${phone} पर भेजा गया OTP डालें` 
                    : `Enter OTP sent to +91 ${phone}`
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700">
                  {language === 'hindi' ? '6 अंकों का OTP' : '6-Digit OTP'}
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
                {verifyOtpMutation.isPending ? (
                  language === 'hindi' ? 'जांच रहे हैं...' : 'Verifying...'
                ) : (
                  language === 'hindi' ? 'OTP जांचें' : 'Verify OTP'
                )}
              </Button>
              
              <button
                onClick={() => setStep('phone')}
                className="w-full text-orange-500 text-sm"
              >
                {language === 'hindi' ? 'नंबर बदलें' : 'Change Number'}
              </button>
            </div>
          )}

          {/* Registration Step */}
          {step === 'register' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600">
                  {language === 'hindi' 
                    ? 'डिलीवरी पार्टनर बनने के लिए पंजीकरण करें' 
                    : 'Complete delivery partner registration'
                  }
                </p>
              </div>
              
              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">
                  {language === 'hindi' ? '📋 व्यक्तिगत जानकारी' : '📋 Personal Information'}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    {language === 'hindi' ? 'पूरा नाम *' : 'Full Name *'}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={language === 'hindi' ? 'राज कुमार' : 'Raj Kumar'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaar" className="text-gray-700">
                    {language === 'hindi' ? 'आधार नंबर *' : 'Aadhaar Number *'}
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
                    {language === 'hindi' ? 'PAN कार्ड (वैकल्पिक)' : 'PAN Card (Optional)'}
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
                  {language === 'hindi' ? '🏍️ वाहन की जानकारी' : '🏍️ Vehicle Information'}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleType" className="text-gray-700">
                    {language === 'hindi' ? 'वाहन प्रकार *' : 'Vehicle Type *'}
                  </Label>
                  <select
                    id="vehicleType"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">
                      {language === 'hindi' ? 'वाहन चुनें' : 'Select Vehicle'}
                    </option>
                    <option value="bike">
                      {language === 'hindi' ? 'मोटरसाइकिल/स्कूटर' : 'Motorcycle/Scooter'}
                    </option>
                    <option value="bicycle">
                      {language === 'hindi' ? 'साइकिल' : 'Bicycle'}
                    </option>
                    <option value="car">
                      {language === 'hindi' ? 'कार' : 'Car'}
                    </option>
                    <option value="auto">
                      {language === 'hindi' ? 'ऑटो रिक्शा' : 'Auto Rickshaw'}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-gray-700">
                    {language === 'hindi' ? 'वाहन नंबर *' : 'Vehicle Number *'}
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
                    {language === 'hindi' ? 'ड्राइविंग लाइसेंस *' : 'Driving License *'}
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
                  {language === 'hindi' ? '💳 भुगतान की जानकारी' : '💳 Payment Information'}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="upi" className="text-gray-700">
                    {language === 'hindi' ? 'UPI ID *' : 'UPI ID *'}
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
                    {language === 'hindi' 
                      ? 'कमाई सीधे इस UPI ID पर मिलेगी' 
                      : 'Earnings will be sent to this UPI ID'
                    }
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium"
              >
                {registerMutation.isPending ? (
                  language === 'hindi' ? 'पंजीकरण हो रहा है...' : 'Registering...'
                ) : (
                  language === 'hindi' ? 'डिलीवरी पार्टनर बनें' : 'Become Delivery Partner'
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                {language === 'hindi' 
                  ? '* सभी जरूरी फील्ड भरना अनिवार्य है' 
                  : '* All required fields must be filled'
                }
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t">
            {language === 'hindi' 
              ? 'OTP भेजकर आप हमारी शर्तों से सहमत हैं' 
              : 'By sending OTP, you agree to our terms'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}