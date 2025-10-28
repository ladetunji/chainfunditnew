'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Shield, ShieldCheck, ShieldX, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSettingsProps {
  userEmail: string;
  onStartSetup: () => void;
}

export function TwoFactorSettings({ userEmail, onStartSetup }: TwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Remove showSetup state as it's now managed by parent
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/me');
      const data = await response.json();
      
      if (data.user) {
        setIsEnabled(data.user.twoFactorEnabled || false);
      }
    } catch (err) {
      console.error('Failed to check 2FA status:', err);
    }
  };

  const disableTwoFactor = async () => {
    if (!disableCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsEnabled(false);
        setShowDisable(false);
        setDisableCode('');
        toast.success('2FA disabled successfully');
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/2fa/backup-codes', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBackupCodes(data.backupCodes);
        toast.success('New backup codes generated');
      } else {
        setError(data.error || 'Failed to generate backup codes');
      }
    } catch (err) {
      setError('Failed to generate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    
    const content = `ChainFundIt Admin - 2FA Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Remove showSetup logic as it's now handled by parent

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Manage two-factor authentication settings for enhanced security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="2fa-toggle">Enable 2FA</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your admin account
            </p>
          </div>
          <Switch
            id="2fa-toggle"
            checked={isEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                onStartSetup();
              } else {
                setShowDisable(true);
              }
            }}
          />
        </div>

        {isEnabled && (
          <>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is enabled. Your account is protected with an additional security layer.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Backup Codes</h4>
                  <p className="text-sm text-muted-foreground">
                    Use these codes if you lose access to your authenticator app
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateBackupCodes}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                  {backupCodes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadBackupCodes}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>

              {backupCodes.length > 0 && (
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {showDisable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldX className="h-5 w-5" />
                Disable Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Enter your verification code to disable 2FA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disable-code">Verification Code</Label>
                <Input
                  id="disable-code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="Enter 6-digit code from your app"
                  maxLength={6}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={disableTwoFactor}
                  disabled={isLoading || disableCode.length !== 6}
                  variant="destructive"
                >
                  {isLoading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
