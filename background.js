const RULE_ID_START = 1;

chrome.runtime.onInstalled.addListener(async () => {
  await updateRules();
});

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.domains) {
    await updateRules();
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'updateRules') {
    await updateRules();
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateBadgeForTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url) {
    await updateBadgeForTab(tabId);
  }
});

async function updateBadgeForTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;

    const hostname = new URL(tab.url).hostname;
    const { domains = [] } = await chrome.storage.local.get('domains');
    
    const isActive = domains.some(domain => {
      if (domain.startsWith('*.')) {
        const wildcard = domain.slice(2);
        return hostname.endsWith(wildcard);
      }
      return domain === hostname;
    });

    await chrome.action.setBadgeText({
      text: isActive ? 'ON' : '',
      tabId
    });

    await chrome.action.setBadgeBackgroundColor({
      color: '#1a73e8',
      tabId
    });
  } catch (e) {
    console.error('Error updating badge:', e);
  }
}

async function updateRules() {
  const { domains = [] } = await chrome.storage.local.get('domains');
  
  // Remove existing rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds
  });

  // Create new rules for each domain
  const rules = domains.map((domain, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        {
          header: 'Access-Control-Allow-Origin',
          operation: 'set',
          value: '*'
        },
        {
          header: 'Access-Control-Allow-Methods',
          operation: 'set',
          value: 'GET, PUT, POST, DELETE, HEAD, OPTIONS, PATCH'
        },
        {
          header: 'Access-Control-Allow-Headers',
          operation: 'set',
          value: '*'
        },
        {
          header: 'Access-Control-Allow-Credentials',
          operation: 'set',
          value: 'true'
        }
      ]
    },
    condition: {
      domains: [domain.replace('*.', '')],
      urlFilter: '*',
      resourceTypes: ['xmlhttprequest', 'main_frame', 'sub_frame', 'script', 'other']
    }
  }));

  if (rules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });
  }

  // Update badge for current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    await updateBadgeForTab(tabs[0].id);
  }
}
