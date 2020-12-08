(function () {
    "use strict";

    let isOpen = false;
    let modal;

    const HOST = "https://dotnet.razormeister.pl"

    // On a context_menu  message from the background or the toggle_modal command, toggle the modal.
    chrome.extension.onMessage.addListener( function ( message, sender, callback ) {
        if (message.function == "link-collector-toggle-modal") {
            toggleModal( );
        }
    });

    // Toggle modal
    function toggleModal() {
        if (isOpen)
            removeModal();
        else
            createModal();
    }

    // Get token from chrome storage
    const getToken = () =>
        new Promise((resolve, reject) =>
            chrome.storage.sync.get('jwtLinkCollector', result =>
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve(result.jwtLinkCollector)
            )
        )

    // Set token in chrome storage
    const setToken = (token) =>
        new Promise((resolve, reject) =>
            chrome.storage.sync.set({jwtLinkCollector: token}, () =>
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve()
            )
        )

    // Remove token from chrome storage
    const rmToken = () =>
        new Promise((resolve, reject) =>
            chrome.storage.sync.clear(() =>
                chrome.runtime.lastError
                    ? reject(Error(chrome.runtime.lastError.message))
                    : resolve()
            )
        )

    async function createModal(fade = true) {
        if (isOpen) return;

        modal = document.createElement('div');
        let token = await getToken();

        console.log(token);

        let modalHtml = '<div id="link-collector-modal-content">';
        modalHtml += '<div class="link-collector-modal-full-wrapper" id="link-collector-modal-loader-wrapper"><div id="link-collector-modal-loader"></div></div>';
        modalHtml += '<div class="link-collector-modal-full-wrapper" id="link-collector-modal-result-wrapper"><div id="link-collector-modal-result"></div></div>';
        modalHtml += '<div id="link-collector-modal-header"><h1>KNI Link Collector</h1><span id="link-collector-modal-close">&times;</span></div>';
        modalHtml += '<div id="link-collector-modal-body">';

        if(token) {
            modalHtml += '<form class="link-collector-modal-form" id="link-collector-modal-add-link-form">';
            modalHtml += '<div class="link-collector-modal-form-group"><label>Link</label><input id="link-collector-link" name="link-collector-link" placeholder="https://kni.mini.pw.edu.pl" value="' + window.location.href +'" required></div>';
            modalHtml += '<div class="link-collector-modal-form-group"><label>Link description</label><input id="link-collector-description" name="link-collector-description" placeholder="Very interesting link" required></div>';
            modalHtml += '<div class="link-collector-modal-form-group"><label>Category</label><select id="link-collector-category" name="link-collector-description" required>' +
                '<option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option>' +
                '</select></div>';
            modalHtml += '<div class="link-collector-modal-button-group"><button id="link-collector-modal-button">Save</button></div>';
            modalHtml += '</form>';
        } else {
            modalHtml += '<h4>First login using token</h4>';
            modalHtml += '<form class="link-collector-modal-form" id="link-collector-modal-log-in-form">';
            modalHtml += '<div class="link-collector-modal-form-group"><label>Token</label><input id="link-collector-token" name="link-collector-link" placeholder="Od1doosiem" required></div>';
            modalHtml += '<div class="link-collector-modal-button-group"><button id="link-collector-modal-button">Log in</button></div>';
            modalHtml += '</form>';
        }

        modalHtml += '</div>';

        modalHtml += '</div>';
        modal.innerHTML = modalHtml;

        modal.id = 'link-collector-modal';

        document.body.appendChild(modal);

        document.getElementById('link-collector-modal-close').addEventListener('click', removeModal);
        document.getElementById('link-collector-modal').addEventListener('click', checkOutsideClick);

        if (token) {
            document.getElementById('link-collector-modal-add-link-form').addEventListener('submit', addLink);
        } else {
            document.getElementById('link-collector-modal-log-in-form').addEventListener('submit', logIn);
        }

        if (fade) {
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
        } else {
            modal.style.opacity = "1";
            isOpen = true;
        }
    }

    function removeModal(fade = true) {
        if (!isOpen) return;

        if (!fade) {
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
        } else {
            document.body.removeChild(modal);
            isOpen = false;
        }
    }

    function checkOutsideClick(e) {
        if (e.target.id === 'link-collector-modal')
            removeModal();
    }

    async function logIn(e) {
        let result;
        let resetModal = false;

        try {
            e.preventDefault();
            document.getElementById('link-collector-modal-loader-wrapper').style.display = 'flex';

            let tokenValue = document.getElementById('link-collector-token').value;

            result = await fetch(HOST + "/auth/login?content=" + encodeURI(tokenValue), {
                method: "post",
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(async response => {
                    return response.json()
                })
                .then(async data => {
                    if(data.success) {
                        await setToken(data.data);
                        resetModal = true;
                        return "Success!";
                    }
                    else {
                        console.log("KNI LinkCollector error: " + data);
                        return "Error: " + data.message;
                    }
                }).catch((error) => {
                    console.log("KNI LinkCollector error: " + error);
                    return "Error: " + error.message;
                });
        } catch (error) {
            console.log("KNI LinkCollector error: " + error);
            result = "Error: " + error.message;
        }

        showResult(result, resetModal);
    }

    async function addLink(e) {
        let result;
        let resetModal = false;

        try {
            e.preventDefault();
            document.getElementById('link-collector-modal-loader-wrapper').style.display = 'flex';

            let token = await getToken();

            let data = {
                url: document.getElementById('link-collector-link').value,
                description: document.getElementById('link-collector-description').value,
                categoryId: parseInt(document.getElementById('link-collector-category').value)
            }

            result = await fetch(HOST + "/link/", {
                method: "post",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(data)
            })
                .then(async response => {
                    if (response.status === 200) { // HTTP OK
                        let data = await response.json();
                        if(data.success)
                            return "Success!";
                        else {
                            console.log("KNI LinkCollector error: " + data);
                            return "Error: " + data.msg;
                        }
                    } else if (response.status === 401) { // HTTP Unauthorized
                        await rmToken();
                        resetModal = true;
                        return "You have to pass token again";
                    } else {
                        try {
                            let data = await response.json();
                            return data.message;
                        } catch (error) {
                            return "Error: " + response.statusText + " (" + response.status + ")";
                        }
                    }
                })
                .catch((error) => {
                    console.log("KNI LinkCollector error: " + error);
                    return "Error: " + error.message;
                });
        } catch (error) {
            console.log("KNI LinkCollector error: " + error);
            result = "Error: " + error.message;
        }

        showResult(result, resetModal);
    }

    function showResult(result, resetModal) {
        document.getElementById('link-collector-modal-loader-wrapper').style.display = 'none';
        document.getElementById('link-collector-modal-result').innerHTML = result;
        document.getElementById('link-collector-modal-result-wrapper').style.display = 'flex';

        setTimeout((resetModal) => {
            document.getElementById('link-collector-modal-result-wrapper').style.display = 'none';

            if (resetModal) {
                removeModal();
                createModal();
            }
        }, 2000, resetModal);
    }
})();