'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorVerificationProps {
  userEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({ userEmail, onSuccess, onCancel }: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);

  const verifyCode = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: code.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Set 2FA verification session
        await fetch('/api/admin/2fa/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim() }),
        });
        
        toast.success('2FA verification successful!');
        onSuccess();
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyCode();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your admin account requires two-factor authentication for security.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="code">
            {showBackupCode ? 'Backup Code' : 'Verification Code'}
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={showBackupCode ? 'Enter backup code' : 'Enter 6-digit code'}
            maxLength={showBackupCode ? 8 : 6}
            className="text-center text-lg tracking-widest"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={verifyCode} 
            disabled={isLoading || !code.trim()}
            className="flex-1"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBackupCode(!showBackupCode)}
          >
            {showBackupCode ? 'Use App' : 'Backup Code'}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-center">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
