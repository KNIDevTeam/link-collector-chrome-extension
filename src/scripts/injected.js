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
        modalHtml += '<div id="link-collector-modal-loader-wrapper"><div id="link-collector-modal-loader"></div></div>';
        modalHtml += '<div id="link-collector-modal-header"><h1>KNI Link Collector</h1><span id="link-collector-modal-close">&times;</span></div>';
        modalHtml += '<div id="link-collector-modal-body"><form id="link-collector-modal-form">';
        modalHtml += '<div class="link-collector-modal-form-group"><label>Link</label><input name="link-collector-link" placeholder="https://kni.mini.pw.edu.pl" value="' + window.location.href +'"></div>';
        modalHtml += '<div class="link-collector-modal-form-group"><label>Link description</label><input name="link-collector-description" placeholder="cebula"></div>';
        modalHtml += '<button id="link-collector-modal-button">Save</button>';
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

    function formSubmit(e) {
        e.preventDefault();
        document.getElementById('link-collector-modal-loader-wrapper').style.display = 'flex';
    }
})();