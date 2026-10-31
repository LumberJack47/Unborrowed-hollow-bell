export const CATEGORIES=['Food & drink','Shopping','Transport','Bills & services','Health','Travel','Income','Other'];
export function parseCSV(text){
 text=text.replace(/^\uFEFF/,'');if(!text.trim())throw Error('This file is empty. Choose a CSV with a header row and transactions.');
 const first=text.split(/\r?\n/)[0];let delim=',';
 // Count separators outside quotes, so a quoted merchant cannot choose the delimiter.
 const counts={',':0,';':0,'\t':0};let q=false;for(let i=0;i<first.length;i++){if(first[i]==='"')q=!q;else if(!q&&first[i] in counts)counts[first[i]]++;}delim=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
 const rows=[];let row=[],cell='',quoted=false,closedQuote=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){
   if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}
   else if(c==='"'){quoted=false;closedQuote=true;}
   else cell+=c;
  }else if(c===delim){row.push(cell);cell='';closedQuote=false;}
  else if(c==='\n'||c==='\r'){
   if(c==='\r'&&text[i+1]==='\n')i++;
   row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
   row=[];cell='';closedQuote=false;
  }else if(closedQuote){
   if(c!==' '&&c!=='\t')throw Error('Unexpected text after a quoted cell. Check the source CSV.');
  }else if(c==='"'){
   if(cell.trim())throw Error('A quote is misplaced in this CSV. Check the source file.');
   quoted=true;cell='';
  }else cell+=c;
 }
 if(quoted)throw Error('A quoted cell is unfinished. Check the source file.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw Error('Add at least one transaction below the header row.');const headers=rows.shift().map(x=>x.trim());if(headers.some(x=>!x)||new Set(headers.map(h=>h.toLowerCase())).size!==headers.length)throw Error('Column names must be present and unique.');
 if(rows.some(r=>r.length!==headers.length))throw Error('Some rows have a different number of columns. Check the separators and quotes.');if(rows.length>10000)throw Error('This prototype accepts up to 10,000 transactions per run.');return {headers,rows};
}
export function guessMapping(headers){const find=(re)=>headers.findIndex(h=>re.test(h));return {date:find(/^(date|transaction.?date|posted.?date|posting.?date)$/i),merchant:find(/^(merchant|description|payee|narration|details|transaction.?description)$/i),amount:find(/^(amount|transaction.?amount|value|net.?amount)$/i),currency:find(/^(currency|ccy|currency.?code)$/i)};}
export function amountValue(raw){let s=String(raw).trim();const negative=/^\(.*\)$/.test(s);s=s.replace(/[()\s₹$£€]/g,'');if(!/^[+-]?(?:\d+(?:[,.]\d+)*|\.\d+)$/.test(s))return null;
 if(s.includes(',')&&s.includes('.')){if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'');}else if(s.includes(',')){const parts=s.split(',');if(parts.length===2&&parts[1].length===2)s=s.replace(',','.');else if(parts.slice(1).every(x=>x.length===3))s=s.replace(/,/g,'');else return null;}
 const n=Number(s);return Number.isFinite(n)?(negative?-Math.abs(n):n):null;}
