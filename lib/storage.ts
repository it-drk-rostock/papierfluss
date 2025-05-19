import { S3Client } from "@aws-sdk/client-s3";

export const BUCKET_NAME = "fms";

export const storage = new S3Client({
  endpoint: process.env.NEXT_PUBLIC_STORAGE_URL,
  region: "eu-central-3",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true,
  bucketEndpoint: false,
});
