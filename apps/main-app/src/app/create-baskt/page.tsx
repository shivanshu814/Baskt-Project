'use client';

import { CreateBasktForm } from '../../components/create-baskt/CreateBasktForm';

export default function CreateBasktPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <CreateBasktForm />
      </div>
    </div>
  );
}
