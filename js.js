const fs = require('fs');

// Завантажуємо JSON
const raw = fs.readFileSync('./jira-data.json', 'utf8');
const data = JSON.parse(raw);

// Ваш accountId
const myAccountId = "";

let totalSpentSeconds    = 0;
let totalEstimateSeconds = 0;

console.log('🧾 Tasks you worked on:\n');

// Сортуємо за датою створення (з найстаріших до нових)
data.issues.sort((a, b) => new Date(a.fields.created) - new Date(b.fields.created));

data.issues.forEach(issue => {
  const key             = issue.key;
  const summary         = issue.fields.summary;
  const timespent       = issue.fields.timespent || 0;
  const estimateSec     = issue.fields.timeoriginalestimate || 0;
  const changelog       = issue.changelog?.histories || [];

  let startedAt = null;
  let endedAt   = null;

  // Знаходимо дати переходів To Do→In Progress і →Done
  changelog.forEach(change => {
    if (change.author.accountId !== myAccountId) return;
    change.items.forEach(item => {
      if (item.field === 'status') {
        if (item.fromString === 'Tо Do' && item.toString === 'In Progress') {
          startedAt = change.created;
        }
        if (item.toString === 'Done') {
          endedAt = change.created;
        }
      }
    });
  });

  // Фільтр по витраченому часу і assignee
  if (timespent && issue.fields.assignee?.accountId === myAccountId) {
    totalSpentSeconds    += timespent;
    totalEstimateSeconds += estimateSec;

    const hours       = (timespent   / 3600).toFixed(2);
    const estimateH   = estimateSec ? (estimateSec / 3600).toFixed(2) : '—';
    const ratioPercent= estimateSec 
      ? Math.round((timespent / estimateSec) * 100) + '%' 
      : '—';

    // Розрахунок кількості днів
    let daysTaken = '—';
    if (startedAt && endedAt) {
      const msDiff   = new Date(endedAt) - new Date(startedAt);
      daysTaken = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    }

    console.log(`• [${key}] ${summary}`);
    console.log(`   ⏱️ Time Spent:    ${hours} h`);
    console.log(`   ⚙️ Estimate:       ${estimateH} h`);
    console.log(`   🔀 Spent/Estimate: ${ratioPercent}`);
    console.log(`   🚀 Started:       ${startedAt ? new Date(startedAt).toLocaleString() : '—'}`);
    console.log(`   ✅ Finished:      ${endedAt   ? new Date(endedAt).toLocaleString()   : '—'}`);
    console.log(`   ⏳ Duration:      ${daysTaken} day${daysTaken === 1 ? '' : 's'}\n`);
  }
});

// Підсумки
const totalSpentH    = (totalSpentSeconds    / 3600).toFixed(2);
const totalEstimateH = (totalEstimateSeconds / 3600).toFixed(2);

console.log('=======================');
console.log(`🕒 Total time spent:    ${totalSpentH} hours`);
console.log(`⚙️ Total estimated time: ${totalEstimateH} hours`);
