#!/usr/bin/env node
// chuyen-sau.js: CLI bộ đo chuyên sâu (PA2, PA3). cand | cum | ig | dup | xungdot
// Phần đo trang dùng chung với do-co-ban.js. Bộ từ đi kèm, information gain, kiểm trùng ý theo skill IG.
const fs=require('fs'),path=require('path'),K=require(path.join(__dirname,'..','trinh-duyet','do-co-ban.js'));
const J=f=>JSON.parse(fs.readFileSync(f,'utf8')),A=process.argv.slice(2),cmd=A.shift();
const nm=f=>path.basename(f).replace(/\.json$/,'');
function me(cfg,file){return K.measure(fs.readFileSync(file,'utf8'),cfg)}
if(false){}
else if(cmd==='cand'){ // mỗi tab: cụm cần đếm lại (≥3 ở đối thủ khác, chưa có ở đây) + cụm chung sơ bộ cần lấy bối cảnh
 const D=A.map(f=>[nm(f),J(f).ng]),U={};D.forEach(([,g])=>Object.keys(g).forEach(k=>U[k]=(U[k]||[]).concat(g[k])));
 const pre=Object.keys(U).filter(k=>U[k].length>=2).sort((a,b)=>U[b].reduce((s,v)=>s+v,0)-U[a].reduce((s,v)=>s+v,0)).slice(0,60),out={};
 D.forEach(([n,ng])=>{const s=new Set(pre);D.forEach(([m,o])=>{if(m!==n)for(const k in o)if(o[k]>=3&&!(k in ng))s.add(k)});out[n]=[...s].slice(0,110)});
 console.log(JSON.stringify(out));}
