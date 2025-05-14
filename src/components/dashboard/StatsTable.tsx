
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Column<T> = {
  header: string;
  accessorKey: keyof T | ((item: T) => any);
  cell?: (item: T) => React.ReactNode;
};

type StatsTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  title: string;
  description?: string;
};

export default function StatsTable<T>({ data, columns, title, description }: StatsTableProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell 
                        ? column.cell(item)
                        : typeof column.accessorKey === 'function'
                          ? column.accessorKey(item)
                          : (item[column.accessorKey] as React.ReactNode)
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados para exibir
          </div>
        )}
      </CardContent>
    </Card>
  );
}
