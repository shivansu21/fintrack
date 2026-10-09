import test from 'node:test';
import assert from 'node:assert/strict';
import {paise,nextDue,csvCell,summarize,transactionSchema} from '../src/domain.js';
test('money is exact in integer paise and rejects fractional paise',()=>{assert.equal(paise(0.1)+paise(0.2),30);assert.equal(transactionSchema.safeParse({type:'expense',amount:1.005,category:'Food',date:'2026-01-01'}).success,false)});
test('invalid calendar dates rejected',()=>{assert.equal(transactionSchema.safeParse({type:'expense',amount:100,category:'Food',date:'2026-02-30'}).success,false)});
test('month-end recurrence preserves anchor including leap years',()=>{assert.equal(nextDue('2026-01-31','monthly',31),'2026-02-28');assert.equal(nextDue('2026-02-28','monthly',31),'2026-03-31');assert.equal(nextDue('2028-01-31','monthly',31),'2028-02-29');assert.equal(nextDue('2026-12-28','weekly'),'2027-01-04')});
test('CSV quotes text and neutralizes formula prefixes',()=>{assert.equal(csvCell('hello,"world"'),'"hello,""world"""');assert.equal(csvCell(' =HYPERLINK("x")'),'"\' =HYPERLINK(""x"")"')});
test('monthly totals and six-month trend differ from all-time balance',()=>{const s=summarize([{type:'income',amountPaise:10000,date:'2026-01-01',category:'Salary'},{type:'expense',amountPaise:2510,date:'2026-02-01',category:'Food'}],'2026-02');assert.equal(s.balance,74.9);assert.equal(s.expense,25.1);assert.equal(s.savings,-25.1);assert.equal(s.trends.length,6);assert.equal(s.trends[4].income,100)});
