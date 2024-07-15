// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "displayFloatingBox" && message.text) {
        displayFloatingBox(message.text);
        sendResponse({result: "Displayed box successfully."});
    }
});

function pushToMem2(content) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('api_mem', function(data) {
            if (!data.api_mem) {
                return reject('API key not found.');
            }

            const apiUrl = "https://api.mem.ai/v0/mems";
            const headers = {
                "Authorization": "ApiAccessToken " + data.api_mem,
                "Content-Type": "application/json"
            };
            const payload = {
                "content": content
            };
            const options = {
                "method": "post",
                "headers": headers,
                "body": JSON.stringify(payload)
            };

            fetch(apiUrl, options)
                .then(response => response.json())
                .then(data => {
                    if (data.url) {
                        resolve(data.url);
                    } else {
                        reject("Error: URL not found in response");
                    }
                })
                .catch(error => reject("Error: " + error.message));
        });
    });
}

function processChatGPTRequest2(api_key, text, prompt, model) {
  return new Promise((resolve, reject) => {
    prompt = prompt + "\n" + text;
    var url = "https://api.openai.com/v1/chat/completions";
    var data = {
      "model": model,
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt}
      ]
    };
    var options = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key
      },
      body: JSON.stringify(data)
    };

    fetch(url, options)
      .then(response => response.json())  // Always parse JSON to get the full response.
      .then(data => {
        if (!data.error && data.choices && data.choices.length > 0) {
          resolve(data.choices[0].message.content);
        } else {
          // Log and reject with the API error message if available
          console.error("API Error:", data.error ? data.error.message : "No choices available");
          reject("API Error: " + (data.error ? data.error.message : "No choices available"));
        }
      })
      .catch(error => {
        console.error("Error processing request to OpenAI API:", error);
        reject("Error: " + error.message);
      });
  });
}

function displayFloatingBox(text) {
    // Remove any existing box
    const existingBox = document.getElementById('floatingTextDisplayBox');
    if (existingBox) {
        document.body.removeChild(existingBox);
    }

    // Create a new floating box
    const box = document.createElement('div');
    box.id = 'floatingTextDisplayBox';
    box.style.position = 'fixed';
    box.style.left = '75%';  // Center the box horizontally
    box.style.top = '50%';  // Center the box vertically
    box.style.transform = 'translate(-50%, -50%)';
    box.style.width = '400px';
    box.style.minHeight = '300px';
    box.style.background = 'white';
    box.style.border = '1px solid black';
    box.style.padding = '10px';
    box.style.zIndex = '1000';
    box.style.cursor = 'move';
    box.style.resize = 'both';
    box.style.overflow = 'auto';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';  // Organizes children in a column
    document.body.appendChild(box);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = 'red';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '25px';
    closeButton.style.height = '25px';
    closeButton.onclick = function() {
        box.parentNode.removeChild(box);
    };
    box.appendChild(closeButton);

    // Create a drag handle
    const dragHandle = document.createElement('div');
    dragHandle.style.height = '20px';
    dragHandle.style.background = '#ccc';
    dragHandle.style.cursor = 'grab';
    box.appendChild(dragHandle);

    // Textarea for the prompt
    const promptArea = document.createElement('textarea');
    promptArea.style.width = '100%';
    promptArea.style.height = 'calc(100% - 40px)'; // adjust height to make space for drag handle and button
    promptArea.style.resize = 'none';
    promptArea.value = "Can you explain in detail the following text:";
    box.appendChild(promptArea);

    // Add textarea to modify text
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = 'calc(100% - 80px)'; // adjust height to make space for drag handle and button
    textarea.value = text;
    textarea.style.resize = 'none';
    box.appendChild(textarea);

    // Textarea for the ChatGPT response
    const responseArea = document.createElement('textarea');
    responseArea.style.width = '100%';
    responseArea.style.height = 'calc(100% - 80px)'; // adjust height to make space for drag handle and button
    responseArea.value = "";
    responseArea.disabled = true;  // Initially disabled
    box.appendChild(responseArea);

    // Button to trigger ChatGPT processing
    const explainButton = document.createElement('button');
    explainButton.textContent = 'Explain';
    explainButton.onclick = async function() {
        explainButton.disabled = true; // Disable the button to prevent multiple clicks
        responseArea.value = 'Processing...'; // Inform the user that processing is underway

        // Retrieve the API key and make the request
        chrome.storage.sync.get('api_chatgpt', async function(data) {
            if (data.api_chatgpt) {
                try {
                    const additionalInstructions = "\n\nUse the following template to answer:\n\n# Title\n\nExplanation:\n\nList of keywords:";
                    const fullPrompt = promptArea.value + additionalInstructions;
                    const response = await processChatGPTRequest2(data.api_chatgpt, textarea.value, fullPrompt, 'gpt-4o');
                    responseArea.value = response; // Display the response from ChatGPT
                } catch (error) {
                    responseArea.value = 'Error fetching explanation: ' + error.message; // Display any errors that occur
                    console.error("ChatGPT processing error:", error);
                }
            } else {
                responseArea.value = 'ChatGPT API key not found'; // Inform the user if the API key is not found
            }
            explainButton.disabled = false; // Re-enable the button after processing
        });
    };
    box.appendChild(explainButton);
    responseArea.disabled = false;

    // Add button to push content to Mem
    const button = document.createElement('button');
    button.textContent = 'Push to Mem';
    box.appendChild(button);

    // Add a container for the URL link
    const linkContainer = document.createElement('div');
    linkContainer.id = 'memLinkContainer';
    box.appendChild(linkContainer);

    // Add button to push content to Mem
    
    // Event listener for the button
    button.onclick = function() {
        const url_source = window.location.href;  // Get the current page's URL
        const textToPush = responseArea.value + '\nURL: ' + url_source;
        chrome.storage.sync.get('api_mem', function(data) {
            if (data.api_mem) {
                pushToMem2(textToPush, data.api_mem)
                    .then(url => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.textContent = 'View in Mem';
                        link.target = '_blank';  // Open in a new tab
                        linkContainer.innerHTML = '';  // Clear previous links if any
                        linkContainer.appendChild(link);
                    })
                    .catch(error => {
                        linkContainer.textContent = 'Error pushing to Mem: ' + error;  // Display error in the link container
                    });
            } else {
                linkContainer.textContent = 'API key not found';
            }
        });
    };

    box.appendChild(button);

    // Drag functionality
    let posInitialX = 0, posInitialY = 0;
    dragHandle.onmousedown = function(event) {
        event.preventDefault();
        posInitialX = event.clientX;
        posInitialY = event.clientY;
        document.onmousemove = function(event) {
            event.preventDefault();
            let posX = posInitialX - event.clientX;
            let posY = posInitialY - event.clientY;
            posInitialX = event.clientX;
            posInitialY = event.clientY;
            box.style.top = (box.offsetTop - posY) + "px";
            box.style.left = (box.offsetLeft - posX) + "px";
        };
        document.onmouseup = function() {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}
