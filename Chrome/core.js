/*
*   Mixcloud Harvester Downloader
*   https://github.com/Bumxu/MixcloudHarvester
*
*   Copyright 2015 Juande Martos (http://www.bumxu.com/)
*   
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*   
*       http://www.apache.org/licenses/LICENSE-2.0
*   
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

// When you restart or install the extension, it searches all tabs and injects Mixcloud Harvester.
chrome.tabs.query({}, function(tabs){
	for (var t = 1; t < tabs.length; t++)
	{
		if ( /^https?:\/\/(www\.)?mixcloud\.com/.test(decodeURI(tabs[t].url)) )
		{
			chrome.tabs.executeScript(tabs[t].id, {file: "client.js", runAt: "document_end", allFrames: false});
			chrome.tabs.insertCSS(tabs[t].id, {file: "client.css", runAt: "document_end", allFrames: false});

			console.log("+<" + tabs[t].id + ">");
		}
	}
});

var injInCtx = function(id)
{
	var id = id;
	var tOut;

	var init = function()
	{
		tOut = setTimeout(function() {
			chrome.tabs.executeScript(id, {file: "client.js", runAt: "document_end", allFrames: false});
			chrome.tabs.insertCSS(id, {file: "client.css", runAt: "document_end", allFrames: false});

			console.log("+<" + id + ">");
		}, 500);

		chrome.tabs.sendMessage(id, {event: 'fake_h3upd'}, function(response) {
			if (response == "h3ack")
			{
				clearTimeout(tOut);
			}
		});
	}

	init();
}

// When a tab is updated check is Mixcloud, and in that case injected Harvester.
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {

	if ( info.status == 'complete' )
	{

		if ( /^https?:\/\/(www\.)?mixcloud\.com/.test(decodeURI(tab.url)) )
		{
			new injInCtx(tabId);
		}
	}

});

var updInCtx = function(reqDetails)
{
	var details = reqDetails;

	chrome.tabs.get(details.tabId, function(tab) {
		//> Are this tab a candidate
		if ( /^https?:\/\/(www\.)?mixcloud\.com/.test(tab.url) )
		{
			//> No frame && successful load
			if ( details.frameId == 0 && details.statusCode == 200 )
			{
				//> AJAX
				if ( details.type == "xmlhttprequest" )
				{
					//> PATTERNS
					if (	/mixcloud\.com\/?$/.test(details.url)
						||	/mixcloud\.com\/[a-zA-Z0-9_-]+\/?(\?[^_]*&_ajax=1)?$/.test(details.url)
						||	( /mixcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/.test(details.url) && !/mixcloud\.com\/notifications\//.test(details.url) )
						)
					{
						chrome.tabs.sendMessage(details.tabId, {event: 'h3upd'});

						console.log("·<" + details.tabId + ">");
					}
				}

				//> MAIN (This is best covered by onUpdated event)
				//if ( details.type == "main_frame" )
				//{
				//	//chrome.tabs.executeScript(details.tabId, {file: "client.js", runAt: "document_idle", allFrames: false});
				//	//chrome.tabs.insertCSS(details.tabId, {file: "client.css", runAt: "document_idle", allFrames: false});
				//
				//	//console.log("+<" + details.tabId + ">");
				//}
			}
		}
	});
}

// Complex method for detecting AJAX reloads on Mixcloud tabs :3.
chrome.webRequest.onCompleted.addListener(function(details) {
	updInCtx(details);
}, {
	urls: ["http://www.mixcloud.com/*", "https://www.mixcloud.com/*"]
});




var remoteInCtx = function(reqDetails)
{
	var details = reqDetails;

	chrome.tabs.get(details.tabId, function(tab) {
		//> Are this tab a candidate
		if ( /^https?:\/\/(www\.)?mixcloud\.com/.test(tab.url) )
		{
			chrome.tabs.sendMessage(details.tabId, {event: 'remote', url: details.url});
			console.log("*<" + details.tabId + ">");
		}
	});
}

chrome.webRequest.onHeadersReceived.addListener(function(details) {

	if (/\.(m4a|mp3)(\?start=)?$/.test(details.url) && !/\.mixcloud\.com\/(previews\/?)?/.test(details.url) )
	{
		remoteInCtx(details);
	}

}, {
	urls: ["http://*/*", "https://*/*"]
});