import { Coins, Shield, TrendingUp, Users } from 'lucide-react';

const STATS = [
  {
    icon: TrendingUp,
    value: 'AI-Powered',
    label: 'Rebalancing',
    description: 'Minimize losses automatically',
  },
  {
    icon: Users,
    value: 'Unlimited',
    label: 'Assets per Baskt',
    description: 'Create complex portfolios',
  },
  {
    icon: Coins,
    value: 'BLP',
    label: 'Token System',
    description: 'Seamless trading experience',
  },
  {
    icon: Shield,
    value: 'Smart',
    label: 'Risk Management',
    description: 'AI-driven protection',
  },
] as const;

export function Stats() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Platform Statistics</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Trusted by thousands of users with proven performance metrics
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-10 w-10 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-lg font-semibold mb-2">{stat.label}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
