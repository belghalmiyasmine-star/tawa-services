"use client";

import { useEffect, useState } from "react";
import { DollarSign, Clock, TrendingUp, Percent } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  getProviderEarningsAction,
  getMonthlyBreakdownAction,
  getTransactionHistoryAction,
  type EarningsSummary,
  type MonthlyBreakdown,
  type TransactionItem,
} from "@/features/payment/actions/earnings-queries";
import { requestWithdrawalAction } from "@/features/payment/actions/withdrawal-actions";
import { MonthlyBreakdownTable } from "./MonthlyBreakdownTable";
import { TransactionHistoryList } from "./TransactionHistoryList";

// ============================================================
// BALANCE CARD
// ============================================================

interface BalanceCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
}

function BalanceCard({
  title,
  amount,
  icon,
  colorClass,
  isLoading,
}: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${colorClass} opacity-80`}>{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <p className={`text-2xl font-bold ${colorClass}`}>
            {amount.toFixed(2)}{" "}
            <span className="text-base font-normal text-muted-foreground">
              TND
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export function EarningsDashboard() {
  const { toast } = useToast();

  // Data state
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyBreakdown[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // UI state
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  // Withdrawal dialog state
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  // --------------------------------------------------------
  // Fetch all data on mount
  // --------------------------------------------------------

  const fetchEarnings = async () => {
    setIsLoadingEarnings(true);
    const result = await getProviderEarningsAction();
    if (result.success) {
      setEarnings(result.data);
    }
    setIsLoadingEarnings(false);
  };

  useEffect(() => {
    void fetchEarnings();

    getMonthlyBreakdownAction().then((result) => {
      if (result.success) {
        setMonthlyData(result.data);
      }
      setIsLoadingMonthly(false);
    });

    getTransactionHistoryAction().then((result) => {
      if (result.success) {
        setTransactions(result.data);
      }
      setIsLoadingTx(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------
  // Withdrawal request handler
  // --------------------------------------------------------

  const handleWithdrawalSubmit = async () => {
    const amount = parseFloat(withdrawalAmount);

    if (isNaN(amount) || amount < 50) {
      toast({
        title: "Montant invalide",
        description: "Le montant minimum de retrait est de 50 TND",
        variant: "destructive",
      });
      return;
    }

    const available = earnings?.available ?? 0;
    if (amount > available) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde disponible est de ${available.toFixed(2)} TND`,
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);
    const result = await requestWithdrawalAction(amount);
    setIsRequesting(false);

    if (result.success) {
      toast({
        title: "Demande envoyee",
        description: "Demande de virement envoyee avec succes",
      });
      setWithdrawalOpen(false);
      setWithdrawalAmount("");
      // Refresh earnings to reflect updated available balance
      void fetchEarnings();
    } else {
      toast({
        title: "Erreur",
        description: result.error ?? "Erreur lors de la demande de retrait",
        variant: "destructive",
      });
    }
  };

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  const available = earnings?.available ?? 0;

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <BalanceCard
          title="Disponible"
          amount={earnings?.available ?? 0}
          icon={<DollarSign className="h-4 w-4" />}
          colorClass="text-green-600 dark:text-green-400"
          isLoading={isLoadingEarnings}
        />
        <BalanceCard
          title="En attente"
          amount={earnings?.pending ?? 0}
          icon={<Clock className="h-4 w-4" />}
          colorClass="text-amber-600 dark:text-amber-400"
          isLoading={isLoadingEarnings}
        />
        <BalanceCard
          title="Total gagne"
          amount={earnings?.totalEarned ?? 0}
          icon={<TrendingUp className="h-4 w-4" />}
          colorClass="text-blue-600 dark:text-blue-400"
          isLoading={isLoadingEarnings}
        />
        <BalanceCard
          title="Commissions"
          amount={earnings?.totalCommission ?? 0}
          icon={<Percent className="h-4 w-4" />}
          colorClass="text-muted-foreground"
          isLoading={isLoadingEarnings}
        />
      </div>

      {/* Withdrawal section */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <p className="font-medium">Demander un virement</p>
          <p className="text-sm text-muted-foreground">
            Montant minimum : 50 TND
          </p>
        </div>
        <Button
          onClick={() => setWithdrawalOpen(true)}
          disabled={available < 50}
        >
          Demander un virement
        </Button>
      </div>

      {/* Tabs: monthly breakdown + transaction history */}
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Recapitulatif mensuel</TabsTrigger>
          <TabsTrigger value="history">Historique des transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          {isLoadingMonthly ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ) : (
            <MonthlyBreakdownTable data={monthlyData} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {isLoadingTx ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <TransactionHistoryList data={transactions} />
          )}
        </TabsContent>
      </Tabs>

      {/* Withdrawal dialog */}
      <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de virement</DialogTitle>
            <DialogDescription>
              Solde disponible :{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">
                {available.toFixed(2)} TND
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Montant du retrait (TND)</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                min="50"
                max={available}
                step="0.01"
                placeholder="Ex : 100.00"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Montant minimum : 50 TND
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWithdrawalOpen(false);
                setWithdrawalAmount("");
              }}
              disabled={isRequesting}
            >
              Annuler
            </Button>
            <Button onClick={() => void handleWithdrawalSubmit()} disabled={isRequesting}>
              {isRequesting ? "Envoi en cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
