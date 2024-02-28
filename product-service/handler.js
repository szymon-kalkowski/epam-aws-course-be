"use strict";

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.getProductsList = async (event) => {
  const products = await dynamoDb.scan({ TableName: "products" }).promise();
  const stocks = await dynamoDb.scan({ TableName: "stocks" }).promise();

  products.Items.forEach((product) => {
    const stock = stocks.Items.find((stock) => stock.product_id === product.id);
    product.count = stock.count;
  });

  return {
    statusCode: 200,
    body: JSON.stringify(products.Items),
  };
};

module.exports.getProductsById = async (event) => {
  const { productId } = event.pathParameters;

  const product = await dynamoDb
    .query({
      TableName: "products",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": productId,
      },
    })
    .promise();

  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  const stock = await dynamoDb
    .query({
      TableName: "stocks",
      KeyConditionExpression: "product_id = :id",
      ExpressionAttributeValues: {
        ":id": productId,
      },
    })
    .promise();

  product.Items[0].count = stock.Items[0].count;

  return {
    statusCode: 200,
    body: JSON.stringify(product.Items[0]),
  };
};

module.exports.createProduct = async (event) => {
  const { title, description, price, count } = JSON.parse(event.body);

  const product = {
    id: uuidv4(),
    title,
    description,
    price,
  };

  const stock = {
    product_id: product.id,
    count,
  };

  await dynamoDb.put({ TableName: "products", Item: product }).promise();
  await dynamoDb.put({ TableName: "stocks", Item: stock }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      product,
      stock,
    }),
  };
};
