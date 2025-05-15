"use server"; // Add this to make it a server action

import { BUCKET_NAME, storage } from "@/lib/storage";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSignedUploadUrls } from "./create-signed-upload-url";

export async function handleFileUpload(files: File[], formId: string) {
  try {
    const uploadPromises = files.map(async (file) => {
      // Pass formId to createSignedUploadUrl
      const uploadData = await createSignedUploadUrls(
        [{ fileName: file.name, contentType: file.type }],
        formId
      );

      if (!uploadData.url || !uploadData.fileUrl) {
        throw new Error("Failed to get upload URL");
      }

      // Upload the file
      await fetch(uploadData.url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Return the permanent file URL
      return {
        file,
        content: uploadData.fileUrl,
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
}

export async function deleteFile(fileUrl: string) {
  try {
    // Extract the key from the URL, maintaining folder structure
    const urlObject = new URL(fileUrl);
    const key = urlObject.pathname.substring(
      urlObject.pathname.indexOf(BUCKET_NAME) + BUCKET_NAME.length + 1
    );

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await storage.send(command);
    return "success";
  } catch (error) {
    console.error("Error deleting file:", error);
    return "error";
  }
}
