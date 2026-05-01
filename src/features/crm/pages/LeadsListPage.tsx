import { useQuery } from "@tanstack/react-query";
import { LeadsService } from "../api/leads.service";
import { useCompany } from "@/features/companies/context/company-context";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  User as UserAvatar, 
  Chip, 
  Button,
  Card
} from "@heroui/react";
import { Plus, Search, Filter } from "lucide-react";
import type { LeadStatus } from "../types/leads.types";

const statusColorMap: Record<LeadStatus, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  new: "primary",
  contacted: "warning",
  qualified: "success",
  lost: "danger",
  won: "secondary",
};

export function LeadsListPage() {
  // const { t } = useTranslation();
  const { companyId } = useCompany();

  const { data, isLoading } = useQuery({
    queryKey: ["leads", companyId],
    queryFn: () => LeadsService.getLeads(companyId!),
    enabled: !!companyId,
  });

  if (isLoading) return <LoadingSpinner />;

  const leads = data?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="CRM Leads"
        description="Manage your sales pipeline and track potential customers."
        actions={
          <Button 
            color="primary" 
            startContent={<Plus className="h-4 w-4" />}
            className="rounded-2xl font-bold"
          >
            Add Lead
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-default-50 p-4 rounded-3xl border border-default-100">
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="flat" startContent={<Filter className="h-4 w-4" />} className="rounded-xl">
            Filter
          </Button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-default-100 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="glass-card border-none p-2">
        <Table aria-label="Leads table" removeWrapper className="bg-transparent">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>COMPANY</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>PHONE</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No leads found.">
            {leads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-default-100/50 transition-colors cursor-pointer group">
                <TableCell>
                  <UserAvatar
                    name={lead.name}
                    description={lead.email}
                    avatarProps={{
                      src: `https://avatar.vercel.sh/${lead.email}`,
                      size: "sm"
                    }}
                    className="font-bold"
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium text-default-600">{lead.company}</span>
                </TableCell>
                <TableCell>
                  <Chip 
                    color={statusColorMap[lead.status]} 
                    variant="flat" 
                    size="sm" 
                    className="font-bold uppercase text-[10px]"
                  >
                    {lead.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-default-500 font-mono text-xs">{lead.phone}</span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="light" color="primary" className="font-bold rounded-xl">
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
