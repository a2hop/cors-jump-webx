# cors-jump-webx
Safely work around CORS problems

## Description
CORS Jump WebX is a browser extension that helps developers bypass Cross-Origin Resource Sharing (CORS) restrictions during development and testing. It intercepts XMLHttpRequests and fetch API calls, modifying the requests to work around CORS limitations without compromising security in your development environment.

## Features
- Bypasses CORS restrictions for specified domains
- Works with both XMLHttpRequest and fetch API
- Configurable whitelist for domains you want to enable CORS bypassing
- Preserves original request headers and credentials
- No server-side proxy needed
- Debug mode for troubleshooting

## Installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the `cors-jump-webx` directory

### Installing from Release
1. Go to the [Releases](https://github.com/a2hop/cors-jump-webx/releases) page of this repository
2. Download the latest `.crx` file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top-right corner)
5. Drag and drop the downloaded `.crx` file onto the extensions page
6. Click "Add extension" when prompted

## Usage
1. Click the CORS Jump WebX icon in your browser toolbar
2. Add domains you want to bypass CORS restrictions for
3. Toggle the extension on/off using the switch
4. Refresh the page where you're experiencing CORS issues

## How It Works
The extension works by intercepting web requests before they're sent and modifying them to include CORS headers. When responses are received, it adds the necessary CORS headers to allow the browser to accept the cross-origin response.

## Security Considerations
- This extension should only be used for development and testing purposes
- Do not use in production environments
- Only enable the extension for trusted domains
- Disable the extension when browsing sensitive websites

## Troubleshooting
- If CORS issues persist, check the console for any error messages
- Ensure the domain is correctly added to the whitelist
- Try enabling debug mode for more detailed logging
- Verify that the extension is enabled for the current page


## Packaging

### Using Chrome
```
google-chrome --pack-extension=./cors-jump-webx --pack-extension-key=/path/to/your/key
```

### Using Node.js
```
npm install -g crx3-utils
crx3 /path/to/extension -o my-extension.crx -p my-key.pem
```

## License
[MIT]