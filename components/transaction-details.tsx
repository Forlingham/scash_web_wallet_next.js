"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { NAME_TOKEN } from "@/lib/utils"
import { ArrowDown, ArrowUp, Edit3, User } from "lucide-react"

interface Transaction {
  id: string
  type: "received" | "sent"
  amount: string
  usd: string
  date: string
  status: "completed" | "pending" | "failed"
  sender?: string
  recipient?: string
  wallet: string
  category: string
  note?: string
  currentPrice: string
  priceChange: string
}

interface TransactionDetailsProps {
  transaction: Transaction
  onNavigate: (view: string) => void
}

export function TransactionDetails({ transaction, onNavigate }: TransactionDetailsProps) {
  const { t } = useLanguage()

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {/* Sender/Recipient Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-green-400 text-sm">Sender Name</Label>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <Edit3 className="h-3 w-3 text-green-400" />
                  </Button>
                </div>
                <p className="text-white font-medium">
                  {transaction.type === "received" ? "Received "+NAME_TOKEN : "Sent "+NAME_TOKEN}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-green-400">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Amount */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <Label className="text-green-400 text-sm">{NAME_TOKEN} Amount</Label>
          <div className="text-2xl font-bold text-white">{transaction.amount.replace("+", "").replace("-", "")}</div>
        </CardContent>
      </Card>

      {/* USD Amount */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-green-400 text-sm">Amount in USD</Label>
            <Button variant="ghost" size="sm" className="text-green-400">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xl font-semibold text-white">{transaction.usd}</div>
        </CardContent>
      </Card>

      {/* Current Price */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <Label className="text-green-400 text-sm">Amount at Current Price</Label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-white">{transaction.currentPrice}</span>
            <span className="text-red-400 text-sm">({transaction.priceChange})</span>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Date */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <Label className="text-green-400 text-sm">Date</Label>
          <div className="text-white font-medium">{transaction.date}</div>
        </CardContent>
      </Card>

      {/* Wallet Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <Label className="text-green-400 text-sm">Wallet</Label>
          <div className="text-white font-medium">{transaction.wallet}</div>
        </CardContent>
      </Card>

      {/* Transaction Category */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-green-400 text-sm">类别</Label>
            <Button variant="ghost" size="sm" className="text-green-400">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-white font-medium">{transaction.category}</div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-green-400 text-sm">备注</Label>
            <Button variant="ghost" size="sm" className="text-green-400">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            defaultValue={transaction.note || "Tap to Add Note (Optional)"}
            className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
            placeholder="Add a note..."
          />
        </CardContent>
      </Card>

      {/* Transaction Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === "received" ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {transaction.type === "received" ? (
                  <ArrowDown className="h-4 w-4 text-white" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">
                  {transaction.status === "completed" && "Transaction Completed"}
                  {transaction.status === "pending" && "Transaction Pending"}
                  {transaction.status === "failed" && "Transaction Failed"}
                </p>
                <p className="text-gray-400 text-sm">Transaction ID: {transaction.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
