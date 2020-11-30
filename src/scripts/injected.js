(function () {
    "use strict";

    let isOpen = false;
    let modal;

    // On a context_menu  message from the background or the toggle_modal command, toggle the modal.
    chrome.extension.onMessage.addListener( function ( message, sender, callback ) {
        if (message.function == "link-collector-toggle-modal") {
            toggleModal( );
        }
    });

    function toggleModal() {
        if (isOpen)
            removeModal();
        else
            createModal();
    }

    function createModal() {
        if (isOpen) return;

        modal = document.createElement('div');

        let modalHtml = '<div id="link-collector-modal-content">';
        modalHtml += '<div class="link-collector-modal-full-wrapper" id="link-collector-modal-loader-wrapper"><div id="link-collector-modal-loader"></div></div>';
        modalHtml += '<div class="link-collector-modal-full-wrapper" id="link-collector-modal-result-wrapper"><div id="link-collector-modal-result"></div></div>';
        modalHtml += '<div id="link-collector-modal-header"><h1>KNI Link Collector</h1><span id="link-collector-modal-close">&times;</span></div>';
        modalHtml += '<div id="link-collector-modal-body"><form id="link-collector-modal-form">';
        modalHtml += '<div class="link-collector-modal-form-group"><label>Link</label><input id="link-collector-link" name="link-collector-link" placeholder="https://kni.mini.pw.edu.pl" value="' + window.location.href +'" required></div>';
        modalHtml += '<div class="link-collector-modal-form-group"><label>Link description</label><input id="link-collector-description" name="link-collector-description" placeholder="Very interesting link" required></div>';
        modalHtml += '<div class="link-collector-modal-button-group"><button id="link-collector-modal-button">Save</button></div>';
        modalHtml += '</form></div>';
        modalHtml += '</div>';
        modal.innerHTML = modalHtml;

        modal.id = 'link-collector-modal';

        document.body.appendChild(modal);

        document.getElementById('link-collector-modal-close').addEventListener('click', removeModal);
        document.getElementById('link-collector-modal-form').addEventListener('submit', formSubmit);
        document.getElementById('link-collector-modal').addEventListener('click', checkOutsideClick);

        let opacity = 0;
        let id = setInterval(frame, 10);
        function frame() {
            if (opacity >= 1) {
                clearInterval(id);
                isOpen = true;
            } else {
                opacity += 0.1;
                modal.style.opacity = opacity.toString();
            }
        }
    }

    function removeModal() {
        if (!isOpen) return;

        let opacity = 1;
        let id = setInterval(frame, 10);
        function frame() {
            if (opacity <= 0) {
                clearInterval(id);
                document.body.removeChild(modal);
                isOpen = false;
            } else {
                opacity -= 0.1;
                modal.style.opacity = opacity.toString();
            }
        }
    }

    function checkOutsideClick(e) {
        if (e.target.id === 'link-collector-modal')
            removeModal();
    }

    async function formSubmit(e) {
        let result;

        try {
            e.preventDefault();
            document.getElementById('link-collector-modal-loader-wrapper').style.display = 'flex';

            let data = {
                link: document.getElementById('link-collector-link').value,
                link_description: document.getElementById('link-collector-description').value
            }

            result = await fetch("https://razormeister.pl/link_collector/", {
                method: "post",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    if(data.success)
                        return "Success!";
                    else {
                        console.log("KNI LinkCollector error: " + data);
                        return "Error: " + data.msg;
                    }
                }).catch((error) => {
                    console.log("KNI LinkCollector error: " + error);
                    return "Error: " + error.message;
                });
        } catch (error) {
            console.log("KNI LinkCollector error: " + error);
            result = "Error: " + error.message;
        }

        document.getElementById('link-collector-modal-loader-wrapper').style.display = 'none';
        document.getElementById('link-collector-modal-result').innerHTML = result;
        document.getElementById('link-collector-modal-result-wrapper').style.display = 'flex';

        setTimeout(() => document.getElementById('link-collector-modal-result-wrapper').style.display = 'none', 2000);
    }
})();