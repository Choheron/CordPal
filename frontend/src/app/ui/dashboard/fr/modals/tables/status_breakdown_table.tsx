import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table";

export default function StatusBreakdownTable() {
  return (
    <div className="w-full">
      <p className="text-2xl">
        Functionality Request Statuses
      </p>
      <Table removeWrapper aria-label="Functionality Request Status Breakdown Table">
        <TableHeader>
          <TableColumn> </TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Description</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow key="1">
            <TableCell>🟡</TableCell>
            <TableCell>Pending</TableCell>
            <TableCell>Your request has been submitted and is awaiting review.</TableCell>
          </TableRow>
          <TableRow key="2">
            <TableCell>🔍</TableCell>
            <TableCell>Under Review</TableCell>
            <TableCell>Your request is being evaluated by the team.</TableCell>
          </TableRow>
          <TableRow key="3">
            <TableCell>✅</TableCell>
            <TableCell>Approved</TableCell>
            <TableCell>Your request has been approved and will be worked on when prioritized.</TableCell>
          </TableRow>
          <TableRow key="4">
            <TableCell>🚧</TableCell>
            <TableCell>In Progress</TableCell>
            <TableCell>Development is in progress for this request.</TableCell>
          </TableRow>
          <TableRow key="5">
            <TableCell>🚀</TableCell>
            <TableCell>Implemented</TableCell>
            <TableCell>The requested feature has been successfully implemented.</TableCell>
          </TableRow>
          <TableRow key="6">
            <TableCell>❌</TableCell>
            <TableCell>Rejected</TableCell>
            <TableCell>The request was reviewed but will not be implemented.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}