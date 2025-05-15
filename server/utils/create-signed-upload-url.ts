"use server";

import { BUCKET_NAME, storage } from "@/lib/storage";
import { formatError } from "@/utils/format-error";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Creates signed URLs for multiple file uploads to S3.
 */
export async function createSignedUploadUrls(
  files: { fileName: string; contentType: string }[],
  formId: string
) {
  try {
    const uploadPromises = files.map(async ({ fileName, contentType }) => {
      const key = `${formId}/${Date.now()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        CacheControl: "max-age=31536000, immutable",
      });

      const url = await getSignedUrl(storage, command, { expiresIn: 3600 });
      const fileUrl = `https://s3.eu-central-3.ionoscloud.com/${BUCKET_NAME}/${key}`;

      return {
        url,
        fileUrl,
        fileName,
      };
    });

    const results = await Promise.all(uploadPromises);
    return {
      message: "Upload URLs created",
      files: results,
    };
  } catch (error) {
    throw formatError(error);
  }
}

/**
 * Deletes multiple files from S3.
 */
export async function deleteFiles(fileUrls: string[]) {
  try {
    const deletePromises = fileUrls.map(async (fileUrl) => {
      const urlObject = new URL(fileUrl);
      const key = urlObject.pathname.substring(
        urlObject.pathname.indexOf(BUCKET_NAME) + BUCKET_NAME.length + 1
      );

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await storage.send(command);
    });

    await Promise.all(deletePromises);
    return { success: true, message: "Files deleted successfully" };
  } catch (error) {
    throw formatError(error);
  }
}
