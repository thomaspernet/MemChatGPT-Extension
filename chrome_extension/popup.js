document.addEventListener('DOMContentLoaded', () => {
  setupTabListeners();
  loadCollection()
  loadApiKey();
  loadChatGPTApiKey();
  openTab('Main'); // Open Main tab by default
  loadExistingTemplates(); // Load existing templates
  loadChatGPTPrompts(); // Load ChatGPT prompts immediately
});

function setupTabListeners() {
  document.getElementById('mainTab').addEventListener('click', () => openTab('Main'));
  document.getElementById('memTemplateTab').addEventListener('click', () => openTab('CreateMemTemplate'));
  document.getElementById('manageTemplatesTab').addEventListener('click', () => {
    openTab('ManageTemplates');
    loadExistingTemplates();
  });
  document.getElementById('createChatGPTPromptTab').addEventListener('click', () => openTab('CreateChatGPTPrompt'));
  document.getElementById('manageChatGPTPromptsTab').addEventListener('click', () => {
    openTab('ManageChatGPTPrompts');
    loadChatGPTPrompts();
  });
  document.getElementById('apiKeysTab').addEventListener('click', () => openTab('ApiKeys'));
}

function openTab(tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  const tablinks = document.getElementsByClassName("tablinks");

  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  const tabButton = document.getElementById(tabName + 'Tab');
  if (tabButton) {
    tabButton.className += " active";
  }
}

function loadApiKey() {
  chrome.storage.sync.get('api_mem', data => {
    if (data.api_mem) {
      document.getElementById('api_key').value = data.api_mem;
    }
  });
}

function loadChatGPTApiKey() {
  chrome.storage.sync.get('api_chatgpt', data => {
    if (data.api_chatgpt) {
      document.getElementById('chatgpt_api_key').value = data.api_chatgpt;
    }
  });
}

document.getElementById('create_template').addEventListener('click', () => {
  const templateName = document.getElementById('new_template_name').value.trim();
  const templateContent = document.getElementById('new_template_area').value;

  if (templateName && templateContent) {
    saveTemplate(templateName, templateContent);
    alert("Template created!");
    document.getElementById('new_template_name').value = '';
    document.getElementById('new_template_area').value = '';
  } else {
    alert("Please enter a name and content for the template.");
  }
});

function setupManageTemplatesTab() {
  loadExistingTemplates();

  const existingTemplateSelector = document.getElementById('existing_template_selector');
  if (existingTemplateSelector) {
    existingTemplateSelector.addEventListener('change', function() {
      const selectedValue = this.value;
      const editTemplateName = document.getElementById('edit_template_name');
      const editTemplateArea = document.getElementById('edit_template_area');

      chrome.storage.sync.get({ templates: {} }, function(data) {
        if (data.templates[selectedValue]) {
          editTemplateName.value = selectedValue;
          editTemplateArea.value = data.templates[selectedValue];
        }
      });
    });
  }
}

function loadCollection() {
    chrome.storage.local.get(['valuesList'], function(result) {
        if (result.valuesList) {
            result.valuesList.forEach(value => addValueToDatalist(value));
        }
    });
}

function formatKeyword(keyword) {
    if (!keyword.startsWith('#')) {
        keyword = '#' + keyword;
    }
    return keyword.replace(/\s+/g, '-');
}

document.getElementById('valuesInput').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        let value = event.target.value.trim();
        if (value) {
            value = formatKeyword(value); // Now you can reassign 'value'
            addValue(value);
            addToSelectedKeywords(value);
            event.target.value = ''; // Clear the input field
        }
    }
});


function addValue(value) {
    chrome.storage.local.get(['valuesList'], function(result) {
        let valuesList = result.valuesList || [];
        if (!valuesList.includes(value)) {
            valuesList.push(value);
            chrome.storage.local.set({ 'valuesList': valuesList }, function() {
                addValueToDatalist(value);
            });
        }
    });
}

function addValueToDatalist(value) {
    const datalist = document.getElementById('valuesList');
    const option = document.createElement('option');
    option.value = value;
    datalist.appendChild(option);
}

function addToSelectedKeywords(value) {
    const selectedKeywordsArea = document.getElementById('selectedKeywords');
    let currentText = selectedKeywordsArea.value;
    currentText = currentText ? currentText + ', ' + value : value;
    selectedKeywordsArea.value = currentText;
}



