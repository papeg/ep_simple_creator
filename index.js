var padManager = require('ep_etherpad-lite/node/db/PadManager');

var settings = require('ep_etherpad-lite/node/utils/Settings');

var padPath = "p";
if (settings.ep_simple_creator) {
    if (settings.ep_simple_creator.padPath) {
        padPath = settings.ep_simple_creator.padPath;
    }
}


exports.eejsBlock_indexWrapper = function(hook_name, args) {
    // Remove the default pad creation form.
    args.content += '<script>' + String(removeInput) + 'removeInput();</script>';

    // Make the configured pad path available to the browser.
    args.content += '<script>const padPath = ' + JSON.stringify(padPath) + ';</script>';

    // Replace random pad creation with sequential pad IDs.
    args.content += '<script>' + String(go2Next) + '</script>';
    args.content += '<script>' + String(setupCreatorButton) + '</script>';
    args.content += '<script>document.addEventListener("DOMContentLoaded", setupCreatorButton);</script>';

    // Center the simplified start page.
    args.content += "<style>body > #wrapper{margin: auto; margin-top: 3em;}</style>";
};

function setupCreatorButton() {
    const button = document.getElementById('button');
    if (!button) return;

    // Replace the original button and its event handlers.
    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);

    const key = 'ep_simple_creator.create';

    replacement.setAttribute('data-l10n-id', key);
    replacement.removeAttribute('data-l10n-aria-label');

    function updateLabel() {
        const translated = window.html10n?.get(key);
        const label = translated && translated !== key
            ? translated
            : 'Create a new pad';

        replacement.textContent = label;
        replacement.setAttribute('aria-label', label);
    }

    // Apply the translation and update it when localization completes.
    window.html10n?.bind('localized', updateLabel);

    if (window.html10n?.getLanguage()) {
        updateLabel();
    }

    replacement.addEventListener('click', go2Next);
}

function removeInput() {
    // Hide the default pad creation form without removing it from the DOM.
    // Other Etherpad scripts may still access its elements.
    const label = document.getElementById("label");
    if (label) label.style.display = "none";

    const form = document.forms[0];
    if (form) form.style.display = "none";
}

async function go2Next() {
    try {
        // Request the next available numeric pad ID.
        const response = await fetch('/next_id');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();

        // Redirect the browser to the new pad.
        window.location.href = '/' + padPath + '/' + data.id;
    } catch (err) {
        console.error('ep_simple_creator:', err);
    }
}

exports.registerRoute = function(hook_name, args) {
    args.app.get("/next_id", async function(req, res) {
        try {
            const data = await padManager.listAllPads();
            res.json({ id: getNextId(data) });
        } catch (err) {
            console.error("ep_simple_creator:", err);
            res.status(500).json({ error: "Could not determine next pad ID" });
        }
    });
};

function getNextId(data) {
    if (data && data.padIDs) {
        // Find the smallest unused numeric pad ID, starting at 1.
        // The upper bound ensures a free ID even if all previous IDs are taken.
        for (var id = 1; id <= data.padIDs.length + 1; id++) {
            var found = false;

            // Check whether the current ID is already in use.
            for (var i = 0; i < data.padIDs.length; i++) {
                if (data.padIDs[i] == id) {
                    found = true;
                    break;
                }
            }

            // Return the first available ID.
            if (!found) {
                return id;
            }
        }
    }

    // Start with pad 1 if no pads exist.
    return 1;
}