export function dateValue(raw){const s=String(raw).trim();let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ].*)?$/);if(!m)return null;const [y,mo,d]=m.slice(1).map(Number);const v=new Date(Date.UTC(y,mo-1,d));return v.getUTCFullYear()===y&&v.getUTCMonth()===mo-1&&v.getUTCDate()===d?v.getTime():null;}
export const merchantKey=s=>String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function suggest(merchant,amount){const s=merchant.toLowerCase();const rules=[[/coffee|cafe|café|restaurant|pizza|swiggy|zomato|grocery|grocer|whole foods|trader joe|bakery|lunch|market|diner/,'Food & drink'],[/uber|lyft|metro|fuel|petrol|transit|rail|parking/,'Transport'],[/netflix|spotify|adobe|figma|notion|internet|electric|utility|phone|rent|openai|subscription/,'Bills & services'],[/pharmacy|hospital|doctor|dental|clinic/,'Health'],[/hotel|airline|airways|airbnb|flight/,'Travel'],[/salary|payroll|dividend|interest earned/,'Income'],[/amazon|ikea|uniqlo|store|bookshop|apple|shop/,'Shopping']];for(const [re,cat] of rules)if(re.test(s))return {category:cat,reason:'Merchant name matches a known pattern'};return {category:'Other',reason:'No reliable match — choose the best category'};}
export function buildRecords(parsed,map,fallbackCurrency='USD'){
 if(new Set([map.date,map.merchant,map.amount]).size!==3||[map.date,map.merchant,map.amount].some(x=>x<0||x>=parsed.headers.length))throw Error('Choose three different columns for date, merchant, and amount.');
 return parsed.rows.map((raw,i)=>{const merchant=raw[map.merchant].trim();if(!merchant)throw Error(`Row ${i+2} has no merchant or description.`);const amount=amountValue(raw[map.amount]);if(amount===null)throw Error(`Row ${i+2} has an unreadable amount: ${raw[map.amount]}. Use a signed amount column.`);const currency=(map.currency>=0?raw[map.currency].trim():fallbackCurrency).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error(`Row ${i+2} needs a three-letter currency code, such as USD or INR.`);const suggestion=suggest(merchant,amount);return {id:i+1,raw:[...raw],date:raw[map.date].trim(),time:dateValue(raw[map.date]),merchant,amount,currency,category:'',reviewed:false,duplicateOf:null,duplicateDecision:null,recurring:null,...{suggestion:suggestion.category,reason:suggestion.reason}};});
}
export function analyze(records){
 const exact=new Map(),groups=new Map();for(const r of records){r.duplicateOf=null;r.recurring=null;const key=[r.date,merchantKey(r.merchant),String(r.amount),r.currency].join('|');if(r.date&&exact.has(key))r.duplicateOf=exact.get(key);else if(r.date)exact.set(key,r.id);const group=[merchantKey(r.merchant),String(r.amount),r.currency].join('|');if(!groups.has(group))groups.set(group,[]);if(!r.duplicateOf&&r.time!==null)groups.get(group).push(r);}
 for(const rs of groups.values()){rs.sort((a,b)=>a.time-b.time);if(rs.length<2)continue;const gaps=rs.slice(1).map((r,i)=>(r.time-rs[i].time)/86400000);const monthly=gaps.every(d=>d>=25&&d<=35);const weekly=gaps.every(d=>d>=6&&d<=8);if(monthly||weekly)for(const r of rs)r.recurring=monthly?'Possible monthly':'Possible weekly';}return records;
}
export function applyDecision(records,id,patch){const r=records.find(r=>r.id===id);if(!r)throw Error('Transaction not found');const before={category:r.category,reviewed:r.reviewed,duplicateDecision:r.duplicateDecision};Object.assign(r,patch);return {id,before,after:{category:r.category,reviewed:r.reviewed,duplicateDecision:r.duplicateDecision}};}
export function csvCell(v){const s=String(v??'');const safe=/^[\s]*[=+@\-]/.test(s)&&!/^\s*-?\d+(?:[.,]\d+)?\s*$/.test(s)?"'"+s:s;return /[",\r\n]/.test(safe)?'"'+safe.replace(/"/g,'""')+'"':safe;}
export function makeCSV(headers,rows){return '\uFEFF'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');}
export function exportCSV(headers,records,excluded=false,prefix='tallyrift'){const extras=['id','category','reviewed','possible_duplicate_of','duplicate_decision','recurring_hint'].map(name=>`${prefix}_${name}`);const used=new Set(headers);const unique=extras.map(h=>{let k=h;while(used.has(k))k+='_' ;used.add(k);return k;});return makeCSV([...headers,...unique],records.filter(r=>excluded?r.duplicateDecision==='exclude':r.duplicateDecision!=='exclude').map(r=>[...r.raw,r.id,r.category,r.reviewed?'yes':'no',r.duplicateOf??'',r.duplicateDecision??'',r.recurring??'']));}
export const SAMPLE=`Date,Description,Amount,Currency,Reference
2026-08-01,Spotify,-10.99,USD,S001
2026-09-01,Spotify,-10.99,USD,S002
2026-10-01,Spotify,-10.99,USD,S003
2026-10-02,Blue Bottle Coffee,-6.50,USD,B101
2026-10-02,Blue Bottle Coffee,-6.50,USD,B102
2026-10-03,Whole Foods Market,-64.28,USD,W100
2026-10-04,Uber,-18.40,USD,U100
2026-08-05,Adobe Creative Cloud,-22.99,USD,A001
2026-09-05,Adobe Creative Cloud,-22.99,USD,A002
2026-10-05,Adobe Creative Cloud,-22.99,USD,A003
2026-10-06,Local Bookshop,-28.00,USD,L100
2026-10-07,Metro Transit,-12.00,USD,M100
2026-10-08,Corner Pizza,-24.50,USD,P100
2026-10-09,City Pharmacy,-16.75,USD,C100
2026-10-10,Uniqlo,-49.90,USD,Q100
2026-10-11,Internet Service,-65.00,USD,I100
2026-10-12,Salary Payroll,3200.00,USD,S100
2026-10-13,Unknown Merchant 4821,-37.20,USD,X100
2026-10-14,IKEA,-84.00,USD,K100
2026-10-14,IKEA,-84.00,USD,K101
2026-10-15,Hotel Juniper,-142.00,USD,H100
2026-10-16,Neighbourhood Bakery,-8.25,USD,N100
2026-10-17,Electric Utility,-71.30,USD,E100
2026-10-18,Lyft,-14.60,USD,Y100`;
