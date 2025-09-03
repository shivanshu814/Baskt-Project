'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, useUser } from '@baskt/ui';
import {
  CheckCircle,
  Copy,
  Gift,
  Mail,
  Share2,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getReferralCode } from '../../hooks/referral/getReferralCode';
import { getReferralData } from '../../hooks/referral/getReferralData';
import { postReferralMail } from '../../hooks/referral/postReferralMail';

export function ReferralDashboard() {
  const { userAddress } = useUser();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');

  const { referralCode, isLoading, error, generateCode, isGenerating } = getReferralCode();
  const { data: referralData, isLoading: isDataLoading } = getReferralData();
  const {
    sendReferralEmail,
    isSending,
    error: emailError,
    success: emailSuccess,
    clearMessages,
  } = postReferralMail();

  useEffect(() => {
    if (userAddress && !referralCode && !isLoading) {
      generateCode();
    }
  }, [userAddress, referralCode, isLoading, generateCode]);

  const referralLink = referralCode ? `${window.location.origin}/?via=${referralCode}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && userAddress) {
      const result = await sendReferralEmail({ inviteeEmail: email });
      if (result.success) {
        setEmail('');
        setTimeout(() => clearMessages(), 5000);
      } else {
        setEmail('');
      }
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-16 pb-20 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 px-4 py-2 rounded-full border border-primary/30 mb-4">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-primary">Referral Program</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Refer
              </span>
              <span className="bg-gradient-to-r from-primary via-primary to-purple-500 bg-clip-text text-transparent">
                & Earn
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Invite friends to join <span className="font-semibold text-primary">Baskt</span> and
              earn <span className="font-bold text-success">25% commission</span> on their first
              deposit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="group bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-xl">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    Your Points
                  </CardTitle>
                  <Star className="h-5 w-5 text-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-2">
                  {isDataLoading ? '...' : referralData?.rewardsValue || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {referralData?.referralDetails?.length || 0} referrals
                </div>
                <div className="mt-3 w-full bg-primary/20 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: referralData?.rewardsValue
                        ? `${Math.min((referralData.rewardsValue / 100) * 100, 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30 hover:border-warning/50 rounded-2xl hover:shadow-lg hover:shadow-warning/20 transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="bg-gradient-to-br from-warning/20 to-warning/10 p-2 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-warning" />
                    </div>
                    Referral Rate
                  </CardTitle>
                  <Target className="h-5 w-5 text-warning opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-warning mb-2">
                  {isDataLoading ? '...' : referralData?.referralRate || 10}%
                </div>
                <div className="text-sm text-muted-foreground">Commission Rate</div>
                <div className="mt-3 w-full bg-warning/20 rounded-full h-2">
                  <div
                    className="bg-warning h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${referralData?.referralRate || 10}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-success/10 to-success/5 border-success/30 hover:border-success/50 rounded-2xl hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="bg-gradient-to-br from-success/20 to-success/10 p-2 rounded-xl">
                      <Users className="h-5 w-5 text-success" />
                    </div>
                    Invitees
                  </CardTitle>
                  <Zap className="h-5 w-5 text-success opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-success mb-2">
                  {isDataLoading ? '...' : referralData?.referralDetails?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {referralData?.referralDetails?.length ? 'Active referrals' : 'No referrals yet'}
                </div>
                <div className="mt-3 w-full bg-success/20 rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all duration-300"
                    style={{
                      width: referralData?.referralDetails?.length ? '100%' : '0%',
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50 rounded-2xl hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 p-2 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    Leaderboard
                  </CardTitle>
                  <Target className="h-5 w-5 text-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-500 mb-2">
                  {isDataLoading
                    ? '...'
                    : referralData?.leaderboard?.rank
                    ? `#${referralData.leaderboard.rank}`
                    : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {referralData?.leaderboard?.rank ? 'Leaderboard Rank' : 'Not ranked yet'}
                </div>
                <div className="mt-3 w-full bg-purple-500/20 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: referralData?.leaderboard?.rank ? '85%' : '0%',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-[1]">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Your unique invitation link</CardTitle>
                </div>
                <p className="text-muted-foreground">Share this link and start earning rewards</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {error ? (
                  <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 p-4 rounded-xl border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-destructive rounded-full"></div>
                      <span className="text-sm font-medium text-destructive">Error</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                ) : isLoading || isGenerating ? (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-primary">
                        {isGenerating ? 'Generating...' : 'Loading...'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGenerating
                        ? 'Creating your unique referral code...'
                        : 'Loading your referral code...'}
                    </p>
                  </div>
                ) : referralCode ? (
                  <div className="bg-gradient-to-r from-success/10 to-success/5 p-4 rounded-xl border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-success">Active Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your referral code is active and ready to use!
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-warning/10 to-warning/5 p-4 rounded-xl border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <span className="text-sm font-medium text-warning">No Code</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to generate your referral code
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Referral Link</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                      <Input
                        value={referralLink}
                        readOnly
                        className="pl-8 bg-background/70 border-border/30 font-mono text-sm h-12 focus:ring-2 focus:ring-primary/20"
                        placeholder={
                          isGenerating
                            ? 'Generating...'
                            : isLoading
                            ? 'Loading...'
                            : 'No referral code yet'
                        }
                      />
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      disabled={!referralCode || isLoading || isGenerating}
                      size="lg"
                      variant="outline"
                      className="border-primary/30 hover:border-primary/50 hover:bg-primary/10 px-6 min-w-[120px] transition-all duration-200 hover:scale-[1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-success" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Link copied successfully!
                      </p>
                    </div>
                  )}
                  {referralCode && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                        <Star className="h-4 w-4" />
                        Your referral code: <span className="font-mono">{referralCode}</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/30 rounded-2xl hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-[1]">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-success/20 to-success/10 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-xl">Invite your friends</CardTitle>
                </div>
                <p className="text-muted-foreground">Send personalized invitations to friends</p>
                {userAddress && (
                  <div className="mt-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-2 border border-border/30">
                    <span className="font-medium">From:</span> {userAddress.slice(0, 6)}...
                    {userAddress.slice(-4)}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Quick Invite</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invite friends via email and track their progress. Emails will be sent from your
                    referral address.
                  </p>
                </div>

                <form onSubmit={handleEmailInvite} className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-6 block">
                      Email address
                    </Label>
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSending}
                      className="bg-background/70 border-border/30 h-12 focus:ring-2 focus:ring-success/20 disabled:opacity-50"
                    />
                  </div>

                  {emailSuccess && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">Success!</span>
                      </div>
                      <p className="text-sm text-success">{emailSuccess}</p>
                      {referralCode && (
                        <p className="text-xs text-success/80 mt-2">
                          Referral code{' '}
                          <span className="font-mono font-medium">{referralCode}</span> sent
                          successfully!
                        </p>
                      )}
                    </div>
                  )}

                  {emailError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                        <span className="text-sm font-medium text-destructive">Error</span>
                      </div>
                      <p className="text-sm text-destructive">{emailError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSending || !email || !userAddress}
                    className="w-full bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 transition-all duration-200 hover:scale-[1] h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20 rounded-2xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 mb-16">
            <CardHeader className="text-center pb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/20 to-purple-500/20 px-6 py-3 rounded-full border border-primary/30 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Simple Process</span>
              </div>
              <CardTitle className="text-3xl">How Referrals Work</CardTitle>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow these simple steps to start earning rewards
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/10 h-24 w-24 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Share2 className="h-12 w-12 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Share the referral link</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Copy and share your unique referral link with friends on social media or
                    messaging apps
                  </p>
                </div>

                <div className="text-center group">
                  <div className="bg-gradient-to-br from-success/20 to-success/10 h-24 w-24 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Users className="h-12 w-12 text-success" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Friends Register</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    When friends use your link to sign up, they automatically become your referrals
                  </p>
                </div>

                <div className="text-center group">
                  <div className="bg-gradient-to-br from-warning/20 to-warning/10 h-24 w-24 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Gift className="h-12 w-12 text-warning" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Earn Rewards</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Earn 25% commission on their first deposit and ongoing rewards from their
                    activity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
