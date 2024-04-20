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
      .then(response => response.json())
      .then(data => {
        if (data.choices && data.choices.length > 0) {
          resolve(data.choices[0].message.content);
        } else {
          reject("No response from ChatGPT");
        }
      })
      .catch(error => reject("Error: " + error.message));
  });
}

function pushToCoda(data, apiKey) {
  return new Promise((resolve, reject) => {
    const apiUrl = 'https://coda.io/apis/v1/docs/zYeyeaTqEf/tables/EMAILS_NEWS/rows';
    const headers = {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    };
    const payload = {
      'rows': [{
        'cells': data
      }]
    };
    const options = {
      'method': 'POST',
      'headers': headers,
      'body': JSON.stringify(payload)
    };

    fetch(apiUrl, options)
      .then(response => response.json())  // Parse JSON response
      .then(data => {
        // Check if the response has the 'items' array and each item should have an 'id'
        if (data.items && data.items.length > 0 && data.items[0].id) {
          resolve(data);
        } else {
          // If the expected 'id' is not present, consider it an error
          reject(new Error("Failed to insert row. Response: " + JSON.stringify(data)));
        }
      })
      .catch(error => {
        // Network or parsing errors will be caught here
        reject(new Error("Error: " + error.message));
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
        sendResponse({ error: 'Error: ' + error.message });
      });
    })

    return true; // Indicates that the response is asynchronous
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'pushToCoda') {
    chrome.storage.sync.get('api_coda', function(data) {
      pushToCoda(request.data, data.api_coda)
        .then(response => sendResponse({ success: response }))
        .catch(error => sendResponse({ error: error }));
    });
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


chrome.contextMenus.create({
    id: "explainText",
    title: "Explain",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "explainText" && info.selectionText) {
        // Ensure the tab is correct and ready
        console.log("Sending to tab ID:", tab.id);
        chrome.tabs.sendMessage(tab.id, {action: "displayFloatingBox", text: info.selectionText}, response => {
            if(chrome.runtime.lastError){
                console.error("Error sending message:", chrome.runtime.lastError.message);
                return;
            }
            console.log("Response received:", response);
        });
    }
});