else if(cmd==='cum'){ // bộ từ đi kèm theo mật độ % (luật skill IG) + nhãn xung đột với dịch vụ khác cùng địa danh
 const cfg=J(A[0]),bai=A[1];let cf=null,XD=null,ds=[];A.slice(2).forEach((a,i,arr)=>{if(a==='--cnt')cf=J(arr[i+1]);else if(a==='--xd')XD=J(arr[i+1]);else if(arr[i-1]!=='--cnt'&&arr[i-1]!=='--xd')ds.push(a)});
 const D=ds.map(f=>[nm(f),J(f)]),M=me(cfg,bai),mm=M.r.m,o=[];
 // co-occurrence: đếm mọi lần xuất hiện; không tự bỏ cụm nào, chỉ gắn đề xuất
 const X=n=>(cf&&cf[n])||{},C=D.map(([n,d])=>{const g=Object.assign({},d.ng);const x=X(n);for(const k in x)if(!(k in g))g[k]=x[k][0];return [n,g]});
 const FR=new Set();D.forEach(([,d])=>(d.fr||[]).forEach(k=>FR.add(k)));const keys=new Set();C.forEach(([,g])=>Object.keys(g).forEach(k=>keys.add(k)));
 let L=[...keys].map(p=>({p,c:C.map(([,g])=>g[p]||0)})).filter(x=>x.c.filter(v=>v>0).length>=2);
 L.sort((a,b)=>b.p.split(' ').length-a.p.split(' ').length);const kept=[];
 L.forEach(x=>{const sub=kept.some(q=>(' '+q.p+' ').includes(' '+x.p+' ')&&q.c.every((v,i)=>v>=0.7*x.c[i]));if(!sub)kept.push(x)});
 kept.sort((a,b)=>b.c.reduce((s,v)=>s+v,0)-a.c.reduce((s,v)=>s+v,0));const top=kept.slice(0,+(cfg.cooc_top||50)),ps=top.map(x=>x.p);
 const mc=K.count(M.S,ps),mx_=K.ctx(M.SEC,ps),cs={Thiếu:0,Đạt:0,Thừa:0};
 const mg=(arrs,k)=>{const m=new Map();arrs.forEach(a=>(a||[]).forEach(([w,n])=>m.set(w,(m.get(w)||0)+n)));return [...m].sort((a,b)=>b[1]-a[1]).slice(0,k)};
 const T=(sh,i)=>String((sh||[])[i]||'?').replace(/^\d\|/,'').slice(0,32);const bc=p=>{const xs=D.map(([n,d])=>X(n)[p]?[X(n)[p],d.sh]:null).filter(Boolean);if(!xs.length)return '—';const sc=mg(xs.map(([x,sh])=>x[1].map(([i,c])=>[T(sh,i),c])),2),nx=mg(xs.map(([x])=>x[2]),2),pv=mg(xs.map(([x])=>x[3]),1);
  return sc.map(([h,n])=>`${h} (${n})`).join('; ')+(nx.length?` · sau: ${nx.map(([w,n])=>w.replace(/_/g,'/')+' '+n).join(', ')}`:'')+(pv.length?` · trước: ${pv[0][0]} ${pv[0][1]}`:'')};
 const XF=(XD&&XD.manh)||[],xdOf=p=>{const t=' '+p+' ';const h=XF.find(([f])=>t.includes(' '+f+' ')||(' '+f+' ').includes(t));return h?h[1]:null};
 const dx=p=>{const x=xdOf(p);if(x)return 'XUNG ĐỘT ('+x+'): không thêm, giảm';return K.NOISE.has(p)?'bỏ? (cụm chung)':FR.has(p)?'bỏ? (thường là mảnh của từ khoá/thương hiệu)':'giữ'};
 // mục tiêu theo mật độ %: % = số lần × số âm tiết của cụm ÷ độ dài bài × 100; quy ra số lần theo độ dài bài hiện tại
 const WD=D.map(([,d])=>d.m.w),wb=mm.w,f2=v=>(Math.round(v*100)/100).toFixed(2);
 const rows=top.map(x=>{const k=x.p.split(' ').length,ds=x.c.map((v,i)=>v*k/WD[i]*100),pv=ds.filter((_,i)=>x.c[i]>0),mxp=Math.max(...pv),mnp=Math.min(...pv),lop=(mxp+mnp)/2,hip=(lop+mxp)/2;
  const toN=q=>q*wb/(100*k);let lo=Math.ceil(toN(lop)),hi=Math.max(lo+1,Math.round(toN(hip)));if(lo<=3){lo=2;hi=3}
  const v=mc[x.p],vp=v*k/wb*100,xd=xdOf(x.p),kq=xd?(v>0?'Giảm':'Đạt'):v<lo?'Thiếu':v>hi+2?'Thừa':'Đạt';cs[kq]=(cs[kq]||0)+1;const mine=mx_[x.p]?mx_[x.p][1].map(([i,n])=>`${T(M.r.sh,i)} (${n})`).slice(0,2).join('; '):'—';
  return {kq,s:`| ${x.p} | ${x.c.map((v,i)=>v+' ('+f2(ds[i])+'%)').join(' | ')} | ${xd?'0 (không thêm)':f2(lop)+'–'+f2(hip)+'% ('+lo+'–'+hi+' lần)'} | ${v} (${f2(vp)}%) | ${kq==='Thiếu'?'Thiếu +'+(lo-v):kq==='Thừa'?'Thừa −'+(v-hi):kq==='Giảm'?'Giảm (xung đột)':'Đạt'} | ${bc(x.p)} | ${mine} | ${dx(x.p)} |`}});
  const OR={Giảm:0,Thiếu:1,Thừa:2,Đạt:3};rows.sort((a,b)=>OR[a.kq]-OR[b.kq]);
 o.push('',`## Bộ từ đi kèm theo mật độ % (bài ${wb} âm tiết; ${top.length} cụm; Xung đột ${cs.Giảm||0} · Thiếu ${cs.Thiếu||0} · Thừa ${cs.Thừa||0} · Đạt ${cs.Đạt||0})`,`| Cụm | ${D.map(d=>d[0]).join(' | ')} | Mục tiêu | Bài | KQ | Bối cảnh đối thủ (mục; từ đi sau/trước) | Bài đang đặt ở | Đề xuất |`,'|---|'+D.map(()=>'---|').join('')+'---|---|---|---|---|---|',...rows.map(r=>r.s));
 console.log(o.join('\n'));}
