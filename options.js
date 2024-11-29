// Saves options to chrome.storage
const saveOptions = () => {
  const campus = document.getElementById("cg-select-campus").value;

  chrome.storage.sync.set({ campus: campus }, () => {
    const status = document.getElementById("status");
    status.textContent = "Options saved";
    setTimeout(() => {
      status.textContent = "";
    }, 800);
  });
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get({ campus: "col" }, (items) => {
    document.getElementById("cg-select-campus").value = items.campus;
  });
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
