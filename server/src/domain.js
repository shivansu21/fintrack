import { z } from 'zod';
export const categories = ['Salary','Freelance','Investment','Food','Transport','Shopping','Bills','Health','Education','Entertainment','Other'];
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v); return !Number.isNaN(+d) && d.toISOString().slice(0,10) === v && v >= '2000-01-01' && v <= '2100-12-31'; }, 'Use a valid date between 2000 and 2100');
export const moneySchema = z.coerce.number().finite().positive().max(100000000).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, 'Use at most 2 decimal places');
export const transactionSchema = z.object({type:z.enum(['income','expense']),amount:moneySchema,category:z.string().trim().min(1).max(40),description:z.string().trim().max(200).default(''),paymentMethod:z.enum(['UPI','Cash','Card','Bank transfer','Other']).default('UPI'),date:dateSchema});
export const recurringSchema = transactionSchema.omit({date:true}).extend({nextDate:dateSchema,frequency:z.enum(['monthly','weekly']),dayOfMonth:z.number().int().min(1).max(31).optional()});
export const budgetSchema = z.object({month:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),category:z.string().trim().min(1).max(40),amount:moneySchema});
export const paise = value => Math.round(value * 100);
export const rupees = value => value / 100;
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function nextDue(date,frequency,dayOfMonth) {
  const d = new Date(date+'T00:00:00Z');
  if(frequency==='weekly') d.setUTCDate(d.getUTCDate()+7);
  else { const day=dayOfMonth || d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth()+1); const last = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate(); d.setUTCDate(Math.min(day,last)); }
  return d.toISOString().slice(0,10);
}
export function csvCell(value) {
  let s=String(value??'');
  if (/^[\s]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s="'"+s;
  return '"'+s.replaceAll('"','""')+'"';
}
export function summarize(rows,month) {
  const selected=rows.filter(t=>t.date.startsWith(month));
  const sum=(list,type)=>list.filter(t=>t.type===type).reduce((n,t)=>n+t.amountPaise,0);
  const income=sum(selected,'income'),expense=sum(selected,'expense');
  const byCategory=Object.entries(selected.filter(t=>t.type==='expense').reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amountPaise;return a;},{})).map(([name,value])=>({name,value:rupees(value)})).sort((a,b)=>b.value-a.value);
  const trends=Array.from({length:6},(_,i)=>{const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()-5+i);const m=d.toISOString().slice(0,7),r=rows.filter(t=>t.date.startsWith(m));return {month:m,income:rupees(sum(r,'income')),expense:rupees(sum(r,'expense'))};});
  return {income:rupees(income),expense:rupees(expense),savings:rupees(income-expense),balance:rupees(sum(rows,'income')-sum(rows,'expense')),byCategory,trends,count:selected.length};
}