else if(cmd==='ig'){ // information gain: câu riêng của từng đối thủ (ít trùng đối thủ khác) + câu riêng của bài
 const cfg=J(A[0]),html=fs.readFileSync(A[1],'utf8'),D=A.slice(2).map(f=>[nm(f).replace(/_ig$/,''),J(f)]);
 const NZ=x=>{const l=x.toLowerCase();return /^(số\s|vp\d|cơ sở\s*\d|xem thêm|tham khảo thêm|hotline)/u.test(l)||/0\d{2,3}[.\s]?\d{3}[.\s]?\d{3}/.test(l)||(l.startsWith(cfg.dv.toLowerCase()+' tại ')&&!l.includes(cfg.dd.toLowerCase()))};
 const kw=K.pairs([cfg.dv+' tại '+cfg.dd,cfg.dv+' '+cfg.dd,'quận '+cfg.dd,'huyện '+cfg.dd].concat(cfg.brand||[],cfg.kw||[]));
 const G=s=>{const t=K.toks(K.num(s.toLowerCase())),o=new Set();for(let i=0;i<t.length-1;i++){const p=t[i]+' '+t[i+1];if(K.SW.has(t[i])&&K.SW.has(t[i+1]))continue;if(kw.has(p))continue;o.add(p)}D.forEach(([,d])=>(d.brand||[]).forEach(b=>K.pairs([b]).forEach(p=>o.delete(p))));return o};
 const U=arr=>{const o=new Set();arr.forEach(([,x])=>G(x).forEach(p=>o.add(p)));return o};
 const M=K.measure(html,cfg).r,BH=M.sh.map(h=>h.replace(/^\d\|/,'').toLowerCase()),BS=K.sents(html).filter(([si,x])=>!NZ(x)&&!BH.some(h=>h.length>8&&x.toLowerCase().startsWith(h))),BU=U(BS),DU=D.map(([,d])=>U(d.s));
 const ov=(g,S)=>{let n=0;g.forEach(p=>{if(S.has(p))n++});return g.size?n/g.size:1};
 const dk=s=>{const f=[];if(/\d/.test(s))f.push('số');if(/[^.!?\s]\s+[\p{Lu}][\p{Ll}]+(\s+[\p{Lu}][\p{Ll}]+)+/u.test(s))f.push('tên riêng');if(/(?:bước|đầu tiên|sau đó|trước khi|nếu|khi nào|không nên|tránh|so với|hơn)/iu.test(s))f.push('cách làm/so sánh');return f.join(', ')||'—'};
 const T=(sh,i)=>String((sh||[])[i]||'?').replace(/^\d\|/,'').slice(0,40),cut=s=>s.length>170?s.slice(0,167)+'…':s,o=[];
 const lim=+(cfg.ig_top||30);
 D.forEach(([n,d],k)=>{const oth=new Set();DU.forEach((S,j)=>{if(j!==k)S.forEach(p=>oth.add(p))});
  const HS=d.sh.map(h=>h.replace(/^\d\|/,'').toLowerCase());const R=d.s.filter(([si,x])=>!NZ(x)&&!HS.some(h=>h.length>8&&x.toLowerCase().startsWith(h))).map(([si,x])=>{const g=G(x);return {si,x,g:g.size,o:ov(g,oth),b:ov(g,BU),f:dk(x)}}).filter(r=>r.g>=5&&r.o<0.3).sort((a,b)=>(b.f!=='—')-(a.f!=='—')||a.o-b.o).slice(0,lim);
  o.push(`## Câu riêng của ${n} (${R.length}/${d.s.length} câu, trùng đối thủ khác < 30%)`,'| # | Mục | Câu | Trùng đt khác | Trùng bài | Dữ kiện |','|---|---|---|---|---|---|',...R.map((r,i)=>`| ${n}.${i+1} | ${T(d.sh,r.si)} | ${cut(r.x)} | ${Math.round(r.o*100)}% | ${Math.round(r.b*100)}% | ${r.f} |`),'')});
 const all=new Set();DU.forEach(S=>S.forEach(p=>all.add(p)));
 const B=BS.map(([si,x])=>{const g=G(x);return {si,x,g:g.size,o:ov(g,all),f:dk(x)}}).filter(r=>r.g>=5),BR=B.filter(r=>r.o<0.25).sort((a,b)=>(b.f!=='—')-(a.f!=='—')||a.o-b.o);
 const secs={};BR.forEach(r=>{const h=T(M.sh,r.si);secs[h]=(secs[h]||0)+1});
 o.push(`## Information gain của bài: ${BR.length}/${B.length} câu (${B.length?Math.round(BR.length/B.length*100):0}%) trùng đối thủ < 25%`,'Theo mục: '+Object.entries(secs).sort((a,b)=>b[1]-a[1]).map(([h,c])=>`${h} (${c})`).join(' · '),'| # | Mục | Câu | Trùng đối thủ | Dữ kiện |','|---|---|---|---|---|',...BR.slice(0,lim+10).map((r,i)=>`| b.${i+1} | ${T(M.sh,r.si)} | ${cut(r.x)} | ${Math.round(r.o*100)}% | ${r.f} |`));
 console.log(o.join('\n'));}
