const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
let morgenAPIId = process.env.MORGEN_API_ID;
let accountId = process.env.ACCOUNT_ID;
let calendarId = process.env.CALENDAR_ID;

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const projectDatabseId = process.env.NOTION_DATABASE_ID;
let notion_proj_id = process.env.TICK_TICK_PROJECT_ID

let auth_headers = {
  authorization: process.env.TICK_TICK_AUTH_CODE
}
// Getting today's and tomorrow's date
let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
let tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
console.log("Todays's date is : ", today.toISOString());
tomorrow = tomorrow.toISOString().slice(0, 10);


/**
* @function
* @param {number} databaseId - Id of the database you want to query from notion
* Filters the result based on if they are in progress and if the TickTick Id is YES 
* @returns a promise
*/

async function queryDatabase(databaseId) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      "filter":
      {
        and: [
          {
            select: { equals: "Yes" },
            property: "TickTick",
            type: "select"
          },
          {
            status: { equals: "In progress" },
            property: "Status",
            type: "status"
          }]
      }
    });
    return response.results;
  } catch (error) {
    console.log(error.body);
  }
}

queryDatabase(projectDatabseId).then(results => {
  results.forEach(result => {
    console.log(result.properties['Morgen Reminder']?.select?.name || "Nothing");
    console.log("Name of the Task ", result.properties.Tasks.title[0].plain_text);
    console.log("Day this task was created ", result.properties['Created time'].created_time);
    console.log("Day this task was started ", result.properties['Start Date'].date?.start);
    let task = {
      title: result.properties['Start Date'].date?.start ? result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Start Date'].date?.start), today)
        : result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Created time'].created_time), today),
      projectId: notion_proj_id,
      dueDate: result.properties['Due Date'].date?.start ? `${result.properties['Due Date'].date?.start}T00:01:00+0530` :
        `${today.toISOString().slice(0, 10)}T23:59:59+0530`,
    };
    console.log(task);
    postTask(task);
    if (result.properties['Morgen Reminder'].select?.name) {
      let taskTitle = task.title;
      let taskTime = result.properties['Morgen Reminder']?.select?.name
      let event = createEvent(taskTitle, taskTime);
      postEvent(event);
    }
  })
}).catch(error => console.log(error));

/**
* @function
* @param {object} task 
* @returns void promise
*/

async function postTask(task) {
  let resp = await axios.post(`https://api.ticktick.com/open/v1/task`, task, {
    headers: auth_headers
  })
  console.log(resp.data);
}

/**
  * @param date1 date2
  * Uses the dates to calculate difference between them
  * @returns number - difference of the toDateString()
  */

function differenceOfDays(date1, date2) {
  date2.setTime(date2.getTime() + (330 * 60 * 1000));
  console.log("Date 2 is: ", date2.toISOString());
  const oneDay = 1000 * 60 * 60 * 24;
  const difference = Math.abs(date1 - date2);
  return Math.ceil(difference / oneDay);
}



(async function getId() {
  let resp = await axios.get("https://api.morgen.so/v3/calendars/list",
    {
      headers: {
        "accept": "application/json",
        "Authorization": `ApiKey ${morgenAPIId}`,
      }
    })

  console.log(resp.data.data);
})


function createEvent(taskTitle, taskTime) {
  return {
    accountId: accountId,
    calendarId: calendarId,
    title: taskTitle,
    start: `${today.toISOString().slice(0, 10)}T${taskTime}:00`,
    duration: "PT120M",
    timeZone: "Asia/Kolkata",
    showWithoutTime: false,
    privacy: "public",
    freeBusyStatus: "busy",
    "morgen.so:metadata": {
      categoryId: '63d75800-958b-4dce-a5f9-21a69bd24357@morgen.so',
      categoryName: 'Study',
      categoryColor: '#efb983',
    }
  };
}
async function postEvent(event) {
  let resp = await axios.post("https://api.morgen.so/v3/events/create", event,
    {
      headers: {
        "accept": "application/json",
        "Authorization": `ApiKey ${morgenAPIId}`,
      }
    })

  console.log(resp.data.data);
}

//(async function getEvents() {
//  let resp = await axios.get(`https://api.morgen.so/v3/events/list?accountId=${accountId}&calendarIds=${calendarId}&start=2024-02-20T00:00:00Z&end=2024-02-21T00:00:00Z`,
//    {
//      headers: {
//        "accept": "application/json",
//        "Authorization": `ApiKey ${morgenAPIId}`,
//      }
//    })
//  console.log(resp.data.data.events[5]);
//})();


