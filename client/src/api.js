export async function api(path,options={}) {
 const response=await fetch('/api'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-FinTrack':'1',...options.headers}});
 const data=await response.json().catch(()=>({message:'Unexpected server response. Is the API running?'}));
 if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('session-expired'));throw new Error(data.message||'Request failed');}return data;
}
export const send=(method,data)=>({method,body:JSON.stringify(data)});
export const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n||0);
export const localToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
