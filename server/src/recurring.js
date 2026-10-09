import {Recurring,Transaction} from './models.js';
import { nextDue,today } from './domain.js';
// Atomic upsert + unique occurrence key prevent duplicate charges on retries.
export async function processRecurring(userId) {
  const query={nextDate:{$lte:today()}}; if(userId)query.userId=userId;
  const rules=await Recurring.find(query);
  for(const rule of rules) {
    let due=rule.nextDate,count=0;
    while(due<=today() && count++<400) {
      const recurrenceKey=rule._id+':'+due;
      const {userId,type,amountPaise,category,description,paymentMethod}=rule;
      try { await Transaction.updateOne({userId,recurrenceKey},{$setOnInsert:{userId,type,amountPaise,category,description,paymentMethod,date:due,recurrenceKey}},{upsert:true}); }
      catch(error){if(error.code!==11000)throw error;}
      const next=nextDue(due,rule.frequency,rule.dayOfMonth);
      await Recurring.updateOne({_id:rule._id,nextDate:due},{$set:{nextDate:next}});
      due=next;
    }
  }
}
