import { useState } from "react";
import { 
  Button, 
  Card, 
  CardBody, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Input,
} from "@heroui/react";
import { Download, Clock, Search, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { useEmployeesQuery, useAllAttendanceQuery } from "../hooks/use-people";

export default function TimesheetsPage() {
  const { data: employeesResponse, isLoading: isEmployeesLoading } = useEmployeesQuery();
  const { data: attendanceResponse, isLoading: isAttendanceLoading } = useAllAttendanceQuery();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);

  const employees = employeesResponse?.data || [];
  const allLogs = attendanceResponse?.data || [];

  // Calculate target month boundaries
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthOffset);
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
  const today = new Date();
  const actualEnd = endOfMonth > today ? today : endOfMonth;

  // Create a map of employee -> date -> log for quick lookup
  const logMap = new Map<string, any>();
  allLogs.forEach(log => {
    // Only map logs that fall within our target month
    const logDate = new Date(log.date);
    if (logDate >= startOfMonth && logDate <= endOfMonth) {
      logMap.set(`${log.employeeId}_${log.date}`, log);
      // also map by userId just in case
      logMap.set(`${employees.find(e => e.id === log.employeeId)?.userId}_${log.date}`, log);
    }
  });

  // Generate enriched logs with absent days filled in
  const enrichedLogs: any[] = [];

  employees.forEach(employee => {
    const joiningDate = employee.joiningDate ? new Date(employee.joiningDate as Date | string) : new Date();
    // Don't generate days before they joined
    const empStartDate = startOfMonth > joiningDate ? startOfMonth : joiningDate;
    
    // If they joined after this month's end, skip them
    if (empStartDate > actualEnd) return;

    let employeeName = "Unknown Employee";
    if (employee.firstName || employee.lastName) {
      employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    } else if ((employee as any).name) {
      employeeName = (employee as any).name;
    } else if ((employee as any).email) {
      employeeName = (employee as any).email.split('@')[0];
    }

    // Iterate through every day of the month up to today (or month end)
    for (let d = new Date(empStartDate); d <= actualEnd; d.setDate(d.getDate() + 1)) {
      // Skip weekends? Assuming no, we generate every day
      const dateStr = d.toISOString().split('T')[0];
      const key1 = `${employee.id}_${dateStr}`;
      const key2 = `${employee.userId}_${dateStr}`;
      
      const existingLog = logMap.get(key1) || logMap.get(key2);

      if (existingLog) {
        enrichedLogs.push({
          ...existingLog,
          employeeName,
          employeeDept: employee.department || "-"
        });
      } else {
        enrichedLogs.push({
          id: `absent-${employee.id}-${dateStr}`,
          employeeId: employee.id,
          date: dateStr,
          status: 'absent',
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          employeeName,
          employeeDept: employee.department || "-"
        });
      }
    }
  });

  // Sort logs by Date (descending)
  enrichedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter logs by search query (employee name)
  const filteredLogs = enrichedLogs.filter(log => 
    log.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatHours = (decimalHours?: number) => {
    if (!decimalHours) return "-";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const downloadCSV = () => {
    if (filteredLogs.length === 0) return;

    // Define CSV headers
    const headers = ["Date", "Employee Name", "Department", "Check In", "Check Out", "Total Hours", "Status"];
    
    // Convert data to CSV rows
    const csvRows = filteredLogs.map(log => {
      const date = new Date(log.date).toLocaleDateString();
      const checkIn = log.checkIn ? new Date(log.checkIn as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
      const checkOut = log.checkOut ? new Date(log.checkOut as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
      const hours = log.totalHours ? log.totalHours.toFixed(2) : "0";
      
      return `"${date}","${log.employeeName}","${log.employeeDept}","${checkIn}","${checkOut}","${hours}","${log.status}"`;
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheet_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            Company Timesheets
            <Chip size="sm" variant="flat" color="primary" className="font-bold">
              <span className="flex items-center gap-1">
                <FileSpreadsheet size={12} /> Exportable
              </span>
            </Chip>
          </h1>
          <p className="text-default-500 font-medium">
            View and download time logs for all employees across the organization.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            color="primary" 
            variant="shadow" 
            onPress={downloadCSV}
            startContent={<Download size={18} />} 
            isDisabled={filteredLogs.length === 0}
            className="font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow w-full md:w-auto"
          >
            Download CSV
          </Button>
        </div>
      </div>

      <Card className="border border-default-100 shadow-sm">
        <CardBody className="p-0">
          <div className="flex flex-col sm:flex-row p-4 border-b border-default-100 bg-default-50/50 gap-4 justify-between items-center">
            <Input
              placeholder="Search by employee name..."
              startContent={<Search size={16} className="text-default-400" />}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="w-full sm:max-w-sm"
              variant="bordered"
            />
            <div className="flex items-center gap-3 bg-white dark:bg-default-100 rounded-xl p-1 shadow-sm border border-default-200">
              <Button 
                isIconOnly 
                size="sm" 
                variant="light" 
                onPress={() => setMonthOffset(prev => prev - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-bold w-32 text-center">
                {targetDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <Button 
                isIconOnly 
                size="sm" 
                variant="light" 
                onPress={() => setMonthOffset(prev => prev + 1)}
                isDisabled={monthOffset >= 0}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          
          {isEmployeesLoading || isAttendanceLoading ? (
            <div className="p-12 text-center text-default-500 animate-pulse font-medium">
              Loading timesheets...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-default-500 flex flex-col items-center gap-2">
              <Clock size={32} className="text-default-300" />
              <p>No time logs found.</p>
            </div>
          ) : (
            <Table aria-label="Company timesheets" classNames={{ wrapper: "shadow-none rounded-none" }}>
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>EMPLOYEE</TableColumn>
                <TableColumn>DEPARTMENT</TableColumn>
                <TableColumn>CHECK IN</TableColumn>
                <TableColumn>CHECK OUT</TableColumn>
                <TableColumn>HOURS</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, idx) => (
                  <TableRow key={`${log.id}-${idx}`}>
                    <TableCell className="font-medium text-sm text-default-600">
                      {new Date(log.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-sm text-foreground">{log.employeeName}</p>
                    </TableCell>
                    <TableCell className="text-sm">{log.employeeDept}</TableCell>
                    <TableCell className="text-sm">
                      {log.checkIn ? new Date(log.checkIn as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.checkOut ? new Date(log.checkOut as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell className="font-bold text-sm text-primary">
                      {formatHours(log.totalHours)}
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color={log.status === 'present' ? 'success' : log.status === 'late' ? 'warning' : 'danger'} className="capitalize font-bold">
                        {log.status.replace('-', ' ')}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
