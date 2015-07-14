/* サブウィンドウ起動用 */
function getifmsrc(){
	var fg = 0;		var wb = '';	var wc = null;	var wd = null;	var gu = '';	var ht = '';
	var wa = document.getElementById('flashWrap');
	if(wa != null){
		wb = wa.innerHTML;
		if(!(wb == null || wb == '')){
			wd = new RegExp('src="(.*)"');	wc = wb.match(wd);
			if(!(wc == null || wc.size < 2)){
				gu = wc[1];		fg = 1;
			}
		}
	}
	if(fg > 0){
		var sp = document.createElement('script');
		ht = 'function subwinopen(){ window.open("'+ gu;
		ht += '","kancollesubwin","width=800,height=480"); ';
		ht += 'document.getElementById("emorgb1").style.display = "none"; ';
		ht += 'document.getElementById("flashWrap").innerHTML = ""; }';
		sp.innerHTML = ht;	document.head.appendChild(sp);
		var ba = document.createElement('button');	ba.id = 'emorgb1';	ba.style.margin = '5px';
		ba.innerHTML = '艦これをサブウィンドウで開く';	ba.setAttribute('onclick','subwinopen();');
		var bp = document.createElement('div');
		bp.style.whiteSpace = 'pre-wrap';	bp.style.position = 'absolute';	bp.style.backgroundColor = '#fff';
		bp.style.top = '545px';	bp.style.left = '325px';	bp.style.width = '190px';	bp.style.height = '30px';
		bp.appendChild(ba);		document.body.appendChild(bp);
	}else{
		window.setTimeout(getifmsrc,1000);
	}
}
window.setTimeout(getifmsrc,1000);
