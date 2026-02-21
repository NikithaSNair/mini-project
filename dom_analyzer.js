function extractDOMFeatures() {

    // -----------------------------
    // Password Fields
    // -----------------------------
    const passwordFields = document.querySelectorAll("input[type='password']").length;

    // -----------------------------
    // Scripts (external + inline)
    // -----------------------------
    const externalScripts = document.querySelectorAll("script[src]").length;
    const inlineScripts = [...document.querySelectorAll("script")]
        .filter(script => !script.src).length;

    const scripts = externalScripts + inlineScripts;

    // -----------------------------
    // Hidden Forms Detection
    // -----------------------------
    const hiddenForms = [...document.forms].filter(form => {
        const style = window.getComputedStyle(form);
        return (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
        );
    }).length;

    // -----------------------------
    // Normalize Values (Optional but Recommended)
    // -----------------------------
    const normalizedFeatures = {
        passwordFields: Math.min(passwordFields, 10),
        scripts: Math.min(scripts, 50),
        hiddenForms: Math.min(hiddenForms, 10)
    };

    return normalizedFeatures;
}
