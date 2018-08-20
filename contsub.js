/* サブウィンドウ起動用 */
function getifmsrc(){
	var fg = 0;		var wb = '';	var wc = null;	var wd = null;	var gu = '';	var ht = '';
	var wa = document.getElementById('flashWrap');
	if(wa != null){
		wb = wa.innerHTML;
		if(!(wb == null || wb == '')){
			wd = new RegExp('src="(.*?)"');	wc = wb.match(wd);
			if(!(wc == null || wc.size < 2)){
				gu = wc[1];		fg = 1;
			}
		}
	}
	if(fg > 0){
		var st = document.getElementById('spacing_top');
		if(st != undefined) st.style.display = 'none';
		var gn = document.getElementById('globalNavi');
		if(gn != undefined) gn.style.display = 'none';
		var sp = document.createElement('script');
		ht = 'function subwinopen(){ window.open("'+ gu.replace(/&amp;/g,'&');
		ht += '","kancollesubwin","width=1200,height=727"); ';
		ht += 'document.getElementById("emorgb2").style.display = "none"; ';
		ht += 'document.getElementById("flashWrap").innerHTML = ""; } ';
		ht += 'function globalnavionoff(){ var gn = document.getElementById("globalNavi"); var fa = "block"; ';
		ht += 'var bn = document.getElementById("emorgb3"); var fb = "ﾅﾋﾞｹﾞｰｼｮﾝ非表示"; ';
		ht += 'if(gn.style.display != "none"){ fa = "none"; fb = "ﾅﾋﾞｹﾞｰｼｮﾝ表示"; } ';
		ht += 'gn.style.display = fa; bn.innerHTML = fb; } ';
		ht += 'function orgbtnopenclose(pt){ var fa = "block"; var fb = "none"; var fc = "195px"; ';
		ht += 'if(pt > 0){ fa = "none"; fb = "block"; fc = "18px"; } ';
		ht += 'document.getElementById("emorgb1").style.width = fc; ';
		ht += 'document.getElementById("emorgb4").style.display = fa; ';
		ht += 'document.getElementById("emorgb5").style.display = fb; }';
		sp.innerHTML = ht;
		document.head.appendChild(sp);
		ht = '<div id="emorgb4"><div style="margin:0 0 5px 0;" id="emorgb2">';
		ht += '<button type="button" onClick="subwinopen();">艦これをｻﾌﾞｳｨﾝﾄﾞｳで開く</button></div>';
		ht += '<div><button type="button" onClick="orgbtnopenclose(1);" style="margin:0 5px 0 0;">';
		ht += '< 閉じる</button>';
		ht += '<button type="button" id="emorgb3" onClick="globalnavionoff();">';
		ht += 'ﾅﾋﾞｹﾞｰｼｮﾝ表示</button></div></div>';
		ht += '<div id="emorgb5" style="display:none;">';
		ht += '<button type="button" onClick="orgbtnopenclose(0);" style="margin:0;padding:0;">';
		ht += '開<br />く<br />></button></div>';
		var bp = document.createElement('div');
		bp.id = 'emorgb1';
		bp.style.whiteSpace = 'pre-wrap';
		bp.style.position = 'absolute';
		bp.style.backgroundColor = '#fff';
		bp.style.top = '745px';
		bp.style.left = '0px';
		bp.style.width = '195px';
		bp.style.height = '65px';
		bp.style.textAlign = 'left';
		bp.innerHTML = ht;
		document.body.appendChild(bp);
	}else{
		window.setTimeout(getifmsrc,1000);
	}
}
window.setTimeout(getifmsrc,1000);
