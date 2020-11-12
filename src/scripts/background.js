(function () {
    "use strict";

    // Create context menu
    chrome.contextMenus.create({
         id: "link-collector-menu",
         title: "Add interesting link",
         contexts: ["all"]
    });

    // On context menu click, send message to show up modal
	 chrome.contextMenus.onClicked.addListener(function(info, tab) {
         chrome.tabs.sendMessage(tab.id, {
             function: "link-collector-toggle-modal"
         });
    });

	 // Handle shortcut to open modal
	 chrome.commands.onCommand.addListener(function(command) {
	     if (command == 'toggle-modal') {
             chrome.tabs.query({
                 "active": true,
                 "currentWindow": true
             }, function (tabs) {
                 let tab_id = tabs[0].id;

                 chrome.tabs.sendMessage(tab_id, {
                    function: "link-collector-toggle-modal"
                 });
             });
         }
     });
})();