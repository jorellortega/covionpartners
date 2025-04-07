import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface WithdrawalRecord {
  id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
}

interface PaymentHistoryTableProps {
  withdrawals: WithdrawalRecord[]
}

export function PaymentHistoryTable({ withdrawals }: PaymentHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {withdrawals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4">
              No withdrawal history found
            </TableCell>
          </TableRow>
        ) : (
          withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal.id}>
              <TableCell>{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
              <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
              <TableCell>{withdrawal.payment_method}</TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs ${
                    withdrawal.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : withdrawal.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {withdrawal.status.toUpperCase()}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

