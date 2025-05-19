import { authQuery } from "@/server/utils/auth-query";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { formatError } from "@/utils/format-error";
import { redirect } from "next/navigation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let submissionId: string;
  try {
    const { user } = await authQuery();

    const formId = (await params).id;

    // Check if form exists and is active
    const form = await prisma.form.findUnique({
      where: {
        id: formId,
        OR: [
          { isPublic: true },
          {
            teams: {
              some: {
                users: {
                  some: { id: user.id },
                },
              },
            },
          },
        ],
      },
      select: { isActive: true },
    });

    if (!form?.isActive) {
      return new Response(
        "Das Formular ist zurzeit nicht aktiv, existiert nichtmehr oder sie haben keine Berechtigung.",
        { status: 404 }
      );
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        submittedById: user.id,
      },
    });

    submissionId = submission.id;
  } catch (error) {
    const formattedError = formatError(error);
    return new Response(formattedError.message, { status: 500 });
  }

  redirect(`/form-submissions/${submissionId}`);
}
