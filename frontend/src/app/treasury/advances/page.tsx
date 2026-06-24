"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { getAdvances, getAdvanceSettlements, getAdvanceTimeline, Advance } from "@/services/advances.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink } from "lucide-react";

export default function AdvancesWorkspacePage() {
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);

  const { data: allAdvances, isLoading: loadingAdvances } = useQuery({
    queryKey: ["advances", "all"],
    queryFn: () => getAdvances(),
  });

  const { data: outstandingAdvances } = useQuery({
    queryKey: ["advances", "outstanding"],
    queryFn: () => getAdvances({ status: "ISSUED" }),
  });

  const { data: overdueAdvances } = useQuery({
    queryKey: ["advances", "overdue"],
    queryFn: () => getAdvances({ status: "ISSUED", isOverdue: "true" }), // Assuming backend can handle isOverdue or we filter manually
  });

  const { data: settlements, isLoading: loadingSettlements } = useQuery({
    queryKey: ["advances", "settlements"],
    queryFn: () => getAdvanceSettlements(),
  });

  const { data: timeline } = useQuery({
    queryKey: ["advances", "timeline", selectedAdvanceId],
    queryFn: () => getAdvanceTimeline(selectedAdvanceId!),
    enabled: !!selectedAdvanceId,
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="neutral" className="text-slate-500 bg-slate-100">Draft</Badge>;
      case "ISSUED": return <Badge variant="info">Issued</Badge>;
      case "PARTIALLY_SETTLED": return <Badge variant="warning">Partially Settled</Badge>;
      case "SETTLED": return <Badge variant="success">Settled</Badge>;
      case "VOID": return <Badge variant="danger">Void</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const selectedAdvance = allAdvances?.find(a => a.id === selectedAdvanceId);

  const renderAdvanceTable = (data: Advance[] | undefined, isLoading: boolean) => (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Advance No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((adv) => (
                <TableRow key={adv.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedAdvanceId(adv.id)}>
                  <TableCell className="font-medium">{adv.advanceNumber}</TableCell>
                  <TableCell>{format(new Date(adv.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>{adv.type.replace('_', ' ')}</TableCell>
                  <TableCell>{getStatusBadge(adv.status)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(adv.amount)}</TableCell>
                  <TableCell className="text-right font-medium text-slate-900">{formatCurrency(adv.outstandingAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center text-muted-foreground">No advances found.</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppShell activePath="/treasury/advances">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-8 pt-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Advances Workspace</h2>
              <p className="text-muted-foreground mt-1">Manage employee, vendor, and customer advances.</p>
            </div>
            <Button>Issue Advance</Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Advances</TabsTrigger>
              <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="settlements">Settlements</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0 border rounded-xl bg-white overflow-hidden">
              {renderAdvanceTable(allAdvances, loadingAdvances)}
            </TabsContent>

            <TabsContent value="outstanding" className="mt-0 border rounded-xl bg-white overflow-hidden">
              {renderAdvanceTable(outstandingAdvances, loadingAdvances)}
            </TabsContent>

            <TabsContent value="overdue" className="mt-0 border rounded-xl bg-white overflow-hidden">
              {renderAdvanceTable(allAdvances?.filter(a => a.status === 'ISSUED' && new Date(a.dueDate) < new Date()), loadingAdvances)}
            </TabsContent>

            <TabsContent value="settlements" className="mt-0 border rounded-xl bg-white overflow-hidden">
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  {loadingSettlements ? (
                    <div className="py-12 text-center text-muted-foreground">Loading...</div>
                  ) : settlements && settlements.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Settlement No.</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Advance</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlements.map((set) => (
                          <TableRow key={set.id} className={set.reversedAt ? "opacity-50" : ""}>
                            <TableCell className="font-medium flex items-center gap-2">
                              {set.settlementNumber}
                              {set.reversedAt && <Badge variant="neutral" className="text-[10px] bg-slate-100">Reversed</Badge>}
                            </TableCell>
                            <TableCell>{format(new Date(set.settlementDate), "MMM d, yyyy")}</TableCell>
                            <TableCell className="text-blue-600 hover:underline cursor-pointer" onClick={() => setSelectedAdvanceId(set.advance.id)}>
                              {set.advance?.advanceNumber}
                            </TableCell>
                            <TableCell>{set.type.replace('_', ' ')}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(set.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">No settlements found.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel (Right Drawer) */}
        {selectedAdvanceId && selectedAdvance && (
          <div className="w-[450px] border-l bg-white shadow-xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{selectedAdvance.advanceNumber}</h3>
                  {getStatusBadge(selectedAdvance.status)}
                </div>
                <p className="text-sm text-slate-500">Issued {format(new Date(selectedAdvance.createdAt), "MMM d, yyyy")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAdvanceId(null)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-8">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Total Amount</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(selectedAdvance.amount)}</p>
                </div>
                <div className="rounded-xl border bg-blue-50/50 border-blue-100 p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wider">Outstanding</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedAdvance.outstandingAmount)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedAdvance.outstandingAmount && Number(selectedAdvance.outstandingAmount) > 0 && (
                <div className="flex gap-2">
                  <Button className="flex-1" variant="default">Settle Advance</Button>
                  <Button className="flex-1" variant="outline">Reverse</Button>
                </div>
              )}

              {/* Timeline Feed */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b pb-2">Activity Timeline</h4>
                {timeline ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {timeline.map((event, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-[3px] md:ml-0 z-10"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-100 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900">{event.eventType}</span>
                            <span className="text-xs text-slate-500">{format(new Date(event.date), "MMM d")}</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {event.eventType === 'CREATED' && 'Advance drafted'}
                            {event.eventType === 'ISSUED' && `Issued via journal ${event.reference}`}
                            {event.eventType === 'SETTLED' && `Settled (${event.metadata?.type}) - Ref: ${event.reference}`}
                            {event.eventType === 'SETTLEMENT_REVERSED' && `Settlement reversed - Ref: ${event.reference}`}
                            {event.eventType === 'REVERSED' && 'Advance reversed'}
                          </p>
                          {event.amount && (
                            <p className="text-sm font-medium text-slate-900 mt-2">{formatCurrency(event.amount)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Loading timeline...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
