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
import { useState } from 'react';

export function ReferralDashboard() {
  const { userAddress } = useUser();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');

  // Mock data - showing actual values instead of "Coming Soon"
  const referralLink = userAddress
    ? `https://baskt.app?via=${userAddress.slice(0, 8)}`
    : 'https://baskt.app?via=DEMO123';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Invitation sent to ${email}`);
      setEmail('');
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-16 pb-20 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Beautiful Header */}
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

          {/* Enhanced Stats Grid */}
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
                <div className="text-4xl font-bold text-primary mb-2">125</div>
                <div className="text-sm text-muted-foreground">+25 this week</div>
                <div className="mt-3 w-full bg-primary/20 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
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
                <div className="text-4xl font-bold text-warning mb-2">75%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="mt-3 w-full bg-warning/20 rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full" style={{ width: '75%' }}></div>
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
                <div className="text-4xl font-bold text-success mb-2">24</div>
                <div className="text-sm text-muted-foreground">+3 this month</div>
                <div className="mt-3 w-full bg-success/20 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '75%' }}></div>
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
                <div className="text-4xl font-bold text-purple-500 mb-2">#12</div>
                <div className="text-sm text-muted-foreground">Top 15%</div>
                <div className="mt-3 w-full bg-purple-500/20 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Enhanced Referral Link Section */}
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
                <div className="bg-gradient-to-r from-success/10 to-success/5 p-4 rounded-xl border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-success">Active Status</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your referral code is active and ready to use!
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Referral Link</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                      <Input
                        value={referralLink}
                        readOnly
                        className="pl-8 bg-background/70 border-border/30 font-mono text-sm h-12 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      size="lg"
                      variant="outline"
                      className="border-primary/30 hover:border-primary/50 hover:bg-primary/10 px-6 min-w-[120px] transition-all duration-200 hover:scale-[1]"
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
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1] h-12 font-medium">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate New Invite Code
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Email Invite Section */}
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/30 rounded-2xl hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-[1]">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-success/20 to-success/10 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-xl">Invite your friends</CardTitle>
                </div>
                <p className="text-muted-foreground">Send personalized invitations to friends</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Quick Invite</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invite friends via email and track their progress
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
                      className="bg-background/70 border-border/30 h-12 focus:ring-2 focus:ring-success/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 transition-all duration-200 hover:scale-[1] h-12 font-medium"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced How It Works */}
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
