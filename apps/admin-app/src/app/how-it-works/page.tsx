'use client';

import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/src/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/src/accordion';
import { Layers, MousePointer, TrendingUp, Rocket, Check, Search, Star } from 'lucide-react';

const HowItWorks = () => {
  const features = [
    {
      icon: (
        <Layers className="h-10 w-10 p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg text-primary" />
      ),
      title: 'Top On-Chain Narratives',
      description: 'Get exposure to emerging narratives in 1 click',
    },
    {
      icon: (
        <TrendingUp className="h-10 w-10 p-2 bg-gradient-to-br from-orange-400/20 to-amber-300/10 rounded-lg text-orange-400" />
      ),
      title: 'Spot Trends Early',
      description: 'Find your next 100x baskt with curated narrative indices',
    },
    {
      icon: (
        <Search className="h-10 w-10 p-2 bg-gradient-to-br from-green-400/20 to-emerald-300/10 rounded-lg text-green-400" />
      ),
      title: 'Auto-Weighted Exposure',
      description: 'Smart contracts maintain optimal weights for the hottest tokens',
    },
    {
      icon: (
        <Star className="h-10 w-10 p-2 bg-gradient-to-br from-yellow-400/20 to-yellow-300/10 rounded-lg text-yellow-400" />
      ),
      title: 'Non-Custodial',
      description: 'Your assets are always under your control with Solana security',
    },
    {
      icon: (
        <Rocket className="h-10 w-10 p-2 bg-gradient-to-br from-rose-400/20 to-pink-300/10 rounded-lg text-rose-400" />
      ),
      title: 'Instant Trading',
      description: 'Buy and sell narrative indices with one click',
    },
    {
      icon: (
        <Check className="h-10 w-10 p-2 bg-gradient-to-br from-blue-400/20 to-indigo-300/10 rounded-lg text-blue-400" />
      ),
      title: 'Performance Tracking',
      description: 'Monitor your narrative portfolio in real-time',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Choose Your Narrative',
      description: 'Select from our curated indices tracking the hottest narratives',
      icon: <Layers className="h-6 w-6 text-primary" />,
    },
    {
      number: '2',
      title: 'Buy with One Click',
      description: 'Get instant exposure to multiple tokens in a single transaction',
      icon: <MousePointer className="h-6 w-6 text-primary" />,
    },
    {
      number: '3',
      title: 'Watch It Grow',
      description: 'Track performance and rebalancing happens automatically',
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
    },
  ];

  const faqs = [
    {
      question: 'What is baskt.fun?',
      answer:
        'A decentralized protocol for trading index tokens that track crypto market narratives. Each basket represents a carefully weighted portfolio of tokens within a specific theme.',
    },
    {
      question: 'How do baskets work?',
      answer:
        'When you buy a basket token, you get proportional exposure to all assets in that index. Smart contracts automatically maintain the correct weights and handle rebalancing.',
    },
    {
      question: 'What are the fees?',
      answer:
        'Baskt charges a small management fee (0.5-1% annually) and a performance fee on profits (5-10%). Trading fees are standard Solana network fees, which are minimal.',
    },
    {
      question: 'Are my assets safe?',
      answer:
        'Yes, Baskt is built on Solana with non-custodial smart contracts. Your assets remain under your control at all times, and all contracts are audited for security.',
    },
    {
      question: 'How is each basket weighted?',
      answer:
        'Baskets follow transparent weighting rules based on market cap, trading volume, and other on-chain metrics. Weights are automatically adjusted monthly.',
    },
    {
      question: 'Can I create my own basket?',
      answer:
        'Yes, $BASKT token holders can propose and vote on new baskets. Creation requires meeting minimum criteria for liquidity and market cap.',
    },
    {
      question: 'How do I start trading?',
      answer:
        "Connect your Solana wallet, select a basket that matches your investment strategy, provide collateral, and choose to go long or short. It's that simple!",
    },
    {
      question: 'What happens if a token in the basket gets delisted?',
      answer:
        'Our smart contracts automatically rebalance the basket, redistributing the weight to other assets. This protects investors from significant exposure to failing tokens.',
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">How It Works</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start trading narrative indices in minutes
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {steps.map((step) => (
              <Card
                key={step.number}
                className="border-2 hover:border-primary transition-colors duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <span className="text-2xl font-bold">{step.number}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <div className="text-muted-foreground">{step.description}</div>
                    <div className="mt-4">{step.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-12 bg-secondary/5 rounded-xl my-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Simplifying Aping into the Top On-Chain Narratives
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant exposure to trending narratives with our curated indices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 overflow-hidden hover-scale"
              >
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Indices */}
        <section className="py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Featured in Our Indices</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get exposure to the most successful narrative tokens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark:bg-black/40 backdrop-blur-md border border-border rounded-lg p-4 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                    AI
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Index</h3>
                    <p className="text-sm text-muted-foreground">
                      Next gen mindshare and attention capture by AI
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-border">
                  <div>
                    <div className="text-muted-foreground mb-1">AUM</div>
                    <div className="font-medium">$31.78K</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Volume</div>
                    <div className="font-medium">$648.61K</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Supply</div>
                    <div className="font-medium">340.84</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-black/40 backdrop-blur-md border border-border rounded-lg p-4 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-teal-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                    ♈
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Astrofolio Index</h3>
                    <p className="text-sm text-muted-foreground">
                      Index of all 12 astrological coins
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-border">
                  <div>
                    <div className="text-muted-foreground mb-1">AUM</div>
                    <div className="font-medium">$12.79K</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Volume</div>
                    <div className="font-medium">$118.74K</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Supply</div>
                    <div className="font-medium">400.50</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-black/40 backdrop-blur-md border border-border rounded-lg p-4 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-amber-500 to-red-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                    M
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Murad Index</h3>
                    <p className="text-sm text-muted-foreground">
                      Memecoin index from ..MustStopMurad
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-border">
                  <div>
                    <div className="text-muted-foreground mb-1">AUM</div>
                    <div className="font-medium">$2.16K</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Volume</div>
                    <div className="font-medium">$44.98K</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Supply</div>
                    <div className="font-medium">28.55</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/40 mx-auto rounded-full"></div>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </Layout>
  );
};

export default HowItWorks;
