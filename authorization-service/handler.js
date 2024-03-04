"use strict";

const ALLOW = "Allow";
const DENY = "Deny";

const Effects = {
  ALLOW,
  DENY,
};

const generatePolicyDocument = (effect, resource) => {
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  };
};

const generateResponse = (principalId, effect, resource) => {
  return {
    principalId,
    policyDocument: generatePolicyDocument(effect, resource),
  };
};

module.exports.basicAuthorizer = async (event) => {
  const { headers, routeArn } = event;

  if (headers.authorization) {
    const encodedCreds = headers.authorization.split(" ")[1];
    const decodedCreds = atob(encodedCreds);

    const [username, password] = decodedCreds.split(":");

    const envUsername = username.replace(/-/g, "_");
    const usersPassword = process.env[envUsername];

    const effect =
      usersPassword && usersPassword === password
        ? Effects.ALLOW
        : Effects.DENY;

    return generateResponse(username, effect, routeArn);
  }

  return generateResponse("user", Effects.DENY, routeArn);
};
