#!/usr/bin/env node
// co-ban.js: CLI bộ đo cơ bản. chon | kwphu | plan | meta
// Dữ liệu trang lấy từ KDO.page() (trình duyệt) hoặc lệnh "do" (file HTML).
const fs=require('fs'),path=require('path'),K=require(path.join(__dirname,'..','trinh-duyet','do-co-ban.js'));
const J=f=>JSON.parse(fs.readFileSync(f,'utf8')),A=process.argv.slice(2),cmd=A.shift();
const nm=f=>path.basename(f).replace(/\.json$/,'');
const slug=s=>String(s||'').toLowerCase().normalize('NFC').replace(/đ/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const hasSeq=(t,p)=>(' '+t+' ').includes(' '+p+' ');
const r1=v=>Math.round(v*10)/10;
const KEYS=[['w','Độ dài (âm tiết)',0],['svc','Dịch vụ (lần)',1],['loc','Địa danh (lần)',1],['h2n','Số H2',0],['h3n','Số H3',0],['h3per','H3 trên mỗi H2',0],['h2sv','H2 chứa dịch vụ %',1],['h2dd','H2 chứa địa danh %',1],['h3sv','H3 chứa dịch vụ %',1],['h3dd','H3 chứa địa danh %',1],['prox','Dịch vụ sát địa danh %',1],['phone','Số điện thoại (lần)',1],['brand','Thương hiệu (lần)',1],['img','Ảnh',1],['bold','In đậm',1],['tab','Bảng',1],['lin','Link nội bộ',1],['tel','Link tel:',1],['faq','Câu hỏi FAQ',1],['psv','Đoạn có dịch vụ %',1],['plc','Đoạn có địa danh %',1]];
// từ khoá chính đo theo vai trò: biến thể đối thủ dùng làm từ khoá chính được quy đổi thành từ khoá chính của mình (và ngược lại)
const KMAIN=[['Từ khoá chính (lần)',0,1],['Mật độ từ khoá chính %',3,1],['Khoảng trống từ khoá chính lớn nhất %',4,-1],['H2 chứa từ khoá chính %',5,1],['H3 chứa từ khoá chính %',6,1],['Heading đầu tiên có từ khoá chính (thứ tự)',7,-2],['Alt chứa từ khoá chính %',8,1]];
// biến thể đối thủ dùng làm từ khoá chính: có trong H1 (ưu tiên dạng có "tại"), không có thì xét Title, cuối cùng là biến thể xuất hiện nhiều nhất
function chinh(d,kws){const has=(t,k)=>(' '+String(t||'').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu,' ')+' ').includes(' '+k+' ');const kw=d.kw||{};
 for(const src of [d.meta&&d.meta.h1,d.meta&&d.meta.title]){const f=kws.filter(k=>has(src,k));if(f.length)return f.includes(kws[0])?kws[0]:f.sort((a,b)=>((kw[b]||[0])[0])-((kw[a]||[0])[0]))[0]}
 return [...kws].sort((a,b)=>((kw[b]||[0])[0])-((kw[a]||[0])[0]))[0]}
// "Từ khoá" = từ khoá chính + phụ (cùng intent: [dịch vụ] (tại) (huyện/quận) [địa danh]). Bảng từng biến thể chỉ để tham khảo, không chấm.
// mục tiêu theo cách skill IG: tăng = từ (min+max)/2 tới điểm giữa của mức đó và max; giảm = ≤ mức giữa; dải = trong dải đối thủ ±10%
function judge(v,x,dir){const mx=Math.max(...v),mn=Math.min(...v),mid=(mx+mn)/2;
 if(dir===0)return [`${r1(mn)}–${r1(mx)}`,x<mn*0.9?'Thiếu':x>mx*1.1?'Thừa':'Đạt'];
 if(dir===-1)return [`≤ ${r1(mid)}`,x<=mid*1.05?'Đạt':'Thiếu'];
 if(dir===-2){const pos=v.filter(n=>n>0);if(!pos.length)return ['—','Đạt'];const t=Math.max(...pos);return [`1–${t}`,x>0&&x<=t?'Đạt':x===0?'Thiếu':'Thừa']}
 const lo=mid,hi=(mid+mx)/2;return [`${r1(lo)}–${r1(hi)}`,x<lo*0.95?'Thiếu':x>mx*1.15?'Thừa':'Đạt']}