function setupManageChatGPTPromptsTab() {
  loadChatGPTPrompts();

  const existingChatGPTPromptSelector = document.getElementById('existing_chatgpt_prompt_selector');
  if (existingChatGPTPromptSelector) {
    existingChatGPTPromptSelector.addEventListener('change', function() {
      const selectedValue = this.value;
      const editChatGPTPromptName = document.getElementById('edit_chatgpt_prompt_name');
      const editChatGPTPromptArea = document.getElementById('edit_chatgpt_prompt');

      chrome.storage.sync.get({ chatgptPrompts: {} }, function(data) {
        if (data.chatgptPrompts[selectedValue]) {
          editChatGPTPromptName.value = selectedValue;
          editChatGPTPromptArea.value = data.chatgptPrompts[selectedValue];
        }
      });
    });
  }
}


function saveTemplate(name, content) {
  chrome.storage.sync.get({ templates: {} }, function(data) {
    data.templates[name] = content;
    chrome.storage.sync.set({ templates: data.templates }, function() {
      // Reload templates in both Manage Templates and Main tab
      loadExistingTemplates();
      updateMainTabTemplates();
    });
  });
}

function updateMainTabTemplates() {
  chrome.storage.sync.get({ templates: {} }, function(data) {
    const templateSelector = document.getElementById('template_selector');
    resetSelector(templateSelector);

    for (const name in data.templates) {
      if (data.templates.hasOwnProperty(name)) {
        addOptionToSelector(templateSelector, name);
      }
    }
  });
}

function loadExistingTemplates() {
  chrome.storage.sync.get({ templates: {} }, function(data) {
    const existingTemplateSelector = document.getElementById('existing_template_selector');
    const mainTemplateSelector = document.getElementById('template_selector');

    resetSelector(existingTemplateSelector);
    resetSelector(mainTemplateSelector);

    let firstTemplateAdded = false;
    for (const name in data.templates) {
      if (data.templates.hasOwnProperty(name)) {
        addOptionToSelector(existingTemplateSelector, name);
        addOptionToSelector(mainTemplateSelector, name);
        if (!firstTemplateAdded) {
          mainTemplateSelector.value = name; // Set the first template as selected
          firstTemplateAdded = true;
        }
      }
    }
  });
}

document.getElementById('existing_template_selector').addEventListener('change', function() {
  const selectedTemplate = this.value;
  chrome.storage.sync.get({ templates: {} }, function(data) {
    if (data.templates.hasOwnProperty(selectedTemplate)) {
      document.getElementById('edit_template_name').value = selectedTemplate;
      document.getElementById('edit_template_area').value = data.templates[selectedTemplate];
    }
  });
});

document.getElementById('existing_chatgpt_prompt_selector').addEventListener('change', function() {
  const selectedPrompt = this.value;
  chrome.storage.sync.get({ chatgptPrompts: {} }, function(data) {
    if (data.chatgptPrompts.hasOwnProperty(selectedPrompt)) {
      document.getElementById('edit_chatgpt_prompt_name').value = selectedPrompt;
      document.getElementById('edit_chatgpt_prompt').value = data.chatgptPrompts[selectedPrompt];
    }
  });
});



document.getElementById('save_edited_template').addEventListener('click', () => {
  const newName = document.getElementById('edit_template_name').value.trim();
  const newContent = document.getElementById('edit_template_area').value;
  const oldName = document.getElementById('existing_template_selector').value;

  if (newName && newContent) {
    saveTemplate(newName, newContent);
    if (newName !== oldName) {
      deleteTemplate(oldName);
    }
    alert("Template updated!");
  } else {
    alert("Please enter a name and content for the template.");
  }
});

document.getElementById('delete_template').addEventListener('click', () => {
  const selectedTemplate = document.getElementById('existing_template_selector').value;

  if (selectedTemplate) {
    deleteTemplate(selectedTemplate);
    alert("Template deleted!");
    document.getElementById('edit_template_name').value = '';
    document.getElementById('edit_template_area').value = '';
    loadExistingTemplates();
  } else {
    alert("Please select a template to delete.");
  }
});

function deleteTemplate(templateName) {
  chrome.storage.sync.get({ templates: {} }, function(data) {
    delete data.templates[templateName];
    chrome.storage.sync.set({ templates: data.templates });
  });
}


document.getElementById('create_chatgpt_prompt').addEventListener('click', () => {
  const promptName = document.getElementById('new_chatgpt_prompt_name').value.trim();
  const promptContent = document.getElementById('new_chatgpt_prompt').value;

  if (promptName && promptContent) {
    saveChatGPTPrompt(promptName, promptContent);
    // Add loadChatGPTPrompts here
    loadChatGPTPrompts();
    document.getElementById('new_chatgpt_prompt_name').value = '';
    document.getElementById('new_chatgpt_prompt').value = '';
  } else {
    alert("Please enter a name and content for the ChatGPT prompt.");
  }
});

