"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Download, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
          className="w-12 h-12 text-center text-2xl bg-white border border-[#D9D9DC] rounded"
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

function SetupTotpPageInner() {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

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
      toast.success('Two-factor authentication enabled successfully!');
    } catch (err: any) {
      console.error('2FA enable error:', err);
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const skipSetup = async () => {
    // Allow users to skip TOTP setup for now
    toast.info('You can set up two-factor authentication later in your settings');
    router.push('/dashboard');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `ChainFundIt - 2FA Backup Codes\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  // Auto-submit when verification code is complete
  useEffect(() => {
    if (step === 'verify' && verificationCode.length === 6 && !isLoading) {
      enableTwoFactor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationCode, step]);

  if (step === 'setup') {
    return (
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <div className="h-full flex flex-col gap-2 items-center justify-center flex-1 px-3 md:p-0">
          <div className="w-full max-w-md pt-6">
            <Card className="w-full">
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
                  
                  <Button variant="outline" onClick={skipSetup} className="w-full">
                    Skip for now
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
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <div className="h-full flex flex-col gap-2 items-center justify-center flex-1 px-3 md:p-0">
          <div className="w-full max-w-md pt-6">
            <Card className="w-full">
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <div className="h-full flex flex-col gap-2 items-center justify-center flex-1 px-3 md:p-0">
          <div className="w-full max-w-md pt-6">
            <Card className="w-full">
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
                
                <Button onClick={handleComplete} className="w-full">
                  Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SetupTotpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SetupTotpPageInner />
    </Suspense>
  );
}

