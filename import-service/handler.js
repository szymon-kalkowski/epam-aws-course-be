"use strict";

const AWS = require("aws-sdk");
const csv = require("csv-parser");
const s3 = new AWS.S3({ region: "us-east-1" });

module.exports.importProductsFile = async (event) => {
  const fileName = event.queryStringParameters.name;

  const BUCKET = "aws-course-bucket-task-5";
  const catalogPath = `uploaded/${fileName}`;

  const params = {
    Bucket: BUCKET,
    Key: catalogPath,
    Expires: 60,
    ContentType: "text/csv",
  };

  const url = await s3.getSignedUrlPromise("putObject", params);

  return {
    statusCode: 200,
    body: JSON.stringify(url),
  };
};

module.exports.importFileParser = async (event) => {
  console.log("File Parser");
  console.log("Event", event);
  console.log("Records", event.Records);

  for (const record of event.Records) {
    console.log("Record", record);
    const s3Stream = s3
      .getObject({
        Bucket: "aws-course-bucket-task-5",
        Key: record.s3.object.key,
      })
      .createReadStream();

    console.log("S3 Stream created");

    await new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on("data", (data) => {
          console.log(data);
        })
        .on("error", (err) => {
          console.log("Error:", err);
          reject(err);
        })
        .on("end", () => {
          console.log("File has been processed");
          resolve();
        });
    });
  }
};
