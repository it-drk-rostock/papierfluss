import { Button, Group, Stack } from "@mantine/core";
import {
  DataTable,
  DataTableColumn,
  DataTableRowExpansionProps,
  useDataTableColumns,
} from "mantine-datatable";
import React from "react";
import { TextIcon } from "./text-icon";
import { IconDatabaseOff } from "@tabler/icons-react";

type MantineTableProps<T> = {
  columns: DataTableColumn<T>[];
  records: T[];
  storeKey: string;
  height?: number;
  minHeightRecords?: number;
  hideColumnsToggle?: boolean;
  idAccessor?: string;
  classes?: {
    root?: string;
    table?: string;
    header?: string;
    footer?: string;
    pagination?: string;
  };
  rowExpansion?: DataTableRowExpansionProps<T> | undefined;
};

export const MantineTable = <T,>({
  columns,
  records,
  storeKey,
  height,
  minHeightRecords,
  hideColumnsToggle = false,
  rowExpansion,
  idAccessor,
}: MantineTableProps<T>) => {
  const {
    effectiveColumns,
    resetColumnsWidth,
    resetColumnsOrder,
    resetColumnsToggle,
  } = useDataTableColumns({
    key: storeKey,
    columns: columns as DataTableColumn<unknown>[],
  });
  return (
    <Stack>
      <DataTable
        {...(height && minHeightRecords && records.length > minHeightRecords
          ? { height }
          : {})}
        withTableBorder
        borderRadius="sm"
        striped
        minHeight={records.length === 0 ? 150 : 0}
        noRecordsText="Keine Einträge vorhanden"
        storeColumnsKey={storeKey}
        columns={effectiveColumns}
        records={records}
        rowExpansion={rowExpansion}
        idAccessor={idAccessor}
        emptyState={
          <TextIcon
            color="gray"
            variant="light"
            icon={IconDatabaseOff}
            text="keine Einträge vorhanden"
          />
        }
      />
      {hideColumnsToggle ? null : (
        <Group justify="right">
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={resetColumnsWidth}
          >
            Spaltenbreite zurücksetzen
          </Button>
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={resetColumnsOrder}
          >
            Spaltenanordnung zurücksetzen
          </Button>
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={resetColumnsToggle}
          >
            Spalten zurücksetzen
          </Button>
        </Group>
      )}
    </Stack>
  );
};