else if(cmd==='dup'){ // câu trùng ý trong bài: bỏ từ nối, hư từ, từ khoá, thương hiệu; không xét thứ tự từ
 const P=[];let old=null,th=0.6;for(let i=0;i<A.length;i++){if(A[i]==='--truoc')old=A[++i];else if(A[i]==='--nguong')th=+A[++i];else P.push(A[i])}
 const cfg=J(P[0]),html=fs.readFileSync(P[1],'utf8');
 const NOI=('ngoài ra|bên cạnh đó|bên cạnh|thêm vào đó|hơn thế nữa|hơn nữa|không chỉ vậy|không những thế|đặc biệt là|đặc biệt|vì vậy|vì thế|do đó|do vậy|chính vì vậy|chính vì thế|chính vì|nhờ đó|nhờ vậy|từ đó|qua đó|như vậy|tóm lại|nói chung|nói cách khác|cụ thể là|cụ thể|tuy nhiên|thế nhưng|song|trên thực tế|thực tế là|thực tế|điều này|việc này|nhìn chung|có thể nói|có thể thấy|đồng thời|bởi vì|bởi|vậy nên|cho nên|nên|luôn luôn|luôn|hãy|ngay lập tức|ngay|nhé|rằng|điều|việc|sự|hết sức|cực kỳ|vô cùng|khá|quá|thật sự|thực sự|chắc chắn|hoàn toàn|nhanh chóng|kịp thời|tận tình|chu đáo|chuyên nghiệp|uy tín|quý khách|khách hàng|gia đình|anh chị|anh|chị|mình|họ|nó|đây|kia|ấy|nữa|vẫn|đúng|chính|thì|là|có|được').split('|').map(x=>K.toks(x)).sort((a,b)=>b.length-a.length);
 const KW=new Set(K.toks([cfg.dv,cfg.dd,'quận huyện phường'].concat(cfg.brand||[]).join(' ').toLowerCase()));
 const CT=s=>{const t=K.toks(K.num(s.toLowerCase().normalize('NFC'))),o=[];for(let i=0;i<t.length;){let m=0;for(const p of NOI){let ok=true;for(let j=0;j<p.length;j++)if(t[i+j]!==p[j]){ok=false;break}if(ok){m=p.length;break}}if(m){i+=m;continue}if(!K.SW.has(t[i])&&!KW.has(t[i]))o.push(t[i]);i++}return o};
 const BG=a=>{const s=new Set();for(let i=0;i<a.length-1;i++)s.add(a[i]+' '+a[i+1]);return s};
 const NZ=x=>{const l=x.toLowerCase();return /^(số\s|vp\d|cơ sở\s*\d|xem thêm|tham khảo thêm|hotline|địa chỉ)/u.test(l)||/0\d{2,3}[.\s]?\d{3}[.\s]?\d{3}/.test(l)};
 const M=K.measure(html,cfg).r,BH=M.sh.map(h=>h.replace(/^\d\|/,'').toLowerCase());
 const norm=x=>K.toks(x.toLowerCase()).join(' ');const OLD=old?new Set(K.sents(fs.readFileSync(old,'utf8')).map(([,x])=>norm(x))):null;
 const S=K.sents(html).filter(([si,x])=>!NZ(x)&&!BH.some(h=>h.length>8&&x.toLowerCase().startsWith(h))).map(([si,x])=>{const c=CT(x);return {si,x,c,set:new Set(c),bg:BG(c),moi:OLD?!OLD.has(norm(x)):null}}).filter(r=>r.set.size>=4);
 const R=[];for(let i=0;i<S.length;i++)for(let j=i+1;j<S.length;j++){const a=S[i],b=S[j];let n=0;a.set.forEach(w=>{if(b.set.has(w))n++});const mn=Math.min(a.set.size,b.set.size),ct=n/mn;if(ct<th)continue;let nb=0;a.bg.forEach(p=>{if(b.bg.has(p))nb++});const bc=nb/Math.max(1,Math.min(a.bg.size,b.bg.size));
  const na=new Set(K.num(a.x).match(/\d+/g)||[]),so=(K.num(b.x).match(/\d+/g)||[]).filter(v=>na.has(v));const lv=(ct>=0.8&&bc>=0.5)||ct>=0.9?'Trùng':'Gần trùng';
  const chung=[...a.set].filter(w=>b.set.has(w));R.push({a,b,ct,bc,lv,so:[...new Set(so)],chung})}
 R.sort((p,q)=>(p.lv==='Trùng'?0:1)-(q.lv==='Trùng'?0:1)||q.ct-p.ct);
 const T=i=>String(M.sh[i]||'?').replace(/^\d\|/,'').slice(0,30),cut=s=>s.length>150?s.slice(0,147)+'…':s,mk=r=>r.moi===null?'':r.moi?' **[mới]**':'';
 const nT=R.filter(r=>r.lv==='Trùng').length,nM=OLD?R.filter(r=>r.a.moi||r.b.moi).length:0,o=[];
 o.push(`## Câu trùng ý trong bài: Trùng ${nT} · Gần trùng ${R.length-nT}${OLD?` · có câu mới ${nM}`:''} (${S.length} câu, ngưỡng ${th})`,'Đo trên từ nội dung: đã bỏ từ nối, hư từ, từ khoá, thương hiệu; không xét thứ tự từ.','| # | Mức | Câu A (mục) | Câu B (mục) | Từ chung | Trùng từ | Trùng cặp | Số chung |','|---|---|---|---|---|---|---|---|',
  ...R.map((r,i)=>`| d${i+1} | ${r.lv} | ${cut(r.a.x)} _(${T(r.a.si)})_${mk(r.a)} | ${cut(r.b.x)} _(${T(r.b.si)})_${mk(r.b)} | ${r.chung.slice(0,10).join(' ')} | ${Math.round(r.ct*100)}% | ${Math.round(r.bc*100)}% | ${r.so.join(', ')||'—'} |`));
 console.log(o.join('\n'));}
