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
import { useRouter } from "next/navigation";

export const FormSubmissionsTable = ({
  json,
  data,
}: {
  json: any;
  data: Array<{ data: any; id: string; status: string }>;
}) => {
  const router = useRouter();
  let [vizPanel, setVizPanel] = useState<Tabulator>();

  useEffect(() => {
    // Clear existing content
    const container = document.getElementById("summaryContainer");
    if (container) {
      container.innerHTML = "";
    }

    // Filter out entries where data is null
    const validData = data.filter((submission) => submission.data !== null);

    if (validData.length > 0) {
      try {
        // Transform the data into an array of objects
        const transformedData = validData.map((submission) => ({
          ...submission.data,
          id: submission.id,
          status: submission.status,
        }));

        const survey = new Model(json);
        const panel = new Tabulator(survey, transformedData, {
          jspdf: jsPDF,
          // xlsx: XLSX,
        });

        panel.render("summaryContainer");
        setVizPanel(panel);
      } catch (error) {
        console.error("Error initializing Tabulator:", error);
      }
    } else {
      console.log("No valid submissions to display");
    }
  }, [json, data]);

  return (
    <div style={{ height: "80vh", width: "100%" }} id="summaryContainer"></div>
  );
};
