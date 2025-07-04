// scripts.js

document.addEventListener("DOMContentLoaded", () => {
  const sectionMap = {
    tablets: ["section-details", "medicines", "administration", "signoff"],
    inhalers: ["section-details", "medicines", "administration", "inhalers", "signoff"],
    creams: ["section-details", "medicines", "administration", "signoff"],
    "eyes": ["section-details", "medicines", "administration", "signoff"],
    liquids: ["section-details", "medicines", "administration", "signoff"],
    patches: ["section-details", "medicines", "administration", "patches", "signoff"],
    "ears": ["section-details", "medicines", "administration", "ear-drops", "signoff"],
    "nose": ["section-details", "medicines", "administration", "nose-drops", "signoff"]
  };

  const params = new URLSearchParams(window.location.search);
  const type = params.get("utm_type");

  if (!type || !sectionMap[type]) {
    console.warn(`No valid or supported utm_type found: "${type}"`);
    return;
  }

  const showSections = sectionMap[type];

  // Hide all fieldsets by default
  document.querySelectorAll("fieldset").forEach(fieldset => {
    fieldset.style.display = "none";
  });

  // Show only the mapped sections
  showSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "block";
    } else {
      console.warn(`Section with ID "${id}" not found in the document`);
    }
  });

  // Optionally update the page title
  document.title += ` – ${type.charAt(0).toUpperCase() + type.slice(1)}`;
});