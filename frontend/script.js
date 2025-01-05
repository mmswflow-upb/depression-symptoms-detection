// frontend/script.js

const apiBase = "/api"; // Assuming frontend is served from the same domain

// Helper function to handle responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Unknown error");
  }
  return data;
};

// Submit Local Training Update
document.getElementById("trainForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const parametersDelta = document.getElementById("parametersDelta").value;
  const loss = parseFloat(document.getElementById("loss").value);
  const accuracy = parseFloat(document.getElementById("accuracy").value);

  let parametersDeltaObj;
  try {
    parametersDeltaObj = JSON.parse(parametersDelta);
  } catch (err) {
    alert("Invalid JSON for Parameters Delta");
    return;
  }

  const payload = {
    parametersDelta: parametersDeltaObj,
    localPerformance: { loss, accuracy },
  };

  try {
    const response = await fetch(`${apiBase}/federatedTrain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        devkey: SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse(response);
    document.getElementById("trainResponse").textContent = JSON.stringify(
      data,
      null,
      2
    );
    document.getElementById("trainForm").reset();
  } catch (error) {
    document.getElementById(
      "trainResponse"
    ).textContent = `Error: ${error.message}`;
  }
});

// Aggregate Model
document
  .getElementById("aggregateButton")
  .addEventListener("click", async () => {
    try {
      const response = await fetch(`${apiBase}/aggregateModel`, {
        method: "GET",
        headers: {
          devkey: SECRET_KEY,
        },
      });

      const data = await handleResponse(response);
      document.getElementById("aggregateResponse").textContent = JSON.stringify(
        data,
        null,
        2
      );
    } catch (error) {
      document.getElementById(
        "aggregateResponse"
      ).textContent = `Error: ${error.message}`;
    }
  });

// Perform Inference
document
  .getElementById("inferenceForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const globalModel = document.getElementById("globalModel").value;
    const newData = document.getElementById("newData").value;

    let globalModelObj, newDataObj;
    try {
      globalModelObj = JSON.parse(globalModel);
      newDataObj = JSON.parse(newData);
    } catch (err) {
      alert("Invalid JSON for Global Model or New Data");
      return;
    }

    const payload = {
      globalModel: globalModelObj,
      newData: newDataObj,
    };

    try {
      const response = await fetch(`${apiBase}/performInference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          devkey: SECRET_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);
      document.getElementById("inferenceResponse").textContent = JSON.stringify(
        data,
        null,
        2
      );
    } catch (error) {
      document.getElementById(
        "inferenceResponse"
      ).textContent = `Error: ${error.message}`;
    }
  });
