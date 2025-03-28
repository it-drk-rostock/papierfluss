import React from "react";
import { adminQuery } from "@server/utils/admin-query";

export const AdminLinks = async () => {
  await adminQuery();

  return <div>AdminLinks</div>;
};
