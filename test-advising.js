const pool = require('./backend/db');
async function test() {
  const [slots] = await pool.query("SELECT * FROM advising_slots");
  const now = new Date();
  console.log("NOW:", now);
  
  const activeSlot = slots.find(s => {
    console.log("Slot start:", s.start_time, "Slot end:", s.end_time);
    console.log("now >= start", now >= new Date(s.start_time));
    console.log("now <= end", now <= new Date(s.end_time));
    return now >= new Date(s.start_time) && now <= new Date(s.end_time);
  });
  console.log("Active slot:", activeSlot);
  process.exit(0);
}
test();
