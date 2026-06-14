import { useEffect, useState } from "react";
import { getBankAccounts, BankAccount } from "@/services/treasury.service";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface BankAccountSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function BankAccountSelector({ value, onChange, disabled }: BankAccountSelectorProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBankAccounts()
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading accounts...
      </div>
    );
  }

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="" disabled>Select bank account</option>
      {accounts.map((acc) => (
        <option key={acc.id} value={acc.id}>
          {acc.name} {acc.accountNumber ? `(..${acc.accountNumber.slice(-4)})` : ""}
        </option>
      ))}
    </Select>
  );
}
