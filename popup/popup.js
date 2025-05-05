let domains = [];
let currentDomain = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab's domain
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.url) {
    try {
      const url = new URL(tabs[0].url);
      currentDomain = url.hostname;
      
      // Get existing domains first
      const result = await chrome.storage.local.get('domains');
      domains = result.domains || [];
      
      // Update status before setting up buttons
      updateCurrentDomainStatus(currentDomain);
      
      document.getElementById('currentDomain').textContent = `Current domain: ${currentDomain}`;
      
      const addCurrentBtn = document.getElementById('addCurrentDomain');
      const addWildcardBtn = document.getElementById('addCurrentWildcard');
      
      // Enable/disable buttons based on if domain is already added
      const updateButtonStates = () => {
        const hasExactDomain = domains.includes(currentDomain);
        const hasWildcardDomain = domains.includes(`*.${currentDomain.replace(/^[^.]+\./, '')}`);
        addCurrentBtn.disabled = hasExactDomain;
        addWildcardBtn.disabled = hasWildcardDomain;
      };

      addCurrentBtn.addEventListener('click', () => addSpecificDomain(currentDomain));
      addWildcardBtn.addEventListener('click', () => {
        const wildcardDomain = `*.${currentDomain.replace(/^[^.]+\./, '')}`;
        addSpecificDomain(wildcardDomain);
      });

      // Get existing domains and update UI
      updateDomainList();
      updateButtonStates();
    } catch (e) {
      document.querySelector('.current-domain-actions').style.display = 'none';
    }
  } else {
    document.querySelector('.current-domain-actions').style.display = 'none';
  }

  // Existing event listeners
  document.getElementById('addDomain').addEventListener('click', addDomain);
  document.getElementById('clearAll').addEventListener('click', clearAllDomains);
  
  // Add enter key support for input
  document.getElementById('domainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addDomain();
    }
  });
});

async function addSpecificDomain(domain) {
  if (!domains.includes(domain)) {
    domains.push(domain);
    await chrome.storage.local.set({ domains });
    await chrome.runtime.sendMessage({ type: 'updateRules' });
    updateDomainList();
    updateCurrentDomainStatus(currentDomain);
    
    // Update quick-add buttons state
    const addCurrentBtn = document.getElementById('addCurrentDomain');
    const addWildcardBtn = document.getElementById('addCurrentWildcard');
    addCurrentBtn.disabled = domain === currentDomain;
    addWildcardBtn.disabled = domain.startsWith('*.');
  }
}

// Modify existing addDomain function to update button states
async function addDomain() {
  const input = document.getElementById('domainInput');
  const domain = input.value.trim().toLowerCase();
  
  if (!domain) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 820);
    return;
  }
  
  if (!domains.includes(domain)) {
    domains.push(domain);
    await chrome.storage.local.set({ domains });
    await chrome.runtime.sendMessage({ type: 'updateRules' });
    input.value = '';
    updateDomainList();
    
    // Update quick-add buttons state if the added domain matches current domain
    if (domain === currentDomain || domain === `*.${currentDomain.replace(/^[^.]+\./, '')}`) {
      const addCurrentBtn = document.getElementById('addCurrentDomain');
      const addWildcardBtn = document.getElementById('addCurrentWildcard');
      addCurrentBtn.disabled = domain === currentDomain;
      addWildcardBtn.disabled = domain.startsWith('*.');
    }
  } else {
    // Visual feedback for duplicate domain
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 820);
  }
}

async function clearAllDomains() {
  if (domains.length && confirm('Are you sure you want to remove all domains?')) {
    domains = [];
    await chrome.storage.local.set({ domains });
    await chrome.runtime.sendMessage({ type: 'updateRules' });
    updateDomainList();
  }
}

function updateDomainList() {
  const list = document.getElementById('domainList');
  const domainCount = document.querySelector('.domain-count');
  
  list.innerHTML = '';
  domainCount.textContent = `${domains.length} domain${domains.length !== 1 ? 's' : ''}`;
  
  if (domains.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        No domains added yet. Add a domain to enable CORS bypass.
      </div>
    `;
    return;
  }
  
  domains.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'domain-item';
    
    const text = document.createElement('span');
    text.className = 'domain-text';
    text.textContent = domain;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = async () => {
      item.style.opacity = '0';
      await new Promise(r => setTimeout(r, 200));
      domains = domains.filter(d => d !== domain);
      await chrome.storage.local.set({ domains });
      await chrome.runtime.sendMessage({ type: 'updateRules' });
      updateDomainList();
    };
    
    item.appendChild(text);
    item.appendChild(removeBtn);
    list.appendChild(item);
    
    // Add fade-in animation
    setTimeout(() => {
      item.style.opacity = '1';
    }, 50 * index);
  });
}

// Add this function after other functions
function updateCurrentDomainStatus(hostname) {
  const statusText = document.createElement('span');
  statusText.className = 'status-indicator';
  
  const isActive = domains.some(domain => {
    if (domain.startsWith('*.')) {
      const wildcard = domain.slice(2);
      return hostname.endsWith(wildcard);
    }
    return domain === hostname;
  });
  
  statusText.textContent = isActive ? 'Active' : 'Inactive';
  statusText.classList.add(isActive ? 'status-active' : 'status-inactive');
  
  const currentDomainEl = document.getElementById('currentDomain');
  currentDomainEl.textContent = `Current domain: ${hostname} `;
  currentDomainEl.appendChild(statusText);
}