else if(cmd==='xungdot'){ // cụm xung đột: mảnh tên các dịch vụ khác cùng địa danh trên site (+ cụm ngữ nghĩa thêm tay), đếm trong bài theo vị trí
 const P=[];let them=[];for(let i=0;i<A.length;i++){if(A[i]==='--them')them=String(A[++i]).split(';').map(x=>x.trim().toLowerCase()).filter(Boolean);else P.push(A[i])}
 const cfg=J(P[0]),DK=J(P[1]),html=fs.readFileSync(P[2],'utf8');const own=K.toks(cfg.dv.toLowerCase());
 const sub=(a,b)=>{for(let i=0;i+a.length<=b.length;i++){let ok=true;for(let j=0;j<a.length;j++)if(a[j]!==b[i+j]){ok=false;break}if(ok)return true}return false};
 const manh=[];const seen=new Set();DK.forEach(d=>{const t=K.toks(String(d.dv).toLowerCase());for(let n=Math.min(4,t.length);n>=2;n--)for(let i=0;i+n<=t.length;i++){const g=t.slice(i,i+n);if(sub(g,own))continue;if(K.SW.has(g[0])||K.SW.has(g[n-1]))continue;const k=g.join(' ');if(!seen.has(k)){seen.add(k);manh.push([k,d.dv])}}});
 them.forEach(k=>{if(!seen.has(k)){seen.add(k);manh.push([k,'ngữ nghĩa'])}});
 // vị trí: chia bài theo heading; mỗi lần xuất hiện ghi mục, nằm trong link/heading/in đậm/alt/bảng
 const H=String(html);const secs=[];const hr=/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;let m,last=0,name='(sapo)';while((m=hr.exec(H))){secs.push([last,m.index,name]);name=K.txt(m[2]).slice(0,40);last=m.index}secs.push([last,H.length,name]);
 const secOf=i=>{const s=secs.find(([a,b])=>i>=a&&i<b);return s?s[2]:'?'};
 const LH=H.toLowerCase(),inside=(i,tag)=>{const o=Math.max(LH.lastIndexOf('<'+tag+' ',i),LH.lastIndexOf('<'+tag+'>',i)),c=LH.lastIndexOf('</'+tag+'>',i);return o>=0&&o>c};
 const low=H.toLowerCase().normalize('NFC'),out=[],cov=[];
 [...manh].sort((a,b)=>b[0].length-a[0].length).forEach(([k,dv])=>{const re=new RegExp('(?<![\\p{L}\\p{N}])'+k.split(' ').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+')+'(?![\\p{L}\\p{N}])','giu');let x;while((x=re.exec(low))){const i=x.index,j=i+x[0].length;if(cov.some(([a,b])=>i<b&&j>a))continue;cov.push([i,j]);const alt=/alt="[^"]*$/.test(low.slice(Math.max(0,i-200),i));const where=[inside(i,'h2')||inside(i,'h3')?'heading':null,inside(i,'a')?'LINK':null,inside(i,'strong')||inside(i,'b')?'in đậm':null,alt?'alt':null,inside(i,'table')?'bảng':null].filter(Boolean).join(',')||'thân bài';
  const txt=K.txt(H.slice(Math.max(0,i-90),i+k.length+60)).replace(/\s+/g,' ');out.push({i,k,dv,sec:secOf(i),where,tx:txt.slice(0,150)})}});out.sort((a,b)=>a.i-b.i);
 const by={};out.forEach(o=>{by[o.k]=(by[o.k]||0)+1});
 const lines=[`## Cụm xung đột trong bài: ${out.length} lần, ${Object.keys(by).length}/${manh.length} cụm có mặt`,`Dịch vụ khác cùng địa danh: ${DK.map(d=>d.dv+' ('+d.url+')').join(' · ')||'không có'}`];
 if(out.length){lines.push('| # | Cụm | Dịch vụ | Mục | Vị trí | Trích |','|---|---|---|---|---|---|',...out.map((o,i)=>`| x${i+1} | ${o.k} | ${o.dv} | ${o.sec} | ${o.where} | ${o.tx} |`))}
 fs.writeFileSync(path.join(path.dirname(P[2]),'xd.json'),JSON.stringify({manh,dem:by}));console.log(lines.join('\n'));}
else console.log('cand dt*.json | cum cfg bai.html dt*.json [--cnt cnt.json] [--xd xd.json] | ig cfg bai.html dt*_ig.json | dup cfg bai.html [--truoc bai_cu.html] | xungdot cfg dvkhac.json bai.html [--them "cụm;cụm"]');
