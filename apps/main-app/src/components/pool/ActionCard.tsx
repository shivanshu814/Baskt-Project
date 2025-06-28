import React, { useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Button,
} from '@baskt/ui';
import { ActionCardProps } from '../../types/pool';

export const ActionCard = React.memo(
  ({
    title,
    description,
    icon,
    inputValue,
    setInputValue,
    onAction,
    actionLabel,
    loading,
    color,
    disabled,
    fee,
    onMaxClick,
    expectedOutput,
    unit,
    tokenBalance,
  }: ActionCardProps) => {
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
      },
      [setInputValue],
    );

    return (
      <Card className="shadow-xl border-0 bg-foreground/5 backdrop-blur-md rounded-2xl transition-shadow hover:shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                placeholder={`Enter amount to ${actionLabel.toLowerCase()}`}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="pr-20 text-md font-semibold bg-foreground/5 border border-border focus:border-primary rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={onMaxClick}
                  className="text-xs text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded"
                  type="button"
                >
                  MAX
                </button>
                <span className="text-muted-foreground font-medium">{unit || 'USDC'}</span>
              </div>
            </div>
            {tokenBalance && (
              <div className="text-xs text-muted-foreground mt-1">
                Your {unit}: {tokenBalance}
              </div>
            )}
            <div className="space-y-2 text-sm bg-foreground/5 p-3 rounded-lg">
              {expectedOutput && (
                <div className="flex justify-between text-muted-foreground">
                  <span>You will receive:</span>
                  <span className="font-medium">{expectedOutput}</span>
                </div>
              )}
              {fee && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Fee:</span>
                  <span className="font-medium">{fee}</span>
                </div>
              )}
            </div>
            <Button
              className={`w-full text-base font-bold py-3 rounded-xl shadow-md transition-all duration-200 ${
                color === 'green'
                  ? 'bg-green-500 hover:bg-green-600 focus:ring-green-700'
                  : 'bg-red-500 hover:bg-red-600 focus:ring-red-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={onAction}
              disabled={loading || disabled}
              aria-label={actionLabel}
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center animate-pulse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                  {actionLabel}...
                </div>
              ) : (
                actionLabel
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
);

ActionCard.displayName = 'ActionCard';
