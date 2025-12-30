"use client";

import React from "react";
import { Button, Menu } from "@mantine/core";
import { FormSubmissionStatusBadge } from "@/components/form-submission-status-badge";
import { MenuItemLink } from "@/components/link-menu-item";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { IconArchive, IconTrash } from "@tabler/icons-react";
import { ButtonAction } from "@/components/button-action";
import { deleteFormSubmission } from "../_actions";
import { MantineTable } from "@/components/mantine-table";
import { DataTableColumn } from "mantine-datatable";
import { SubmissionStatus } from "@/generated/prisma/browser";
import { FormSubmissionArchiveForm } from "@/app/(app)/form-submissions/[id]/_components/form-submission-archive-form";
import { FilterSelectInput } from "@/components/filter-select-input";
import { formStatusFilter } from "@/constants/form-status";

interface FormSubmissionData {
  id: string;
  status: SubmissionStatus;
  data: Record<string, unknown> | null;
  submittedBy?: {
    id: string;
    name: string;
  } | null;
}

interface FormData {
  id: string;
  title: string;
  schema: Record<string, unknown>;
  information?: {
    fields: Array<{
      label: string;
      fieldKey: string;
    }>;
  };
  submissions: FormSubmissionData[];
}

interface FormSubmissionsTableProps {
  form: FormData;
}

interface TransformedSubmission {
  id: string;
  status: SubmissionStatus;
  submittedBy?: {
    id: string;
    name: string;
  } | null;
  [key: string]: unknown;
}

export const FormSubmissionsTable = ({ form }: FormSubmissionsTableProps) => {
  // Extract configured information fields
  const configuredFields = form.information?.fields || [];

  // Transform submissions data to include information fields
  const transformedSubmissions: TransformedSubmission[] = form.submissions.map(
    (submission) => {
      const baseData = {
        id: submission.id,
        status: submission.status,
        submittedBy: submission.submittedBy,
      };

      // Add information fields
      const informationFields: Record<string, unknown> = {};
      if (submission.data) {
        configuredFields.forEach((field) => {
          if (field.fieldKey === "status" || field.fieldKey === "actions")
            return;
          informationFields[field.fieldKey] =
            submission.data?.[field.fieldKey] || "-";
        });
      }

      return {
        ...baseData,
        ...informationFields,
      };
    }
  );

  // Build columns dynamically
  const columns: DataTableColumn<TransformedSubmission>[] = [
    // Add dynamic information field columns
    ...configuredFields
      .filter(
        (field) => field.fieldKey !== "status" && field.fieldKey !== "actions"
      )
      .map((field) => ({
        accessor: field.fieldKey as keyof TransformedSubmission,
        title: field.label,
        render: (record: TransformedSubmission) =>
          String(record[field.fieldKey] || "-"),
      })),
    {
      accessor: "submittedBy",
      title: "Eingereicht von",
      render: (record: TransformedSubmission) =>
        record.submittedBy?.name || "-",
    },
    {
      accessor: "status",
      title: "Status",
      filter: <FilterSelectInput field="status" data={formStatusFilter} />,
      render: (record: TransformedSubmission) => (
        <FormSubmissionStatusBadge status={record.status} />
      ),
    },
    {
      accessor: "actions",
      title: "Aktionen",
      render: (record: TransformedSubmission) => (
        <Menu
          shadow="md"
          width={200}
          closeOnItemClick={false}
          closeOnClickOutside={false}
        >
          <Menu.Target>
            <Button variant="light">Aktionen</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <MenuItemLink href={`/form-submissions/${record.id}`}>
              Zum Formular
            </MenuItemLink>
            <ModalMenuItem
              leftSection={<IconArchive size={14} />}
              color="gray"
              title="Archivieren"
              content={<FormSubmissionArchiveForm id={record.id} />}
            >
              Archivieren
            </ModalMenuItem>
            <ModalMenuItem
              leftSection={<IconTrash size={14} />}
              color="red"
              title="Löschen"
              content={
                <ButtonAction
                  fullWidth
                  action={deleteFormSubmission}
                  values={{ id: record.id }}
                >
                  Löschen
                </ButtonAction>
              }
            >
              Löschen
            </ModalMenuItem>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <MantineTable
      records={transformedSubmissions}
      columns={columns}
      storeKey="form-submissions-table"
    />
  );
};
