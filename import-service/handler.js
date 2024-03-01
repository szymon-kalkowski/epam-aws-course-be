"use strict";

const AWS = require("aws-sdk");
const csv = require("csv-parser");
const s3 = new AWS.S3({ region: "us-east-1" });
const sqs = new AWS.SQS();

async function sendMessageToSQS(data) {
  const params = {
    MessageBody: JSON.stringify(data).replace("\\ufeff", ""),
    QueueUrl:
      "https://sqs.us-east-1.amazonaws.com/975050146366/catalogItemsQueue",
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log(`Message sent: ${params.MessageBody}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

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
  const promises = event.Records.map(
    (record) =>
      new Promise((resolve, reject) => {
        try {
          const s3Stream = s3
            .getObject({
              Bucket: record.s3.bucket.name,
              Key: record.s3.object.key,
            })
            .createReadStream();

          console.log(`Starting to process file ${record.s3.object.key}...`);

          s3Stream
            .pipe(csv())
            .on("data", (data) => {
              console.log("in csv data: ", data);
              resolve(sendMessageToSQS(data));
            })
            .on("end", () => {
              console.log(`File ${record.s3.object.key} has been processed.`);
            });
        } catch (error) {
          console.error("Error processing file:", error);
          reject(error);
        }
      })
  );

  await Promise.all(promises);
};