function saveChatGPTPrompt(name, content) {
  chrome.storage.sync.get({ chatgptPrompts: {} }, function(data) {
    data.chatgptPrompts[name] = content;
    chrome.storage.sync.set({ chatgptPrompts: data.chatgptPrompts }, loadChatGPTPrompts);
  });
}

document.getElementById('save_edited_chatgpt_prompt').addEventListener('click', () => {
  const newName = document.getElementById('edit_chatgpt_prompt_name').value.trim();
  const newContent = document.getElementById('edit_chatgpt_prompt').value;
  const oldName = document.getElementById('existing_chatgpt_prompt_selector').value;

  if (newName && newContent) {
    saveChatGPTPrompt(newName, newContent);
    loadChatGPTPrompts();
    if (newName !== oldName) {
      deleteChatGPTPrompt(oldName);
    }
  } else {
    alert("Please enter a name and content for the ChatGPT prompt.");
  }
});

document.getElementById('delete_chatgpt_prompt').addEventListener('click', () => {
  const selectedPrompt = document.getElementById('existing_chatgpt_prompt_selector').value;
  if (selectedPrompt) {
    deleteChatGPTPrompt(selectedPrompt);
     loadChatGPTPrompts();
    document.getElementById('edit_chatgpt_prompt_name').value = '';
    document.getElementById('edit_chatgpt_prompt').value = '';
  } else {
    alert("Please select a ChatGPT prompt to delete.");
  }
});

function deleteChatGPTPrompt(promptName) {
  chrome.storage.sync.get({ chatgptPrompts: {} }, function(data) {
    delete data.chatgptPrompts[promptName];
    chrome.storage.sync.set({ chatgptPrompts: data.chatgptPrompts }, loadChatGPTPrompts);
  });
}

function loadChatGPTPrompts() {
  console.log("loadChatGPTPrompts called"); // Debugging log
  chrome.storage.sync.get({ chatgptPrompts: {} }, function(data) {
    console.log("Loaded ChatGPT Prompts:", data.chatgptPrompts); // Debugging log

    const existingChatGPTPromptSelector = document.getElementById('existing_chatgpt_prompt_selector');
    const chatgptPromptSelector = document.getElementById('chatgpt_prompt_selector');
    resetSelector(existingChatGPTPromptSelector);
    resetSelector(chatgptPromptSelector);

    let firstPromptAdded = false;
    for (const name in data.chatgptPrompts) {
      if (data.chatgptPrompts.hasOwnProperty(name)) {
        addOptionToSelector(existingChatGPTPromptSelector, name);
        addOptionToSelector(chatgptPromptSelector, name);
        if (!firstPromptAdded) {
          chatgptPromptSelector.value = name; // Set the first prompt as selected in the main tab
          firstPromptAdded = true;
        }
      }
    }
  });
}




function populateTemplateSelectors(templates) {
  const templateSelector = document.getElementById('template_selector');
  resetSelector(templateSelector);

  let firstTemplateAdded = false;
  for (const name in templates) {
    if (templates.hasOwnProperty(name)) {
      addOptionToSelector(templateSelector, name);
      if (!firstTemplateAdded) {
        templateSelector.value = name; // Set the first template as selected
        firstTemplateAdded = true;
      }
    }
  }
}

function displayLoadingIndicator() {
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('output_area').textContent = ''; // Clear output area when loading starts
}

function hideLoadingIndicator() {
  document.getElementById('spinner').style.display = 'none';
}

function resetSelector(selector) {
  while (selector.options.length > 1) {
    selector.remove(1);
  }
}

function addOptionToSelector(selector, name) {
  const option = document.createElement("option");
  option.text = name;
  option.value = name;
  selector.add(option);
}

document.getElementById('save_api_key').addEventListener('click', () => {
  const apiKey = document.getElementById('api_key').value;
  chrome.storage.sync.set({ api_mem: apiKey });
});

document.getElementById('save_chatgpt_api_key').addEventListener('click', () => {
  const chatGPTApiKey = document.getElementById('chatgpt_api_key').value;
  chrome.storage.sync.set({ api_chatgpt: chatGPTApiKey }, () => {
    alert("ChatGPT API Key saved!");
  });
});


// This function will be injected into the current tab to extract content
function getPageContentScript() {
  return document.body.innerText || 'No content found';
}

function getChatGPTPromptContent(promptName, callback) {
  chrome.storage.sync.get({ chatgptPrompts: {} }, function(data) {
    if (data.chatgptPrompts.hasOwnProperty(promptName)) {
      callback(data.chatgptPrompts[promptName]);
    } else {
      callback(null); // Handle the case where the prompt is not found
    }
  });
}


