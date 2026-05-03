import { NextResponse } from "next/server";
import { HeadObjectCommand, S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET = process.env.R2_BUCKET;

  const diagnostics = {
    envVarsPresent: {
      R2_ACCOUNT_ID: !!R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: !!R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!R2_SECRET_ACCESS_KEY,
      R2_BUCKET: !!R2_BUCKET,
    },
    r2Connection: null as any,
    videoCheck: null as any,
    audioCheck: null as any,
    audioFolderList: [] as any[],
  };

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    return NextResponse.json({
      success: false,
      error: "Missing R2 environment variables",
      diagnostics,
    });
  }

  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Check video
    const videoKey = "videos/Part 1.mp4";
    const videoCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: videoKey,
    });
    const videoResponse = await r2Client.send(videoCommand);

    diagnostics.r2Connection = "SUCCESS";
    diagnostics.videoCheck = {
      key: videoKey,
      exists: true,
      size: videoResponse.ContentLength,
      contentType: videoResponse.ContentType,
    };

    // Check audio - try multiple naming patterns
    const audioKeys = [
      "audio/Part 1.mp3",
      "audio/Part 1.wav",
      "Audio/Part 1.mp3",
      "Audio/Part 1.wav",
    ];

    for (const key of audioKeys) {
      try {
        const audioCommand = new HeadObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        });
        const audioResponse = await r2Client.send(audioCommand);
        diagnostics.audioCheck = {
          key,
          exists: true,
          size: audioResponse.ContentLength,
          contentType: audioResponse.ContentType,
        };
        break;
      } catch {
        // Try next key
      }
    }

    if (!diagnostics.audioCheck) {
      diagnostics.audioCheck = { exists: false, message: "No audio file found for Part 1" };
    }

    // List audio folder contents
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: "audio/",
        MaxKeys: 10,
      });
      const listResponse = await r2Client.send(listCommand);
      diagnostics.audioFolderList = (listResponse.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
      }));
    } catch (listError: any) {
      diagnostics.audioFolderList = [{ error: listError.message }];
    }

    return NextResponse.json({
      success: true,
      message: "R2 connection successful",
      diagnostics,
    });
  } catch (error: any) {
    diagnostics.r2Connection = "FAILED";
    diagnostics.videoCheck = {
      error: error.message,
      code: error.Code || error.code,
      statusCode: error.$metadata?.httpStatusCode,
    };

    return NextResponse.json({
      success: false,
      error: "R2 connection failed",
      diagnostics,
    });
  }
}