if(cmd==='do'){const cfg=J(A[0]);const o=K.measure(fs.readFileSync(A[1],'utf8'),cfg);console.log(JSON.stringify({m:o.r.m,hm:o.r.hm,kw:o.r.kw,meta:{url:A[2]||'',title:'',desc:'',h1:''},nums:[...new Set(K.num(o.L).match(/\d+/g)||[])]}));}

else if(cmd==='chon'){ // chọn đối thủ từ kết quả Google: đúng dịch vụ VÀ đúng địa danh, bỏ domain của mình và trang không phải bài dịch vụ
 const cfg=J(A[0]),sp=J(A[1]),max=+(cfg.so_doi_thu||3);
 const BAN=/(^|\.)(google\.|youtube\.com|facebook\.com|fb\.com|tiktok\.com|zalo\.me|instagram\.com|twitter\.com|x\.com|linkedin\.com|pinterest\.|wikipedia\.org|shopee\.|lazada\.|tiki\.vn|chotot\.com|muaban\.net|batdongsan\.com\.vn|trangvangvietnam\.com|yellowpages|masothue\.com|hosocongty|thuvienphapluat\.vn|reddit\.com|quora\.com|voz\.vn|webtretho\.com)/;
 const own=new Set([].concat(cfg.host||[]).map(h=>h.replace(/^www\./,'')));const dv=slug(cfg.dv),dd=slug(cfg.dd),chon=[],bo=[];
 const LOAI=/(quan|huyen|thi xa|thanh pho|tp)$/;let loai={};
 (sp.kq||[]).forEach(([pos,u,t])=>{let U;try{U=new URL(u)}catch(e){bo.push([pos,u,'URL lỗi']);return}const h=U.host.replace(/^www\./,''),ps=slug(decodeURIComponent(U.pathname)),ts=slug(t);
  const m=(' '+ts+' '+ps+' ').match(new RegExp('(quan|huyen|thi xa|thanh pho|tp) '+dd.replace(/ /g,' ')+' '));if(m)loai[m[1]]=(loai[m[1]]||0)+1;
  if(own.has(h))return bo.push([pos,h,'site của mình']);
  if(BAN.test(h)||/\.pdf$/i.test(U.pathname))return bo.push([pos,h,'không phải bài dịch vụ']);
  if(U.pathname==='/'||U.pathname==='')return bo.push([pos,h,'trang chủ']);
  const sv=hasSeq(ts,dv)||hasSeq(ps,dv),sd=hasSeq(ts,dd)||hasSeq(ps,dd);
  if(!sv)return bo.push([pos,h,'sai dịch vụ']);if(!sd)return bo.push([pos,h,'sai địa danh']);
  if(chon.length>=max)return bo.push([pos,h,'đã đủ']);chon.push([pos,u,t])});
 const lg=Object.entries(loai).sort((a,b)=>b[1]-a[1])[0];
 console.log(JSON.stringify({q:sp.q,captcha:!!sp.captcha,chon,bo,loai_doan:lg?{quan:'quận',huyen:'huyện','thi xa':'thị xã','thanh pho':'thành phố',tp:'thành phố'}[lg[0]]:null}));}

else if(cmd==='kwphu'){ // từ khoá chính + phụ: luôn chứa đồng thời dịch vụ + địa danh
 const cfg=J(A[0]),dv=cfg.dv.toLowerCase(),dd=cfg.dd.toLowerCase(),lo=(cfg.loai||'').toLowerCase().trim();
 const L=[`${dv} tại ${dd}`,`${dv} ${dd}`];if(lo)L.push(`${dv} tại ${lo} ${dd}`,`${dv} ${lo} ${dd}`);console.log(JSON.stringify(L));}