// This function triggers the content extraction in the current tab
function extractContentFromTab() {
  displayLoadingIndicator(); // Show spinner when starting extraction

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length > 0 && tabs[0].id) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getPageContentScript
      }, (injectionResults) => {
        if (injectionResults && injectionResults[0]) {
          const extractedContent = injectionResults[0].result;
          const selectedPromptName = document.getElementById('chatgpt_prompt_selector').value;
          const selectedModel = document.getElementById('chatgpt_model_selector').value;

          getChatGPTPromptContent(selectedPromptName, function(promptContent) {
            if (promptContent) {
              sendContentToBackgroundForChatGPT(extractedContent, promptContent, selectedModel, function(err, response) {
                if (!err) {
                  document.getElementById('output_area').textContent = response;
                } else {
                  document.getElementById('output_area').textContent = err;
                }
                hideLoadingIndicator(); // Hide spinner after processing is complete
              });
            } else {
              document.getElementById('output_area').textContent = 'Error: Prompt content not found';
              hideLoadingIndicator();
            }
          });
        } else if (chrome.runtime.lastError) {
          document.getElementById('output_area').textContent = 'Error extracting content: ' + chrome.runtime.lastError.message;
          hideLoadingIndicator();
        } else {
          document.getElementById('output_area').textContent = 'No content found';
          hideLoadingIndicator();
        }
      });
    }
  });
}

function getPageContentScript() {
  return document.body.innerText || 'No content found';
}



function getPageContentScript() {
  return document.body.innerText || 'No content found';
}




document.getElementById('extract_content').addEventListener('click', extractContentFromTab);


function resetTemplateForm() {
  document.getElementById('template_selector_edit').value = 'new';
  document.getElementById('template_area_edit').value = '';
  document.getElementById('template_name').value = '';
  document.getElementById('template_name').style.display = 'none';
  document.getElementById('delete_template').style.display = 'none';
}

document.getElementById('delete_template').addEventListener('click', () => {
  const selectedTemplate = document.getElementById('template_selector_edit').value;
  if (selectedTemplate && selectedTemplate !== "new") {
    chrome.storage.sync.get({ templates: {} }, data => {
      const templates = data.templates;
      delete templates[selectedTemplate];
      chrome.storage.sync.set({ templates: templates }, () => {
        loadAllTemplates();
        resetTemplateForm();
      });
    });
  }
});


function formatContentForMem(selectedTemplateName, content, title, currentUrl, selectedKeywords, callback) {
  chrome.storage.sync.get({ templates: {} }, function(data) {
    let template = data.templates[selectedTemplateName];
    if (template) {
      const currentDate = new Date().toISOString().split('T')[0];
      template = template.replace('{url}', currentUrl)
                         .replace('{date}', currentDate)
                         .replace('{title}', title);

      if (template.includes('{collection}')) {
        template = template.replace('{collection}', selectedKeywords);
      } else if (selectedKeywords) {
        template += '\n' + selectedKeywords;
      }

      callback(template + "\n\n" + content);
    } else {
      callback(content); // Fallback if template is not found
    }
  });
}


function sendContentToBackgroundForChatGPT(content, prompt, model, callback) {
  console.log("Sending to ChatGPT:", {content, prompt, model}); // Log request details
  chrome.runtime.sendMessage({
    action: 'processWithChatGPT',
    content: content,
    prompt: prompt,
    model: model
  }, response => {
    if (response && response.output) {
      console.log("ChatGPT response:", response.output); // Log response
      callback(null, response.output); // Pass the result to the callback
    } else {
      // Handle any error or absence of output in response
      console.log("ChatGPT error or no response:", response); // Log error or no response
      callback(response.error || 'Error or no response from ChatGPT', null); // Pass the error to the callback
    }
  });
}

function pushContentToMem(content) {
  chrome.runtime.sendMessage({ message: 'pushToMem', content: content }, response => {
    const memLinkElement = document.getElementById('mem_link');
    if (response && response.url) {
      memLinkElement.href = response.url;
      memLinkElement.textContent = 'Open Mem URL';
      memLinkElement.style.display = 'block';
    } else {
      memLinkElement.textContent = 'Error or no URL in response';
      memLinkElement.style.display = 'block';
    }
  });
}

document.getElementById('push_to_mem').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      const content = document.getElementById('output_area').value;
      const title = document.getElementById('title_input').value;
      const selectedTemplate = document.getElementById('template_selector').value;
      const selectedKeywords = document.getElementById('selectedKeywords').value;

      formatContentForMem(selectedTemplate, content, title, currentUrl,selectedKeywords, formattedContent => {
        pushContentToMem(formattedContent);
      });
    }
  });
});