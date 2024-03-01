const { Client } = require("@notionhq/client");
const {TodoistApi} = require("@doist/todoist-api-typescript")
const dotenv = require("dotenv");
dotenv.config();


exports.handler = async (event) => {

  // Initializing a client
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
  const projectDatabseId = process.env.NOTION_DATABASE_ID;
  const todoistApi = new TodoistApi(process.env.TODOIST_ID)

  let tasks = [];
  let results = [];

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
              property: "Todoist",
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
      result.properties.Area.multi_select.forEach(area=>console.log(area.name));
      console.log(result.properties['Duration'].number);
      console.log(result.properties['Reminder Time']?.select?.name || "Nothing");
      console.log("Name of the Task ", result.properties.Tasks.title[0].plain_text);
      console.log("Day this task was created ", result.properties['Created time'].created_time);
      console.log("Start Date of the task is: ", result.properties['Start Date'].date?.start);
      let labels = [];
      result.properties.Area.multi_select.forEach(area=>labels.push(area.name));
      tasks.push({
      content :  result.properties['Due Date'].date?.start?
      result.properties.Tasks.title[0].plain_text + " "+ differenceOfDays(new Date(result.properties['Due Date'].date?.start), today) + " days left"
      :result.properties['Start Date'].date?.start?
      result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Start Date'].date?.start), today)
      :result.properties.Tasks.title[0].plain_text + " Day " + differenceOfDays(new Date(result.properties['Created time'].created_time), today),
      projectId: process.env.TODOIST_KRIMIZ_ID,
        dueString: result.properties['Reminder Time'].select?.name?`today at ${result.properties['Reminder Time'].select?.name}`:'today',
        labels: isEmpty(labels),
        duration: result.properties['Duration']?.number || null,
        durationUnit: result.properties['Duration']?.number?"minute":null
      })})}).catch(error => console.log(error));


  for (let i = 0; i < tasks.length; i++) {
    await todoistApi.addTask(tasks[i]).then((task)=> console.log(task))
    .catch((error)=> console.log(error));
    console.log("Post done for ", tasks[i].content);
    results.push({
      task: tasks[i].content,
      status: "pushed",
    })
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

  /**
 * @param {Array} labels 
 * If array is empty returns null, if not returns the array
 * @returns null or the array itself
 */
function isEmpty(labels)
{
  return labels.length==0?null:labels
}
return results; 
}
