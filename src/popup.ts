const searchInput = document.getElementById("search-input") as HTMLInputElement;
const resultsList = document.getElementById("results-list") as HTMLUListElement;

searchInput.addEventListener("input", (event) => {
  const query = searchInput.value.trim();
  if (!query) {
    resultsList.innerHTML = "";
    return;
  }

  chrome.runtime.sendMessage({ type: "SEARCH_TABS", query }, (tabs) => {
    resultsList.innerHTML = "";

    for (const tab of tabs) {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = tab.url;
      link.textContent = tab.title || tab.url;
      link.target = "_blank";
      listItem.appendChild(link);
      resultsList.appendChild(listItem);
    }
  });
});
