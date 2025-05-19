"use client";

import React, { useEffect, useState } from "react";
import "survey-analytics/survey.analytics.tabulator.css";
import "tabulator-tables/dist/css/tabulator.min.css";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);
// import * as XLSX from "xlsx";

import { Tabulator } from "survey-analytics/survey.analytics.tabulator";
import { Model } from "survey-core";
import { ButtonLink } from "@/components/button-link";
import { useRouter } from "next/navigation";

export const FormSubmissionsTable = ({
  json,
  data,
}: {
  json: any;
  data: Array<{ data: any }>;
}) => {
  const router = useRouter();
  let [vizPanel, setVizPanel] = useState<Tabulator>();

  // Transform the submissions data to the required format
  const transformedData = data.map((submission) => submission.data);

  if (!vizPanel) {
    const survey = new Model(json);

    vizPanel = new Tabulator(survey, transformedData, {
      jspdf: jsPDF,
      // xlsx: XLSX,
    });

    // Add custom detail actions renderer
    vizPanel.renderDetailActions = (container: HTMLElement, row: any) => {
      const link = document.createElement("a");
      link.href = `/forms/${row.getData().id}`;
      link.className =
        "mantine-button mantine-Button-filled mantine-Button-root";
      link.textContent = "View";
      container.appendChild(link);
      return container;
    };

    setVizPanel(vizPanel);
  }

  useEffect(() => {
    vizPanel?.render("summaryContainer");
  }, [vizPanel]);

  return (
    <div style={{ height: "80vh", width: "100%" }} id="summaryContainer"></div>
  );
};
