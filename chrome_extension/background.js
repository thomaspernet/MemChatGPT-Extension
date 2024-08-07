function pushToMem(note, apiKey) {
  return new Promise((resolve, reject) => {
    var apiUrl = "https://api.mem.ai/v0/mems";
    var headers = {
      "Authorization": "ApiAccessToken " + apiKey,
      "Content-Type": "application/json"
    };
    var payload = {
      "content": note
    };
    var options = {
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
}

function processChatGPTRequest(api_key, text, prompt, model) {
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



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'pushToMem') {
    chrome.storage.sync.get('api_mem', function(data) {
      pushToMem(request.content, data.api_mem)
        .then(url => sendResponse({ url: url }))
        .catch(error => sendResponse({ error: error }));
    });
    return true; // Indicates that the response is asynchronous
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processWithChatGPT') {
    console.log("Received ChatGPT request in background:", request); // Log received request

    chrome.storage.sync.get('api_chatgpt', function(data) {

    // Call the function to process the ChatGPT request (modify this to suit your implementation)
    processChatGPTRequest(data.api_chatgpt, request.content, request.prompt, request.model)
      .then(response => {
        console.log("ChatGPT processing successful:", response); // Log successful response
        sendResponse({ output: response });
      })
      .catch(error => {
        console.log("ChatGPT processing error:", error); // Log error
        sendResponse({ error: 'Error: ' + error });
      });
    })

    return true; // Indicates that the response is asynchronous
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendTextToExtension",
    title: "Mem pusher text selection",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendTextToExtension" && info.selectionText) {
    chrome.storage.local.get({ selectedTextsByUrl: {} }, (data) => {
      const url = tab.url;
      if (!data.selectedTextsByUrl[url]) {
        data.selectedTextsByUrl[url] = [];
      }
      data.selectedTextsByUrl[url].push(info.selectionText);
      chrome.storage.local.set({ selectedTextsByUrl: data.selectedTextsByUrl });
    });
  }
});


// Ensure the context menu is created on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "explainText",
        title: "Explain",
        contexts: ["selection"]
    });
});

// Handle clicks on the context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "explainText" && info.selectionText) {
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error injecting script: ", chrome.runtime.lastError.message);
                return;
            }

            // Now send the message
            chrome.tabs.sendMessage(tab.id, {action: "displayFloatingBox", text: info.selectionText}, response => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError.message);
                    return;
                }
                console.log("Response received:", response);
            });
        });
    }
});






