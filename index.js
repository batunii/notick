const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();


exports.handler = async (event) => {

  // Initializing a client
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
  const projectDatabseId = process.env.NOTION_DATABASE_ID;
  const notion_proj_id = process.env.TICK_TICK_PROJECT_ID;
  const morgenAPIId = process.env.MORGEN_API_ID;
  const accountId = process.env.ACCOUNT_ID;
  const calendarId = process.env.CALENDAR_ID;


  const auth_headers = {
    authorization: process.env.TICK_TICK_AUTH_CODE
  };
  let tasks = [];
  let events = [];

  // Getting today's and tomorrow's date
  let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  console.log("Todays's date is : ", today.toISOString());
  tomorrow = tomorrow.toISOString().slice(0, 10);


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

  await queryDatabase(projectDatabseId).then(results => {
    results.forEach(result => {
      console.log("Name of the Task ", result.properties.Tasks.title[0].plain_text);
      console.log("Day this task was created ", result.properties['Created time'].created_time);
      console.log("Start Date of the task is: ", result.properties['Start Date'].date?.start);
      let task = {
        title: result.properties['Start Date'].date?.start ? result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Start Date'].date.start), today)
          : result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Created time'].created_time), today),
        projectId: notion_proj_id,
        dueDate: result.properties['Due Date'].date?.start ? `${result.properties['Due Date'].date?.start}T00:01:00+0530` :
          `${today.toISOString().slice(0, 10)}T23:59:59+0530`,
      };
      console.log(task);
      tasks.push(task);
      if (result.properties['Morgen Reminder'].select?.name) {
        events.push({
          accountId: accountId,
          calendarId: calendarId,
          title: task.title,
          start: `${today.toISOString().slice(0, 10)}T${result.properties['Morgen Reminder'].select?.name}:00`,
          duration: "PT120M",
          timeZone: "Asia/Kolkata",
          showWithoutTime: false,
          privacy: "public",
          freeBusyStatus: "busy"
        });

      }
    }
    )
  }).catch(error => console.log(error));

  async function postTask(task) {
    let resp = await axios.post(`https://api.ticktick.com/open/v1/task`, task, {
      headers: auth_headers
    })
    console.log(resp.data);

  };
  async function postEvent(event) {
    let resp = await axios.post("https://api.morgen.so/v3/events/create", event,
      {
        headers: {
          "accept": "application/json",
          "Authorization": `ApiKey ${morgenAPIId}`,
        }
      })

    console.log(resp.data);
  }

  for (let i = 0; i < tasks.length; i++) {
    await postTask(tasks[i]);
    console.log("Post done for ", tasks[i].title)
  }
  for (let i = 0; i < events.length; i++) {
    await postEvent(events[i]);
    console.log("Event done for ", events[i].title)
  }
  /**
    * @param date1 date2
    * Uses the dates to calculate difference between them
    * @returns number - difference of the toDateString()
    */

  function differenceOfDays(date1, date2) {
    date2.setTime(date2.getTime() + (330 * 60 * 1000));
    console.log("Date 1 is: ", date1.toISOString());
    console.log("Date 2 is: ", date2.toISOString());
    const oneDay = 1000 * 60 * 60 * 24;
    const difference = Math.abs(date1 - date2);
    return Math.ceil(difference / oneDay);
  }
}
