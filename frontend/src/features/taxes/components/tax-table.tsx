"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { type Tax } from "@/types/app";
import { useTaxMutations } from "../hooks/use-tax-mutations";

export function TaxTable({ taxes }: { taxes: Tax[] }) {
  const { archiveTax } = useTaxMutations();

  return (
    <div className="rounded-md border border-border bg-card overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Tax Name</TableHeaderCell>
            <TableHeaderCell>Rate</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Default</TableHeaderCell>
            <TableHeaderCell className="w-[80px]"></TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxes.map((tax) => (
            <TableRow key={tax.id}>
              <TableCell className="font-medium">{tax.name}</TableCell>
              <TableCell>{tax.rate}%</TableCell>
              <TableCell>
                <Badge variant="neutral">{tax.type.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>
                {tax.isDefault && <Badge variant="info">Default</Badge>}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/taxes/${tax.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Tax
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      onClick={() => archiveTax.mutate(tax.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Archive Tax
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {taxes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No taxes found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
