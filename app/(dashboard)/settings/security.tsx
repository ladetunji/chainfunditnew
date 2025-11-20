"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Download, Shield, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
const fetchWithAuth = (url: string, options: RequestInit = {}) =>
  fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const focusNext = (index: number) => {
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const focusPrev = (index: number) => {
    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, val: string) => {
    const newValue =
      value.substring(0, index) + val + value.substring(index + 1);
    onChange(newValue.padEnd(length, ""));
    if (val && index < length - 1) {
      focusNext(index);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      focusPrev(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pastedData.length === length) {
      onChange(pastedData);
      inputRefs.current[length - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length }).map((_, idx) => (
        <Input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-16 h-16 text-center text-2xl bg-white border border-[#D9D9DC] rounded"
          value={value[idx] || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (val.length <= 1) {
              handleChange(idx, val);
            }
          }}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

export default function Security() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [step, setStep] = useState<'view' | 'setup' | 'verify' | 'complete'>('view');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[] | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');

  // Check TOTP status on mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetchWithAuth('/api/user/me');
      if (response.ok) {
        const data = await response.json();
        setIsEnabled(Boolean(data?.user?.twoFactorEnabled));
      } else {
        setIsEnabled(false);
      }
    } catch (err: any) {
      console.error('Error checking 2FA status:', err);
      setIsEnabled(false);
    } finally {
      setIsChecking(false);
    }
  };

  const generateSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth('/api/user/2fa/setup');
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to generate setup data');
      }

      setSetupData({
        secret: data.data.secret,
        qrCodeUrl: data.data.qrCodeUrl,
        backupCodes: data.data.backupCodes,
      });
      setStep('verify');
    } catch (err: any) {
      console.error('TOTP setup error:', err);
      setError(err.message || 'Failed to generate setup data');
    } finally {
      setIsLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!setupData || !verificationCode || verificationCode.length !== 6) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth('/api/user/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({
          secret: setupData.secret,
          code: verificationCode,
          backupCodes: setupData.backupCodes,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to enable 2FA');
      }

      setStep('complete');
      setIsEnabled(true);
      setRegeneratedCodes(null);
      toast.success('Two-factor authentication enabled successfully!');
    } catch (err: any) {
      console.error('2FA enable error:', err);
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth('/api/user/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to disable 2FA');
      }

      setIsEnabled(false);
      setStep('view');
      setDisableCode('');
      setRegeneratedCodes(null);
      setSetupData(null);
      toast.success('Two-factor authentication disabled successfully!');
    } catch (err: any) {
      console.error('2FA disable error:', err);
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const codes = setupData?.backupCodes || regeneratedCodes;
    if (!codes) return;
    
    const content = `ChainFundIt - 2FA Backup Codes\n\n${codes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  const regenerateBackupCodes = async () => {
    setIsRegenerating(true);
    setError('');
    try {
      const response = await fetchWithAuth('/api/user/2fa/backup-codes', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to regenerate backup codes');
      }
      setRegeneratedCodes(data.data);
      toast.success('New backup codes generated. Save them in a secure place.');
    } catch (err: any) {
      console.error('Backup code regeneration error:', err);
      setError(err.message || 'Failed to regenerate backup codes');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Auto-submit when verification code is complete
  useEffect(() => {
    if (step === 'verify' && verificationCode.length === 6 && !isLoading) {
      enableTwoFactor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationCode, step]);

  if (isChecking) {
    return (
      <div className="2xl:container 2xl:mx-auto">
        <p className="text-[#104901]">Loading security settings...</p>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="2xl:container 2xl:mx-auto">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Secure your account with 2FA for enhanced security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account. 
                You&apos;ll need an authenticator app like Google Authenticator or Authy.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button onClick={generateSetup} disabled={isLoading} className="w-full">
                {isLoading ? 'Generating...' : 'Start Setup'}
              </Button>
              
              <Button variant="outline" onClick={() => setStep('view')} className="w-full">
                Cancel
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="2xl:container 2xl:mx-auto">
        <Card className="w-full max-w-2xl">
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
                  <Image
                    src={setupData.qrCodeUrl} 
                    alt="2FA QR Code" 
                    className="mx-auto border rounded"
                    width={200}
                    height={200}
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
                  <OtpInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    length={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app. Make sure your device&apos;s time is synchronized.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      <br /><br />
                      <strong>Troubleshooting:</strong>
                      <ul className="list-disc list-inside mt-2 text-sm">
                        <li>Make sure your device&apos;s time is synchronized</li>
                        <li>Try refreshing the code in your authenticator app</li>
                        <li>Ensure you&apos;re entering the current 6-digit code</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {isLoading && (
                  <p className="text-center text-[#104901]">Verifying...</p>
                )}

                <Button variant="outline" onClick={() => setStep('view')} className="w-full">
                  Cancel
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="2xl:container 2xl:mx-auto">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              2FA Enabled Successfully!
            </CardTitle>
            <CardDescription>
              Your account is now protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupData && setupData.backupCodes.length > 0 && (
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
            
            <Button onClick={() => setStep('view')} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View mode - show current status
  return (
    <div className="2xl:container 2xl:mx-auto">
      <h4 className="font-semibold text-2xl md:text-3xl text-[#104901] mb-2">
        Security Settings
      </h4>
      <p className="font-normal text-base md:text-xl text-[#104901] mb-6">
        Manage your account security and two-factor authentication settings.
      </p>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Manage two-factor authentication settings for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is enabled. Your account is protected with an additional security layer.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {regeneratedCodes && regeneratedCodes.length > 0 && (
                  <div className="space-y-2">
                    <Alert>
                      <AlertDescription>
                        <strong>New backup codes generated.</strong> Save these codes securely before leaving this page.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center justify-between">
                      <Label>Backup Codes</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(regeneratedCodes.join('\n')).then(() => toast.success('Backup codes copied'))}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {regeneratedCodes.map((code, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Backup Codes</Label>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={regenerateBackupCodes}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isRegenerating ? 'Generating...' : 'Regenerate Backup Codes'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disable-code">Enter verification code to disable 2FA</Label>
                  <OtpInput
                    value={disableCode}
                    onChange={setDisableCode}
                    length={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a code from your authenticator app to disable two-factor authentication.
                  </p>
                </div>

                <Button 
                  variant="destructive" 
                  onClick={disableTwoFactor}
                  disabled={isLoading || disableCode.length !== 6}
                  className="w-full"
                >
                  {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
                </AlertDescription>
              </Alert>

              <Button onClick={() => setStep('setup')} className="w-full">
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

