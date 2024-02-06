const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});
const projectDatabseId = process.env.NOTION_DATABASE_ID;

// Getting yesterday's Date
let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
let tomorrow = today;
tomorrow.setDate(tomorrow.getDate() + 1);
console.log(today.toISOString());
tomorrow = tomorrow.toISOString().slice(0, 10);
//today.setDate(today.getDate() - 1)
//today = today.toISOString().slice(0, 10);

//List of elements
let new_elements = [];

//Querying Database for Last day's tasks
async function queryDatabase(databaseId, project) {
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
queryDatabase(projectDatabseId, today.toString()).then(results => {
  //console.log(results);
  results.forEach(result => {
    console.log(result.properties.Tasks.title[0].plain_text);
    console.log(result.properties['Created time'].created_time);
    //new_elements.push(result.properties.Tasks.title[0].plain_text);
    task = {
      title: result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Created time'].created_time), today),
      projectId: notion_proj_id,
      //dueDate: today.toISOString().slice(0, 10),
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
console.log("Hello From Here");





//let project_url = "https://api.ticktick.com/open/v1/project"
//axios.get(project_url, {
//  headers: {
//    authorization: 'Bearer 27501286-83f9-4506-9974-7cc51065e174'
//  }
//}).then((response) => console.log(response.data)).catch((error) => console.log(error));
//
let notion_proj_id = '65be991d8f08b60d6dc77e5d'
//let task_id = '65be99474861ed257620eb06'
let auth_headers = {
  authorization: 'Bearer 27501286-83f9-4506-9974-7cc51065e174'
}
//let uri = `${project_url}/${notion_proj_id}`
//axios.get(uri, {
//  headers: {
//    authorization: 'Bearer 27501286-83f9-4506-9974-7cc51065e174'
//  }
//}).then((response) => console.log(response.data)).catch((error) => console.log(error));
//
//let body = {
//  "title": "New Task",
//  "projectId": notion_proj_id
//}

async function postTaks(task_body) {
  let res = await axios.post(`https://api.ticktick.com/open/v1/task`, task_body,
    {
      headers: auth_headers
    })
  let data = res.data;
  console.log(data);
}
time_body = {

  title: "New Test Task",
  projectId: notion_proj_id,
  startDate: "2024-02-03T13:00:00+0530",
  dueDate: "2024-02-05T13:00:00+0530"
};
//postTaks(time_body).then(response => console.log(response)).catch(error => console.log(error));


function differenceOfDays(date1, date2) {
  const oneDay = 1000 * 60 * 60 * 24;
  const difference = Math.abs(date1 - date2);
  return Math.round(difference / oneDay);
}
