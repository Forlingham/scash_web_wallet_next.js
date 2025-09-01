"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { ArrowDown, ArrowUp, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TransactionDetails } from "@/components/transaction-details"
import { NAME_TOKEN } from "@/lib/utils"

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

interface WalletAssetsProps {
  onNavigate: (view: string) => void
}

export function WalletAssets({ onNavigate }: WalletAssetsProps) {
  const { t } = useLanguage()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "received" | "sent">("all")

  const transactions: Transaction[] = [
    {
      id: "tx_001",
      type: "received",
      amount: "+R 770.01",
      usd: "$10.95",
      date: "2025-08-25 03:59:58",
      status: "completed",
      wallet: "我的渡鸦币 (RVN)",
      category: "收入",
      currentPrice: "$ 10.65",
      priceChange: "-2.69%",
      note: "Payment received",
    },
    {
      id: "tx_002",
      type: "sent",
      amount: "-R 12,790.26",
      usd: "$188.93",
      date: "2025-07-11 3:38 PM",
      status: "completed",
      wallet: "我的渡鸦币 (RVN)",
      category: "支出",
      currentPrice: "$ 188.93",
      priceChange: "-1.25%",
    },
    {
      id: "tx_003",
      type: "received",
      amount: "+R 25.88",
      usd: "$0.33",
      date: "2025-07-09 4:29 PM",
      status: "completed",
      wallet: "我的渡鸦币 (RVN)",
      category: "收入",
      currentPrice: "$ 0.33",
      priceChange: "+0.15%",
    },
    {
      id: "tx_004",
      type: "received",
      amount: "+R 30.04",
      usd: "$0.38",
      date: "2025-07-09 1:28 PM",
      status: "completed",
      wallet: "我的渡鸦币 (RVN)",
      category: "收入",
      currentPrice: "$ 0.38",
      priceChange: "+0.22%",
    },
    {
      id: "tx_005",
      type: "received",
      amount: "+R 127.18",
      usd: "$1.61",
      date: "2025-07-09 10:29 AM",
      status: "completed",
      wallet: "我的渡鸦币 (RVN)",
      category: "收入",
      currentPrice: "$ 1.61",
      priceChange: "+0.08%",
    },
  ]

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.wallet.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterType === "all" || tx.type === filterType

    return matchesSearch && matchesFilter
  })

  if (selectedTransaction) {
    return (
      <TransactionDetails
        transaction={selectedTransaction}
        onNavigate={(view) => {
          if (view === "back") {
            setSelectedTransaction(null)
          } else {
            onNavigate(view)
          }
        }}
      />
    )
  }

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {/* Price Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="h-48 bg-gray-900 rounded-lg flex items-end justify-between p-4 relative overflow-hidden">
            <div className="text-green-400 text-sm absolute top-4 left-4">$0.0163</div>
            <div className="text-green-400 text-sm absolute bottom-4 right-4">$0.0130</div>
            <div className="text-gray-400 text-xs absolute bottom-4 left-4">25-07-26</div>
            <div className="text-gray-400 text-xs absolute bottom-4 right-20">25-08-25</div>

            {/* Enhanced chart line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 180">
              <path
                d="M20,120 Q60,100 100,110 T180,90 T260,105 T340,85 T400,95"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M20,120 Q60,100 100,110 T180,90 T260,105 T340,85 T400,95 L400,180 L20,180 Z"
                fill="url(#gradient)"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Transactions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          onClick={() => {
            const nextFilter = filterType === "all" ? "received" : filterType === "received" ? "sent" : "all"
            setFilterType(nextFilter)
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          {filterType === "all" && "All"}
          {filterType === "received" && "Received"}
          {filterType === "sent" && "Sent"}
        </Button>
      </div>

      {/* Recent Transactions Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium text-lg">{t("transactions.recent")}</h3>
        <span className="text-gray-400 text-sm">{filteredTransactions.length} transactions</span>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.map((tx) => (
          <Card
            key={tx.id}
            className="bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors"
            onClick={() => setSelectedTransaction(tx)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "received" ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {tx.type === "received" ? (
                      <ArrowDown className="h-5 w-5 text-white" />
                    ) : (
                      <ArrowUp className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {tx.type === "received" ? t("transactions.received") : t("transactions.sent")} {NAME_TOKEN}
                    </p>
                    <p className="text-gray-400 text-sm">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-lg ${tx.type === "received" ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount}
                  </p>
                  <p className="text-gray-400 text-sm">{tx.usd}</p>
                </div>
              </div>

              {/* Transaction Status Indicator */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      tx.status === "completed"
                        ? "bg-green-400"
                        : tx.status === "pending"
                          ? "bg-yellow-400"
                          : "bg-red-400"
                    }`}
                  />
                  <span className="text-gray-400 text-xs capitalize">{tx.status}</span>
                </div>
                <span className="text-gray-500 text-xs">ID: {tx.id}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No transactions found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  )
}