else if(cmd==='plan'){ // bảng chỉ số + từ khoá + bản đồ heading. In chỉ dòng cần sửa.
 const cfg=J(A[0]),B=J(A[1]),D=A.slice(2).map(f=>[nm(f),J(f)]),o=[],st={Thiếu:0,Đạt:0,Thừa:0},ok=[];
 o.push(`## Chỉ số (${D.length} đối thủ) — chỉ in dòng Thiếu/Thừa`,`| Chỉ số | ${D.map(d=>d[0]).join(' | ')} | Mục tiêu | Bài | KQ |`,'|---|'+D.map(()=>'---|').join('')+'---|---|---|');
 KEYS.forEach(([k,lab,dir])=>{const v=D.map(d=>d[1].m[k]??0),x=B.m[k]??0,[tg,kq]=judge(v,x,dir);st[kq]++;if(kq==='Đạt')ok.push(lab);else o.push(`| ${lab} | ${v.join(' | ')} | ${tg} | ${x} | ${kq} |`)});
 o.push(`Đạt ${st.Đạt}/${KEYS.length}: ${ok.join(', ')}`);
 const kws=Object.keys(B.kw||{}),V1=kws[0];
 if(V1){const map=D.map(([n,d])=>{const P=chinh(d,kws);return [n,d,k=>k===V1?P:k===P?V1:k,P]});
  const qd=map.filter(x=>x[3]!==V1);if(qd.length)o.push('',...qd.map(([n,,,P])=>`Quy đổi: ${n} dùng "${P}" làm từ khoá chính → so với "${V1}" của bài; "${V1}" của ${n} so với "${P}" của bài.`));
  const g=(d,k,i)=>((d.kw||{})[k]||[0,0,0,0,0,0,0,0,0])[i];
  o.push('',`## Từ khoá chính "${V1}" (đã quy đổi theo vai trò)`,`| Chỉ số | ${D.map(d=>d[0]).join(' | ')} | Mục tiêu | Bài | KQ |`,'|---|'+D.map(()=>'---|').join('')+'---|---|---|');
  KMAIN.forEach(([lab,i,dir])=>{const v=map.map(([,d,f])=>g(d,f(V1),i)),x=g(B,V1,i),[tg,kq]=judge(v,x,dir);st[kq]++;o.push(`| ${lab} | ${v.join(' | ')} | ${tg} | ${x} | ${kq} |`)});
  if(kws.length>1){o.push('','## Từ khoá phụ (đã quy đổi theo vai trò)',`| Từ khoá | Vị trí | ${D.map(d=>d[0]).join(' | ')} | Mục tiêu | Bài | KQ |`,'|---|---|'+D.map(()=>'---|').join('')+'---|---|---|');
   kws.slice(1).forEach(k=>['thân bài','H2','H3'].forEach((p,i)=>{const v=map.map(([,d,f])=>g(d,f(k),i)),x=g(B,k,i);if(Math.max(...v)===0&&x===0)return;const[tg,kq]=judge(v,x,1);o.push(`| ${k} | ${p} | ${v.join(' | ')} | ${tg} | ${x} | ${kq} |`)}))}}
 const hl=(n,d)=>[`- **${n}** ${d.meta?d.meta.url:''}`+(d.meta?` · H1: ${d.meta.h1}`:''),...(d.hm||[]).map(h=>`  ${h[0]===3?'  ':''}H${h[0]} [${h[2]||'-'}] ${h[1]}`)];
 o.push('','## Bản đồ heading (E exact · V biến thể · S dịch vụ · D địa danh)');D.forEach(([n,d])=>o.push(...hl(n,d)));o.push(...hl('Bài',B));
 const dv=slug(cfg.dv),dd=slug(cfg.dd),wr=D.filter(([,d])=>d.meta&&!(hasSeq(slug(d.meta.h1+' '+d.meta.title),dv)&&hasSeq(slug(d.meta.h1+' '+d.meta.title),dd))).map(([n])=>n);
 if(wr.length)o.push('',`⚠ Đối thủ có H1/Title thiếu dịch vụ hoặc địa danh: ${wr.join(', ')}. Kiểm tra lại, có thể chọn nhầm bài.`);
 const sel=D.filter(([,d])=>d.meta&&(d.meta.sel==='body'||d.m.w<800)).map(([n])=>n);if(sel.length)o.push(`⚠ Có thể lấy nhầm vùng nội dung: ${sel.join(', ')}. Đo lại với sel.`);
 console.log(o.join('\n'));}
