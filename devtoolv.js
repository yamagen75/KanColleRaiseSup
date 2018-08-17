
/* デベロッパーツールにタブを追加 */

var kancol_urls = [
 /http:\/\/www.dmm.com\/.*\/app_id=854854\/.*/,
 /http:\/\/osapi.dmm.com\/.*aid=854854.*/,
 /\/kcs2\/index.php.*api_token=.*api_starttime=.*/
];

chrome.devtools.inspectedWindow.eval('document.baseURI',function(url){
	var fg = 0;
	for(var i in kancol_urls){
		if(kancol_urls[i].test(url)) fg = 1;
	}
	if(fg > 0) chrome.devtools.panels.create('艦これ情報','material/icon.png','dpnla.html');
});

