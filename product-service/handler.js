"use strict";

const products = require("./data.js");

module.exports.getProductsList = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(products),
  };
};

module.exports.getProductsById = async (event) => {
  const { productId } = event.pathParameters;
  const product = products.find((product) => product.id === productId);
  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(product),
  };
};
