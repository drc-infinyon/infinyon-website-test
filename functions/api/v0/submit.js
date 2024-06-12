const URL_PATHNAME = "/api/v0/submit";
const RECAPTHCA_URL = "https://www.google.com/recaptcha/api/siteverify"
// prod key:
const WEBHOOK_URL = "https://infinyon.cloud/webhooks/v1/Au0zFECvOqUEzOQkRywszYfUmJU86CnnzdNzbcUL57HjXZ1tKXf99qTvs14ysDZ2";
// dev key:
//const WEBHOOK_URL = "https://infinyon.cloud/webhooks/v1/nClw0iNCI3QnZHOrtr2MTBPjc8KFn3Z6QMMJdWvUdWHsfSxhRalsdZw2lMXq9Zik";
const RECAPTHCA_SECRET = "6LetYDsoAAAAADkTueVDmVoJ5rA-ZYcLUVMHP_K6"

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  const url = new URL(request.url);
  if (url.pathname != URL_PATHNAME) {
    return new Response("Invalid Request", {
      status: 400,
    });  
  }

  let jsonData = await request.json();

  let result = await verifyReCaptcha(jsonData['g-recaptcha-response']);
  if (!result.success) {
    return new Response("ReCAPTHA validation failed.", {
      status: 407,
    });
  }
  
  delete jsonData['g-recaptcha-response']
  return sendToInfinyOn(jsonData);
}

const verifyReCaptcha = async(recaptcha_response) => {
 const response = await fetch(RECAPTHCA_URL, {
    method: "POST",
    headers: {
      "Content-type": `application/x-www-form-urlencoded`,
    },
    body: `secret=${RECAPTHCA_SECRET}&response=${recaptcha_response}`
  });
  
  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));

  return result;
}

const sendToInfinyOn = async (jsonData) => {
  const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-type": `application/json`,
      },
      body: JSON.stringify(jsonData)
    }
  );

  const text_response = response.ok ? "" : "Webhook gateway error.";

  return new Response(text_response, { status: response.status });
};