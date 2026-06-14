"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { getEmployeeHierarchy, getEmployees } from "@/services/hrms.service";
import { Employee } from "@/types/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

type HierarchyNode = Employee & {
  children?: HierarchyNode[];
};

const OrgChartNode = ({ node, level = 0 }: { node: HierarchyNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const router = useRouter();

  return (
    <div className="flex flex-col items-center">
      {/* Connector Line from Parent */}
      {level > 0 && <div className="w-px h-6 bg-border" />}
      
      <Card 
        className="w-[280px] relative transition-all hover:shadow-md cursor-pointer border-t-4 border-t-primary"
        onClick={() => router.push(`/hrms/employees/${node.id}`)}
      >
        <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
          <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${node.firstName} ${node.lastName}`} />
            <AvatarFallback>{node.firstName?.[0]}{node.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-sm">{node.firstName} {node.lastName}</h4>
            <p className="text-xs text-muted-foreground">{node.designation?.name || "No Designation"}</p>
          </div>
          {node.department && (
            <Badge variant="neutral" className="text-[10px]">
              {node.department.name}
            </Badge>
          )}
          
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -bottom-4 bg-background border shadow-sm w-6 h-6 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Children Container */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center mt-2 relative">
          <div className="w-px h-6 bg-border" />
          
          {/* Horizontal Line Connecting Children */}
          {node.children!.length > 1 && (
            <div className="absolute top-6 border-t border-border" 
              style={{ 
                width: `calc(100% - ${100 / node.children!.length}%)`,
              }} 
            />
          )}

          <div className="flex gap-8 pt-6 relative justify-center">
            {node.children!.map((child) => (
              <OrgChartNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrgChartPage() {
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rootId, setRootId] = useState<string>("");

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    try {
      const emps = await getEmployees({ limit: 100 });
      setEmployees(emps.items || []);
      
      // Auto-select a root (e.g. someone with no manager)
      const potentialRoots = emps.items?.filter((e: any) => !e.managerId) || [];
      if (potentialRoots.length > 0) {
        setRootId(potentialRoots[0].id);
        fetchHierarchy(potentialRoots[0].id);
      } else if (emps.items?.length > 0) {
        setRootId(emps.items[0].id);
        fetchHierarchy(emps.items[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employees");
      setIsLoading(false);
    }
  };

  const fetchHierarchy = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await getEmployeeHierarchy(id);
      setHierarchy(data);
    } catch (error) {
      toast.error("Failed to load organization chart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootChange = (val: string) => {
    setRootId(val);
    fetchHierarchy(val);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Organization Chart" 
          description="View the reporting structure and hierarchy of your organization."
        />
        <div className="flex items-center gap-2">
          <Select value={rootId} onChange={(e) => handleRootChange(e.target.value)} className="w-[250px]">
            <option value="" disabled>Select root employee...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="border rounded-xl bg-muted/10 p-8 overflow-auto min-h-[600px] flex justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            Loading chart...
          </div>
        ) : hierarchy ? (
          <div className="py-8 min-w-max">
            <OrgChartNode node={hierarchy} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            No reporting hierarchy found.
          </div>
        )}
      </div>
    </div>
  );
}
