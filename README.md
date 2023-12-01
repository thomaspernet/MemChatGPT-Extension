# MemChatGPT-Extension

MemChatGPT-Extension is a Chrome extension designed to enhance your workflow by integrating OpenAI's ChatGPT with Mem AI. This tool allows you to extract content from web pages, process it through ChatGPT, and then seamlessly push it to Mem for organized storage.

![example](https://github.com/thomaspernet/MemChatGPT-Extension/blob/main/gif/mem-example_rFuaYp5u.gif?raw=true)


## Installation

To install MemChatGPT-Extension in Chrome:

1. Clone or download the repository from GitHub.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" at the top right corner.
4. Click on "Load unpacked" and select the directory of your downloaded extension.

![](https://github.com/thomaspernet/MemChatGPT-Extension/blob/main/gif/extension.png?raw=true)

## Setting Up API Keys

### Mem API Key
1. Go to [Mem AI API setup page](https://mem.ai/sources/api).
2. Create a new API key and securely copy it.
3. Keep this key confidential.

### ChatGPT API Key
1. Visit [OpenAI API keys page](https://platform.openai.com/api-keys) to set up your API key.
2. Note: Obtaining this key requires a credit card. Refer to [OpenAI's pricing](https://openai.com/pricing) for detailed information.

## Using the Extension

### Templates for Mem
In MemChatGPT-Extension, templates are used to format content before pushing to Mem. Templates can include placeholders for title, date, and URL. Use `{title}`, `{date}`, and `{url}` as placeholders in your templates. For instance:

```markdown
# {title}

- Date: {date}
- URL: {url}
```

**Adding a Template**

1. Click on the "Create Mem Template" tab.
2. Enter a name for your template.
3. In the template area, enter your template using the placeholders.
4. Click "Create Template".

### Prompts for ChatGPT

Prompts are used to guide the ChatGPT in processing your content.

**Adding a Prompt**

1. Navigate to the "Create ChatGPT Prompt" tab.
2. Provide a name for your prompt.
3. Enter the ChatGPT prompt details in the provided area.
4. Click "Create Prompt".

## Extracting and Processing Content

1. In the Main tab, select the desired Mem template and ChatGPT prompt.
2. Click "Extract Content" while on a web page to pull its text content.
3. The content is processed through ChatGPT and displayed in the output area. You can edit this content before pushing it to Mem.

## Pushing to Mem

1. Optionally modify the processed content in the output area.
2. Click "Push to Mem" to send the content to your Mem account.

## Future Developments

Future iterations of the extension aim to leverage ChatGPT's capabilities directly, without the need for an API key.

## Security Note
Remember to keep your API keys private and securely stored. Avoid sharing them or embedding them in shared code repositories.
