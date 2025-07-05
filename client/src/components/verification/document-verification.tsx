import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DocumentUpload {
  type: 'aadhaar' | 'pan' | 'license' | 'vehicle_registration';
  number: string;
  file: File | null;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

export default function DocumentVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { type: 'aadhaar', number: '', file: null, status: 'pending' },
    { type: 'pan', number: '', file: null, status: 'pending' },
    { type: 'license', number: '', file: null, status: 'pending' },
    { type: 'vehicle_registration', number: '', file: null, status: 'pending' },
  ]);

  const uploadMutation = useMutation({
    mutationFn: async (data: { type: string; number: string; file: File }) => {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('number', data.number);
      formData.append('document', data.file);
      
      const response = await fetch('/api/partner/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      setDocuments(prev => 
        prev.map(doc => 
          doc.type === variables.type 
            ? { ...doc, status: 'uploaded' as const }
            : doc
        )
      );
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded for verification.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/partner/profile'] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDocumentTitle = (type: string) => {
    switch (type) {
      case 'aadhaar': return 'Aadhaar Card';
      case 'pan': return 'PAN Card';
      case 'license': return 'Driving License';
      case 'vehicle_registration': return 'Vehicle Registration';
      default: return 'Document';
    }
  };

  const getDocumentDescription = (type: string) => {
    switch (type) {
      case 'aadhaar': return 'Government issued identity proof (mandatory)';
      case 'pan': return 'Required for tax compliance and earnings';
      case 'license': return 'Valid driving license for vehicle operation';
      case 'vehicle_registration': return 'Registration certificate of delivery vehicle';
      default: return 'Document verification';
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'aadhaar': return 'Enter 12-digit Aadhaar number';
      case 'pan': return 'Enter 10-character PAN number';
      case 'license': return 'Enter driving license number';
      case 'vehicle_registration': return 'Enter vehicle registration number';
      default: return 'Enter document number';
    }
  };

  const handleNumberChange = (type: string, value: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.type === type 
          ? { ...doc, number: value }
          : doc
      )
    );
  };

  const handleFileChange = (type: string, file: File | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.type === type 
          ? { ...doc, file }
          : doc
      )
    );
  };

  const handleUpload = (type: string) => {
    const document = documents.find(doc => doc.type === type);
    if (!document?.file || !document?.number) {
      toast({
        title: "Missing information",
        description: "Please enter document number and select file.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      type,
      number: document.number,
      file: document.file,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'uploaded':
        return <Badge variant="outline">Under Review</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Document Verification</h2>
        <p className="text-gray-600">
          Complete your profile by uploading required documents for verification
        </p>
      </div>

      {documents.map((document) => (
        <Card key={document.type} className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(document.status)}
                <span>{getDocumentTitle(document.type)}</span>
              </div>
              {getStatusBadge(document.status)}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {getDocumentDescription(document.type)}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`${document.type}-number`}>
                Document Number
              </Label>
              <Input
                id={`${document.type}-number`}
                placeholder={getPlaceholder(document.type)}
                value={document.number}
                onChange={(e) => handleNumberChange(document.type, e.target.value)}
                disabled={document.status === 'verified'}
              />
            </div>

            <div>
              <Label htmlFor={`${document.type}-file`}>
                Document Image
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id={`${document.type}-file`}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(document.type, e.target.files?.[0] || null)}
                  disabled={document.status === 'verified'}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Trigger camera capture
                    const input = window.document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment' as any;
                    input.onchange = (e: Event) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileChange(document.type, file);
                      }
                    };
                    input.click();
                  }}
                  disabled={document.status === 'verified'}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, PDF (max 5MB)
              </p>
            </div>

            {document.file && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{document.file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(document.file.size / 1024)}KB)
                </span>
              </div>
            )}

            {document.status !== 'verified' && (
              <Button
                onClick={() => handleUpload(document.type)}
                disabled={!document.file || !document.number || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                Document Guidelines
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure all documents are clear and readable</li>
                <li>• Upload original documents only (no photocopies)</li>
                <li>• All corners of the document should be visible</li>
                <li>• Documents should be valid and not expired</li>
                <li>• Verification typically takes 24-48 hours</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}