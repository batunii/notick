const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const projectDatabseId = process.env.NOTION_DATABASE_ID;

// Getting today's and tomorrow's date
let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
let tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
console.log("Todays's date is : ", today.toISOString());
tomorrow = tomorrow.toISOString().slice(0, 10);

//List of elements
let new_elements = [];


/**
 * @function
 * @param {1} databaseId - Id of the database you want to query from notion
 * @returns a promise
 */

//Querying Database for Tasks that are in progress and have Yes for TickTick propertry
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
    console.log("Name of the Task ", result.properties.Tasks.title[0].plain_text);
    console.log("Day this task was created ", result.properties['Created time'].created_time);
    task = {
      title: result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Created time'].created_time), today),
      projectId: notion_proj_id,
      dueDate: result.properties['Due Date'].date?.start ? `${result.properties['Due Date'].date?.start}T00:01:00+0530` :
        `${today.toISOString().slice(0, 10)}T23:59:59+0530`
    }
    new_elements.push(task);
    console.log(task);
  }
  )
}).then(() => {
  new_elements.forEach(
    element => {
      postTaks(element);
    }
  )
});

let notion_proj_id = process.env.TICK_TICK_PROJECT_ID

let auth_headers = {
  authorization: process.env.TICK_TICK_AUTH_CODE
}

/**
 * @param a task task body for TickTick
 * @returns a promise 
 */

async function postTaks(task_body) {
  let res = await axios.post(`https://api.ticktick.com/open/v1/task`, task_body,
    {
      headers: auth_headers
    })
  let data = res.data;
  console.log(data);
}

/**
  * @param date1 date2
  * Uses the dates to calculate difference between them
  * @returns number - difference of the toDateString()
  */

function differenceOfDays(date1, date2) {
  const oneDay = 1000 * 60 * 60 * 24;
  const difference = Math.abs(date1 - date2);
  return Math.round(difference / oneDay);
}