else if(cmd==='meta'){ // kiểm Title/H1/Meta: P[1] là JSON bài của mình (có nums): ý đối thủ, giá trị thật, không trùng đối thủ, không trùng khuôn trang cùng dịch vụ trên site
 const P=[];let site=[];for(let i=0;i<A.length;i++){if(A[i]==='--site'){const x=J(A[++i]);site=Array.isArray(x)?x:(x.site||[])}else P.push(A[i])}
 const cfg=J(P[0]),body=(J(P[1]).nums||[]).join(' '),[t,h,d]=P.slice(2,5).map(x=>String(x).normalize('NFC')),dts=P.slice(5).map(J);
 const V1=new RegExp(cfg.dv+'\\s+tại\\s+(?:quận\\s+|huyện\\s+)?'+cfg.dd,'giu'),VA=new RegExp(cfg.dv+'\\s+tại\\s','giu'),c=s=>(String(s).match(V1)||[]).length,ca=s=>(String(s).match(VA)||[]).length,res=[];
 const add=(ma,ok,info,bb=true)=>res.push([ma,ok,info,bb]),ld=d.toLowerCase();
 const STOP=new Set(K.toks((cfg.dv+' tại quận huyện '+cfg.dd).toLowerCase()));
 const tw=s=>K.toks(String(s||'').toLowerCase().normalize('NFC').replace(V1,' ')).filter(w=>!STOP.has(w));
 const run=(a,b)=>{let best=0;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){let k=0;while(a[i+k]&&a[i+k]===b[j+k])k++;best=Math.max(best,k)}return best};
 const hit=(x,list,lim)=>list.map(([n,y])=>[n,run(tw(x),tw(y)),y]).filter(z=>z[1]>=lim).map(([n,r,y])=>`${n}: ${r} từ ("${String(y).slice(0,60)}")`);
 add('Title',new RegExp('^'+cfg.dv+'\\s+tại\\s+(?:quận\\s+)?'+cfg.dd,'iu').test(t)&&t.length>=55&&t.length<=66,`${t.length} ký tự, bắt đầu bằng V1, 55–66`);
 add('Title-số',/\d/.test(t),'Title có ≥1 con số thật',false);
 add('H1',c(h)>=1&&h.length<75,`${h.length} ký tự, chứa V1, <75`);
 const m=V1.exec(d);V1.lastIndex=0;add('Meta',!!m&&m.index+m[0].length<=50&&d.length>=120&&d.length<=160,`${d.length} ký tự (120–160), V1 kết thúc ở ${m?m.index+m[0].length:'—'} (≤50)`);
 add('Meta-dài',d.length>=150,`${d.length} (nên 150–160)`,false);
 const hl=new RegExp(cfg.hotline.replace(/\./g,'[.\\s]?')+'[.!]?\\s*$');add('CTA',ld.includes((cfg.brand[0]||'').toLowerCase())&&hl.test(d),'Meta kết bằng CTA thương hiệu + hotline');
 add('V1-lặp',c(t)===1&&c(h)===1&&c(d)<=1,`V1: Title ${c(t)}, H1 ${c(h)}, Meta ${c(d)}`);
 add('Q1-T2',ca(t)===c(t)&&ca(h)===c(h)&&ca(d)===c(d),'Không chứa từ khoá "[dịch vụ] tại [nơi khác]" của trang khác');
 const v5=(t+' '+h+' '+d).toLowerCase().match(/số\s*(?:1|một)(?![\d\p{L}])|duy nhất|tuyệt đối|100\s*%|(?:tốt|rẻ|nhanh|uy tín|lớn|chuyên nghiệp)\s+nhất/gu);add('Hứa-tuyệt-đối',!v5,v5?v5.join(', '):'không');
 const bn=new Set(body.match(/\d+/g)||[]),miss=[...new Set((K.num(t+' '+h+' '+d).match(/\d+/g)||[]))].filter(x=>!bn.has(x));add('Số-khớp-thân-bài',!miss.length,miss.length?'thiếu: '+miss.join(', '):'đủ');
 const yr=/20\d\d/.test(t+h+d),ydt=dts.filter(x=>/20\d\d/.test((x.meta.title||'')+(x.meta.h1||''))).length;add('Năm',!yr||ydt>=2,yr?`có năm; ${ydt} đối thủ có năm (cần ≥2)`:'không ghi năm');
 const DT=dts.map((x,i)=>['dt'+(i+1),x.meta.title]),DD=dts.map((x,i)=>['dt'+(i+1),x.meta.desc]).filter(z=>z[1]),ST=site.map(x=>[x.url.replace(/^https?:\/\/[^/]+/,''),x.title]),SH=site.map(x=>[x.url.replace(/^https?:\/\/[^/]+/,''),x.h1]),SD=site.map(x=>[x.url.replace(/^https?:\/\/[^/]+/,''),x.desc]).filter(z=>z[1]);
 let b=hit(t,DT,4).concat(hit(h,DT,5));add('Khác-đối-thủ',!b.length,b.join('; ')||'Title/H1 không chung ≥4/5 từ liền nhau với title đối thủ');
 b=hit(d,DD,6);add('Meta-khác-đối-thủ',!b.length,b.join('; ')||'Meta không chung ≥6 từ liền nhau với meta đối thủ');
 add('Có-dữ-liệu-site',site.length>0,site.length?`${site.length} trang cùng dịch vụ trên site để so khuôn`:'chưa có site.json: chạy KMT.site ở Bước 1');
 b=hit(t,ST,4);add('Khuôn-title',!b.length,b.slice(0,3).join('; ')||'không chung ≥4 từ liền nhau (ngoài từ khoá) với title trang cùng dịch vụ trên site');
 b=hit(h,SH,5);add('Khuôn-H1',!b.length,b.slice(0,3).join('; ')||'không chung ≥5 từ liền nhau với H1 trang cùng dịch vụ trên site',false);
 b=hit(d,SD,8);add('Khuôn-meta',!b.length,b.slice(0,3).join('; ')||'không chung ≥8 từ liền nhau với meta trang cùng dịch vụ trên site');
 const sf=s=>(s.match(/\[[^\]]*\]|【[^】]*】/)||[''])[0];add('Hậu-tố',/\d/.test(sf(t)+sf(h))&&sf(t)!==sf(h),`Title ${sf(t)||'—'} / H1 ${sf(h)||'—'} (có số, không trùng)`,false);
 console.log('Focus keyword: '+cfg.dv.toLowerCase()+' tại '+cfg.dd.toLowerCase());
 const fail=res.filter(r=>r[3]&&!r[1]).map(r=>r[0]);console.log(`Cổng: ${fail.length?'ĐÓNG ('+fail.join(', ')+')':'MỞ'}`);res.forEach(r=>console.log(`${r[1]?'ĐẠT':'CHƯA'}${r[3]?'':' (nên)'} ${r[0]}: ${r[2]}`));process.exit(fail.length?1:0);}
else console.log('do cfg bai.html | chon cfg serp.json | kwphu cfg | plan cfg bai.json dt*.json | meta cfg bai.json title h1 desc dt*.json [--site site.json]');
