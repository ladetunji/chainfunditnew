'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/2fa/setup');
      const data = await response.json();
      
      if (data.success) {
        setSetupData(data.data);
        setStep('verify');
      } else {
        setError(data.error || 'Failed to generate setup data');
      }
    } catch (err) {
      setError('Failed to generate setup data');
    } finally {
      setIsLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!setupData || !verificationCode) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const requestData = {
        secret: setupData.secret,
        code: verificationCode,
        backupCodes: setupData.backupCodes,
      };
      
      console.log('Sending 2FA enable request:', {
        secret: requestData.secret.substring(0, 8) + '...',
        code: requestData.code,
        backupCodesCount: requestData.backupCodes.length
      });
      
      const response = await fetch('/api/admin/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      console.log('2FA enable response:', data);
      
      if (data.success) {
        setStep('complete');
        toast.success('2FA enabled successfully!');
      } else {
        setError(data.error || 'Failed to enable 2FA');
      }
    } catch (err) {
      console.error('2FA enable error:', err);
      setError('Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `ChainFundIt Admin - 2FA Backup Codes\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enable Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Secure your admin account with 2FA for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Two-factor authentication adds an extra layer of security to your admin account. 
              You'll need an authenticator app like Google Authenticator or Authy.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button onClick={generateSetup} disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : 'Start Setup'}
            </Button>
            
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete 2FA Setup</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app and enter the verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupData && (
            <>
              <div className="text-center">
                <img 
                  src={setupData.qrCodeUrl} 
                  alt="2FA QR Code" 
                  className="mx-auto border rounded"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret">Manual Entry Key</Label>
                <div className="flex gap-2">
                  <Input 
                    id="secret" 
                    value={setupData.secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verification">Verification Code</Label>
                <Input
                  id="verification"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code from your app"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app. Make sure your device's time is synchronized.
                </p>
              </div>
              
              <Button 
                onClick={enableTwoFactor} 
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Enabling...' : 'Enable 2FA'}
              </Button>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                    <br /><br />
                    <strong>Troubleshooting:</strong>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Make sure your device's time is synchronized</li>
                      <li>Try refreshing the code in your authenticator app</li>
                      <li>Ensure you're entering the current 6-digit code</li>
                      <li>Check the browser console for debug information</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            2FA Enabled Successfully!
          </CardTitle>
          <CardDescription>
            Your admin account is now protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupData && (
            <>
              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Save these backup codes in a safe place. 
                  Each code can only be used once if you lose access to your authenticator app.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadBackupCodes}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          <Button onClick={onComplete} className="w-full">
            Complete Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
