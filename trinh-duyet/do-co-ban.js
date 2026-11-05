// do-co-ban.js: bộ đo cơ bản bài dịch vụ + địa danh (Kiến 247, Kiến Môi Trường). Chạy được trong trình duyệt (dán vào javascript_tool) và trong Node.
var KDO=(function(){
var SW=new Set('và của là cho được các những một này đó với khi thì để tại ở từ đến trong vào bạn chúng tôi sẽ đã đang rất cũng nên hay hoặc như nhưng mà nếu vì do bị lại còn mỗi cả đều phải gì ai đây ra'.split(' '));
var NOISE=new Set(['có thể','như sau','dưới đây','hiện nay','bên cạnh','ngoài ra','tuy nhiên','vì vậy','do đó','chính vì','thông tin','nhu cầu','cần phải','có nhiều','rất nhiều','nhiều người','chứ không','trường hợp','phần lớn','gần như','kể cả']);
function dec(s){var A='&';return s.replace(new RegExp(A+'nbsp;','g'),' ').replace(new RegExp(A+'quot;','g'),'"').replace(new RegExp(A+'#0?39;|'+A+'apos;','g'),"'").replace(new RegExp(A+'lt;','g'),'<').replace(new RegExp(A+'gt;','g'),'>').replace(new RegExp(A+'#(\\d+);','g'),function(_,n){return String.fromCharCode(+n)}).replace(new RegExp(A+'amp;','g'),'&')}
function txt(h){return dec(String(h).replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\[\/?[a-z_]+(?:\s[^\]]*)?\]/g,' ')).normalize('NFC').replace(/\s+/g,' ').trim()}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function R(p){return new RegExp('(?<![\\p{L}\\p{N}])'+p+'(?![\\p{L}\\p{N}])','giu')}
function cnt(re,t){re.lastIndex=0;return (t.match(re)||[]).length}
function has(re,t){re.lastIndex=0;return re.test(t)}
function toks(s){return s.match(/[\p{L}\p{N}_]+/gu)||[]}
function num(s){return s.replace(/(\d)[.,](?=\d{3}(?!\d))/g,'$1')}
function segs(low){return num(low).replace(/(\d+)\/(\d+)/g,'$1_$2').split(/[.,;:!?()\[\]{}"“”'‘’…|•·–—\-\/\n]+/).map(toks).filter(function(a){return a.length})}
function pairs(a){var s=new Set();a.forEach(function(p){var t=toks(String(p).toLowerCase());for(var i=0;i<t.length-1;i++)s.add(t[i]+' '+t[i+1])});return s}
function pct(a,b){return b?Math.round(a/b*1000)/10:0}
function frag(t,i,n,PH){for(var a=0;a<PH.length;a++){var p=PH[a],k;for(k=0;k<p.length-1;k++)if(t[i+n-1]===p[k]&&t[i+n]===p[k+1])return true;for(k=1;k<p.length;k++)if(t[i]===p[k]&&t[i-1]===p[k-1])return true}return false}
function ngrams(S,ex,min,top,PH){var m=new Map(),f=new Map();S.forEach(function(t){for(var n=2;n<=4;n++)for(var i=0;i+n<=t.length;i++){var g=t.slice(i,i+n);if(SW.has(g[0])||SW.has(g[n-1]))continue;if(g.every(function(x){return /^\d/.test(x)})||g.some(function(x){return /^\d{7,}$/.test(x)}))continue;var bad=false;for(var j=0;j<n-1;j++)if(ex.has(g[j]+' '+g[j+1])){bad=true;break}if(bad)continue;var k=g.join(' ');m.set(k,(m.get(k)||0)+1);if(frag(t,i,n,PH))f.set(k,(f.get(k)||0)+1)}});var o={},fr=[];Array.from(m).filter(function(x){return x[1]>=min}).sort(function(a,b){return b[1]-a[1]}).slice(0,top).forEach(function(x){var k=x[0].replace(/_/g,'/');o[k]=x[1];if((f.get(x[0])||0)>=0.8*x[1])fr.push(k)});return {ng:o,fr:fr}}
function count(S,phr){var o={};phr.forEach(function(p){var g=toks(p.toLowerCase().replace(/\//g,'_')),n=g.length,c=0;S.forEach(function(t){for(var i=0;i+n<=t.length;i++){var ok=true;for(var j=0;j<n;j++)if(t[i+j]!==g[j]){ok=false;break}if(ok)c++}});o[p]=c});return o}
function top2(mp,k){return Array.from(mp).sort(function(a,b){return b[1]-a[1]}).slice(0,k)}
function ctx(SEC,phr){var o={};phr.forEach(function(p){var g=toks(p.toLowerCase().replace(/\//g,'_')),n=g.length,c=0,sc=new Map(),nx=new Map(),pv=new Map();SEC.forEach(function(sec,si){sec.S.forEach(function(t){for(var i=0;i+n<=t.length;i++){var ok=true;for(var j=0;j<n;j++)if(t[i+j]!==g[j]){ok=false;break}if(!ok)continue;c++;sc.set(si,(sc.get(si)||0)+1);if(t[i+n])nx.set(t[i+n],(nx.get(t[i+n])||0)+1);if(i>0)pv.set(t[i-1],(pv.get(t[i-1])||0)+1)}})});if(c)o[p]=[c,top2(sc,2),top2(nx,2),top2(pv,1)]});return o}
function sents(html){var out=[];String(html).split(/(?=<h[23][\s>])/i).forEach(function(b,si){b.replace(/<\/(p|li|tr|h[1-6]|div|blockquote)>|<br\s*\/?>/gi,'\n').split('\n').forEach(function(line){var t=txt(line);if(!t)return;t.split(/(?<=[.!?…])\s+(?=[\p{Lu}\d])/u).forEach(function(x){x=x.trim();if(toks(x).length>=8)out.push([si,x.slice(0,300)])})})});return out}
function seq(W,s){var r=[];for(var i=0;i+s.length<=W.length;i++){var ok=true;for(var j=0;j<s.length;j++)if(W[i+j]!==s[j]){ok=false;break}if(ok)r.push(i)}return r}
function measure(html,cfg){
 var dv=cfg.dv.toLowerCase(),dd=cfg.dd.toLowerCase(),brand=(cfg.brand||[]).filter(Boolean);
 var L=txt(html).toLowerCase(),W=toks(L),N=W.length;
 var exR=R(esc(dv)+'\\s+tại\\s+(?:quận\\s+|huyện\\s+)?'+esc(dd)),svR=R(esc(dv)),ldR=R(esc(dd));
 var pos=[],x;exR.lastIndex=0;while((x=exR.exec(L)))pos.push(Math.round(x.index/L.length*100));
 var P=[0].concat(pos,[100]),gap=0;for(var i=0;i<P.length-1;i++)gap=Math.max(gap,P[i+1]-P[i]);
 var H=[],hr=/<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/gi;while((x=hr.exec(html)))H.push([x[1].toLowerCase(),txt(x[2])]);
 var h2=H.filter(function(h){return h[0]=='h2'}).map(function(h){return h[1]}),h3=H.filter(function(h){return h[0]=='h3'}).map(function(h){return h[1]});
 var S1=toks(dv),D1=toks(dd),sv=seq(W,S1),lc=seq(W,D1),adj=sv.filter(function(s){var e=s+S1.length;return lc.some(function(l){return (l-e>=0&&l-e<=1)||(s-(l+D1.length)>=0&&s-(l+D1.length)<=1)})}).length;
 var alts=[],ar=/alt="([^"]*)"/gi;while((x=ar.exec(html)))alts.push(x[1].toLowerCase().trim());
 var hrefs=[],lr=/<a\s[^>]*href="([^"]+)"/gi;while((x=lr.exec(html)))hrefs.push(x[1]);
 var host=cfg.host||'';
 var blk=html.split(/(?=<h[23][\s>])/i).map(function(b){return txt(b).toLowerCase()}).filter(function(t){return toks(t).length>5});
 var ex=dv+' tại '+dd;
 var m={w:N,ex:pos.length,dens:N?Math.round(pos.length*toks(ex).length/N*1000)/10:0,svc:cnt(svR,L),loc:cnt(ldR,L),quan:cnt(R('quận\\s+'+esc(dd)),L),gap:gap,
  h2n:h2.length,h3n:h3.length,h2ex:pct(h2.filter(function(t){return has(exR,t.toLowerCase())}).length,h2.length),h2sv:pct(h2.filter(function(t){return has(svR,t.toLowerCase())}).length,h2.length),
  prox:pct(adj,sv.length),phone:cnt(/0\d{2,3}[\s.]?\d{3}[\s.]?\d{3,4}(?!\d)/g,L),brand:brand.reduce(function(a,b){return a+cnt(R(esc(b.toLowerCase())),L)},0),
  img:(html.match(/<img\b/gi)||[]).length,altex:pct(alts.filter(function(a){return a==ex}).length,alts.length),bold:(html.match(/<(strong|b)\b[^>]*>/gi)||[]).length,
  tab:(html.match(/<table\b/gi)||[]).length,lin:hrefs.filter(function(h){return host&&h.indexOf(host)>=0}).length,tel:hrefs.filter(function(h){return /^tel:/i.test(h)}).length,
  faq:H.filter(function(h){return /\?\s*$/.test(h[1])}).length,psv:pct(blk.filter(function(t){return has(svR,t)}).length,blk.length),plc:pct(blk.filter(function(t){return has(ldR,t)}).length,blk.length)};
 var KW=(cfg.kw||[]).map(function(k){return String(k).toLowerCase().normalize('NFC')}),KR=KW.map(function(k){return R(toks(k).map(esc).join('\\s+'))});
 var vR=R(esc(dv)+'\\s+(?:(?:tại|ở)\\s+)?(?:(?:quận|huyện|thị\\s+xã|thành\\s+phố|tp\\.?)\\s+)?'+esc(dd));
 var fl=function(t){t=t.toLowerCase();return (has(exR,t)?'E':'')+(has(vR,t)?'V':'')+(has(svR,t)?'S':'')+(has(ldR,t)?'D':'')};
 var hm=H.filter(function(h){return (h[0]=='h2'||h[0]=='h3')&&!/^(m\u1ee5c l\u1ee5c|table of contents|n\u1ed9i dung b\u00e0i vi\u1ebft|n\u1ed9i dung ch\u00ednh)$/i.test(h[1].trim())}).map(function(h){return [+h[0][1],h[1].slice(0,90),fl(h[1])]});
 m.h2n=hm.filter(function(h){return h[0]==2}).length;m.h3n=hm.filter(function(h){return h[0]==3}).length;
 var pc=function(lv,c){var a=hm.filter(function(h){return h[0]==lv});return pct(a.filter(function(h){return h[2].indexOf(c)>=0}).length,a.length)};
 m.h2v=pc(2,'V');m.h2dd=pc(2,'D');m.h3ex=pc(3,'E');m.h3v=pc(3,'V');m.h3sv=pc(3,'S');m.h3dd=pc(3,'D');
 var fe=0;for(var q=0;q<hm.length;q++)if(hm[q][2].indexOf('E')>=0){fe=q+1;break}m.fhex=fe;
 m.h3per=m.h2n?Math.round(m.h3n/m.h2n*10)/10:0;
 var H2T=hm.filter(function(h){return h[0]==2}).map(function(h){return h[1].toLowerCase()}).join(' | '),H3T=hm.filter(function(h){return h[0]==3}).map(function(h){return h[1].toLowerCase()}).join(' | ');
 var kw={};KW.forEach(function(k,i){kw[k]=[cnt(KR[i],L),cnt(KR[i],H2T),cnt(KR[i],H3T)]});
 var S=segs(L),PH=[S1,D1].concat(brand.map(function(b){return toks(b.toLowerCase())})),G=ngrams(S,pairs([ex,dv+' '+dd,dv+' quận '+dd,'quận '+dd,'huyện '+dd].concat(brand)),2,cfg.top||200,PH);
 var SEC=html.split(/(?=<h[23][\s>])/i).map(function(b){var mh=/<(h[23])[^>]*>([\s\S]*?)<\/\1>/i.exec(b);return {h:mh?mh[1].slice(1)+'|'+txt(mh[2]):'(mở bài)',S:segs(txt(b).toLowerCase())}});
 return {r:{m:m,hm:hm,kw:kw,sh:SEC.map(function(x){return x.h}),ng:G.ng,fr:G.fr},S:S,SEC:SEC,hrefs:hrefs,L:L};
}
function page(cfg){
 var sel=['.entry-content','.post-content','.td-post-content','.single-content','.content-detail','.post-body','article','main','#content'],el=null,used='';
 if(cfg.sel){el=document.querySelector(cfg.sel);used=cfg.sel}
 for(var i=0;i<sel.length&&!el;i++){var es=document.querySelectorAll(sel[i]);for(var j=0;j<es.length;j++)if(es[j].innerText.length>2000){el=es[j];used=sel[i];break}}
 el=el||document.body;var og=document.querySelector('meta[property="og:site_name"]');
 var b=cfg.brand||(og?[og.content]:[]);var q=function(s){var e=document.querySelector(s);return e?(e.content||e.textContent||'').replace(/\s+/g,' ').trim():''};
 var o=measure(el.innerHTML,{dv:cfg.dv,dd:cfg.dd,brand:b,host:location.host,top:cfg.top,kw:cfg.kw});window.__S=o.S;window.__SEC=o.SEC;window.__IG={sh:o.r.sh,brand:b,s:sents(el.innerHTML)};
 var meta={url:location.href,sel:used||'body',brand:b,title:document.title.trim(),desc:q('meta[name="description"]'),h1:q('h1'),soh1:document.querySelectorAll('h1').length};
 var out={m:o.r.m,hm:o.r.hm,kw:o.r.kw,meta:meta};if(cfg.ng){out.sh=o.r.sh;out.ng=o.r.ng;out.fr=o.r.fr}
 if(cfg.own){var ln=[],ex=0;el.querySelectorAll('a[href]').forEach(function(a){var h=a.getAttribute('href')||'';if(/^(tel|mailto|#|javascript)/i.test(h))return;var u;try{u=new URL(h,location.href)}catch(e){return}if(u.host===location.host)ln.push([a.textContent.replace(/\s+/g,' ').trim().slice(0,60),u.pathname]);else ex++});out.links=ln;out.linkNgoai=ex;out.nums=Array.from(new Set(num(o.L).match(/\d+/g)||[]))}
 return out;
}
async function site(dv,n){ // chạy trong tab kienmoitruong.com: title/H1/meta các trang cùng dịch vụ (qua sitemap)
 n=n||12;var slug=dv.toLowerCase().replace(/đ/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().replace(/\s+/g,'-')+'-tai-';
 var self=location.origin+location.pathname,P=function(s){return new DOMParser().parseFromString(s,'text/xml')},L=function(x){return [].slice.call(x.getElementsByTagName('loc')).map(function(e){return e.textContent.trim()})};
 var maps=[],f=['/sitemap_index.xml','/wp-sitemap.xml'];for(var i=0;i<f.length&&!maps.length;i++){try{var r=await fetch(f[i]);if(r.ok)maps=L(P(await r.text()))}catch(e){}}
 var urls=new Set();await Promise.all(maps.filter(function(m){return !/image|category|tag|author/.test(m)}).map(async function(m){try{L(P(await (await fetch(m)).text())).forEach(function(u){var p;try{p=new URL(u).pathname}catch(e){return}if(/^\/[^\/.]+\/?$/.test(p)&&p.indexOf(slug)>=0&&u!==self)urls.add(u)})}catch(e){}}));
 var out=[];await Promise.all(Array.from(urls).slice(0,n).map(async function(u){try{var d=new DOMParser().parseFromString(await (await fetch(u)).text(),'text/html'),q=function(s){var e=d.querySelector(s);return e?(e.content||e.textContent||'').replace(/\s+/g,' ').trim():''};out.push({url:u,title:q('title'),h1:q('h1'),desc:q('meta[name="description"]')})}catch(e){}}));
 return {tong:urls.size,site:out};
}
function serp(){var o=[],seen=new Set();document.querySelectorAll('#search a h3, #rso a h3').forEach(function(h){var a=h.closest('a');if(!a||!a.href||/google\./.test(new URL(a.href).host)||a.closest('#tads,#bottomads'))return;var u=a.href.split('#')[0];if(seen.has(u))return;seen.add(u);o.push([o.length+1,u,h.textContent.trim().slice(0,110)])});var cap=!!document.querySelector('#captcha-form,form[action*="sorry"]')||/\/sorry\//.test(location.pathname);return {q:new URLSearchParams(location.search).get('q'),captcha:cap,kq:o.slice(0,10)}}
var api={serp:serp,measure:measure,page:page,count:count,ctx:ctx,segs:segs,txt:txt,toks:toks,num:num,pairs:pairs,NOISE:NOISE,site:site,sents:sents,SW:SW,
 x:function(phr){return ctx(window.__SEC,phr)},ig:function(){return window.__IG}};
if(typeof module!=='undefined')module.exports=api;
return api;})();
