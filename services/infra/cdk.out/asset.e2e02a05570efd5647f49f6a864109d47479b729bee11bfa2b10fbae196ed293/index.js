"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// services/lambdas/create-upload/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_crypto = require("crypto");
var bucketName = process.env.UPLOADS_BUCKET_NAME;
var tableName = process.env.VIDEOS_TABLE_NAME;
var ddb = new import_client_dynamodb.DynamoDBClient({});
var s3 = new import_client_s3.S3Client({});
var handler = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: "Missing body" };
    }
    const parsed = JSON.parse(event.body);
    const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    const videoId = `vid_${(0, import_crypto.randomUUID)()}`;
    const key = `${videoId}.mp4`;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const status = "uploaded";
    await ddb.send(
      new import_client_dynamodb.PutItemCommand({
        TableName: tableName,
        Item: {
          videoId: { S: videoId },
          status: { S: status },
          createdAt: { S: createdAt },
          hashtags: { SS: hashtags }
        }
      })
    );
    const putCmd = new import_client_s3.PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: "video/mp4"
      // client can override later if needed
    });
    const uploadUrl = await (0, import_s3_request_presigner.getSignedUrl)(s3, putCmd, {
      expiresIn: 15 * 60
      // 15 minutes
    });
    const response = {
      videoId,
      uploadUrl
    };
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response)
    };
  } catch (err) {
    console.error("Error in create-upload", err);
    return {
      statusCode: 500,
      body: "Internal server error"
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
