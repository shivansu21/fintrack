import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {createApp} from './app.js';
import {processRecurring} from './recurring.js';
import {User,Transaction,Budget,Recurring} from './models.js';
dotenv.config({path:new URL('../.env',import.meta.url)});
if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length<32 || process.env.JWT_SECRET.startsWith('replace-'))throw new Error('Run npm run setup from the project root to create a strong JWT_SECRET.');
if(!process.env.MONGODB_URI || !process.env.APP_ORIGIN)throw new Error('Set MONGODB_URI and APP_ORIGIN in server/.env');
try {await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});await Promise.all([User.init(),Transaction.init(),Budget.init(),Recurring.init()]);}
catch {console.error('MongoDB connection failed. Start MongoDB or check MONGODB_URI, credentials and Atlas network access in server/.env.');process.exit(1);}
const server=createApp().listen(Number(process.env.PORT||5000),()=>console.log('FinTrack API ready: http://localhost:'+(process.env.PORT||5000)));
let running=false;
const tick=async()=>{if(running)return;running=true;try{await processRecurring();}catch(e){console.error('Recurring processor failed:',e.message);}finally{running=false;}};
void tick();const timer=setInterval(tick,60000);timer.unref();
async function close(){clearInterval(timer);server.close(async()=>{await mongoose.disconnect();process.exit(0);});}
process.on('SIGINT',close);process.on('SIGTERM',close);
