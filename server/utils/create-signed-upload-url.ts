"use server";

import { BUCKET_NAME, storage } from "@/lib/storage";
import { formatError } from "@/utils/format-error";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Creates a signed URL for file uploads to S3.
 *
 * @param fileName - The name of the file to be uploaded
 * @param contentType - The MIME type of the file
 * @returns Object containing the signed URL and the final file URL
 * @throws {Error} If the S3 operation fails
 */
export async function createSignedUploadUrl(
  fileName: string,
  contentType: string
) {
  try {
    const key = `${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      CacheControl: "max-age=31536000, immutable",
    });

    const url = await getSignedUrl(storage, command, { expiresIn: 3600 });
    const fileUrl = `https://s3.eu-central-3.ionoscloud.com/${BUCKET_NAME}/${key}`;

    return {
      message: "Upload URL created",
      url,
      fileUrl,
    };
  } catch (error) {
    throw formatError(error);
  }
}
