import { Brain, Plus, Wallet } from 'lucide-react';

const FEATURES = [
  {
    icon: Plus,
    title: 'Create Custom Baskts',
    description:
      'Build your own baskts with multiple assets - minimum 2 assets, no maximum limit. Design portfolios that match your strategy.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Rebalancing',
    description:
      'Automatic rebalancing of assets within baskts using AI to minimize losses and maximize returns for users.',
  },
  {
    icon: Wallet,
    title: 'Trade & Pool Management',
    description:
      'Trade existing baskts or your own creations. Deposit funds, get BLP tokens, and manage your portfolio with ease.',
  },
] as const;

export function Features() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Core Features</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Everything you need to create, trade, and manage your crypto baskts
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
