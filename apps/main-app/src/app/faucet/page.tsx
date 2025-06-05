'use client';
import Faucet from '../../components/faucet/Faucet';

export default function FaucetPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <Faucet />
      </div>
    </div>
  );
}
