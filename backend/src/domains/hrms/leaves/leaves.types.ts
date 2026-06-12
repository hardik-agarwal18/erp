
export interface ApplyForLeaveInput {
  employeeId: string;
  leaveTypeId: string;
  fromDate: Date | string;
  toDate: Date | string;
  totalDays: number;
  reason: string;
}

export interface LeaveBalanceUpdateInput {
  employeeId: string;
  leaveTypeId: string;
  allocated?: number;
  used?: number;
}
