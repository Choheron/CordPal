"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue
} from "@heroui/table";

export default function BasicTable(props) {
  const columns: any = props['columns']
  const rows: any = props['rows']
  const table_label = props['table_label']

  return (
      <div className="overflow-y-auto">
        <Table 
          aria-label={table_label}
          isStriped={true}
          isHeaderSticky
        >
          <TableHeader columns={columns}>
            {(column: any) => <TableColumn key={column.key}>{column.label}</TableColumn>}
          </TableHeader>
          <TableBody items={rows}>
            {(item: any) => (
              <TableRow key={item.key}>
                {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
}