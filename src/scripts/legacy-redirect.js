// Ensure the script only runs if window.pageJson.pageType is set
if (window.pageJson && window.pageJson.pageType) {
  const pageType = window.pageJson.pageType;
  const urlParams = new URLSearchParams(window.location.search);

  // Check if the URL contains ?mode=DEMO
  if (!urlParams.has("mode") || urlParams.get("mode") !== "DEMO") {
    let redirectUrl;

    // Determine the redirect URL based on the page type
    if (pageType === "donation" || pageType === "premiumgift") {
      redirectUrl = "https://nwf.org/donate";
    } else if (pageType === "advocacy") {
      redirectUrl = "https://nwfactionfund.org/take-action/";
    } else {
      redirectUrl = "https://nwf.org/";
    }

    // Append existing URL parameters to the redirect URL
    const queryString = urlParams.toString();
    if (queryString) {
      redirectUrl += `?${queryString}`;
    }

    // Redirect the visitor
    window.location.href = redirectUrl;
  } else {
    // If in demo mode, do not redirect. We will style the console log message to be more visible and bigger.
    console.log(
      "%cDemo mode is active. No redirection will occur.",
      "font-size: 16px; color: red; font-weight: bold; background-color: yellow; padding: 10px; border-radius: 5px;"
    );
  }
}
