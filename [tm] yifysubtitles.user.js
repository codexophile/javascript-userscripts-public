(async function () {
  "use strict";

  (async function () {
    "use strict";
    const { addButton } = await Collapsible();
    addButton("toggle", null, () => {
      toggleNonEnglishSubs();
    });
  })();

  if (!location.href.includes("movie-imdb")) return;

  //* filtering non english items
  hideNonEnglishSubs();

  //* sort table rows by span value
  sortTableRowsBySpanValue();

  // Function to sort table rows by span value in descending order
  function sortTableRowsBySpanValue() {
    // Get the table body
    const tbody = document.querySelector("tbody");

    // Get all tr elements
    const rows = Array.from(tbody.getElementsByTagName("tr"));

    // Sort the rows
    const sortedRows = rows.sort((a, b) => {
      // Get span values from each row
      const spanA = a.querySelector("span.label-success");
      const spanB = b.querySelector("span.label-success");

      // Extract numeric values, default to 0 if span doesn't exist
      const valueA = spanA ? parseFloat(spanA.textContent) : 0;
      const valueB = spanB ? parseFloat(spanB.textContent) : 0;

      // Sort in descending order
      return valueB - valueA;
    });

    // Remove existing rows
    rows.forEach((row) => tbody.removeChild(row));

    // Append sorted rows
    sortedRows.forEach((row) => tbody.appendChild(row));
  }

  function hideNonEnglishSubs() {
    document.querySelectorAll(`.sub-lang`).forEach((item) => {
      if (item.textContent === "English") return;
      item.parentElement.parentElement.style.display = "none";
    });
  }
  function showAllSubs() {
    document.querySelectorAll(`.sub-lang`).forEach((item) => {
      item.parentElement.parentElement.style.display = "table-row";
    });
  }
  function toggleNonEnglishSubs() {
    const isHidden = [...document.querySelectorAll(`.sub-lang`)].some(
      (item) => {
        return item.parentElement.parentElement.style.display === "none";
      }
    );
    if (isHidden) {
      showAllSubs();
    } else {
      hideNonEnglishSubs();
    }
  }
})();
