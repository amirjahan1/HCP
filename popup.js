document.getElementById('exportButton').addEventListener('click', exportStorageData);
document.getElementById('importButton').addEventListener('click', () => {
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', importStorageData);

function exportStorageData() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let url = new URL(tabs[0].url);
    let domain = url.hostname; // Extract the domain (e.g., "example.com")

    chrome.storage.local.get(null, function(localData) {
      chrome.storage.session.get(null, function(sessionData) {
        chrome.cookies.getAll({domain: domain}, function(cookies) {
          let data = {
            localStorage: localData,
            sessionStorage: sessionData,
            cookies: cookies
          };
          let blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
          let url = URL.createObjectURL(blob);
          let a = document.createElement('a');
          a.href = url;
          a.download = `${domain}_storage_data.json`; // Set filename to "domain_storage_data.json"
          a.click();
        });
      });
    });
  });
}

function importStorageData(event) {
  let file = event.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = function(e) {
    let data = JSON.parse(e.target.result);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      let url = new URL(tabs[0].url);
      let domain = url.hostname;

      if (data.localStorage) {
        chrome.storage.local.clear(function() {
          chrome.storage.local.set(data.localStorage);
        });
      }

      if (data.sessionStorage) {
        chrome.storage.session.clear(function() {
          chrome.storage.session.set(data.sessionStorage);
        });
      }

      if (data.cookies) {
        data.cookies.forEach(cookie => {
          chrome.cookies.set({
            url: (cookie.secure ? 'https://' : 'http://') + domain + cookie.path,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate
          });
        });
      }
    });
  };
  reader.readAsText(file);
}