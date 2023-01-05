const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

function converttoobj(arr) {
  return {
    id: arr.id,
    todo: arr.todo,
    priority: arr.priority,
    status: arr.status,
  };
}

app.get("/todos/", async (request, response) => {
  let { search_q = "", priority = "", status = "" } = request.query;
  let q;
  if (search_q == "" && priority == "") {
    let n = status.replace("%20", " ");

    q = `select * from todo where status = '${n}';`;
  } else if (search_q == "" && status == "") {
    q = `select * from todo where priority = '${priority}';`;
  } else if (search_q == "") {
    let n1 = status.replace("%20", " ");
    q = `select * from todo where status = '${n1}' and priority = '${priority}';`;
  } else {
    q = `select * from todo where todo like '%${search_q}%';`;
  }

  let arr = await db.all(q);
  arr = arr.map((each) => {
    return {
      id: each.id,
      todo: each.todo,
      priority: each.priority,
      status: each.status,
    };
  });
  response.send(arr);
});

app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status } = request.body;

  let query = `insert into todo(id,todo, priority, status) values
    (${id},'${todo}','${priority}','${status}')`;
  let arr = await db.run(query);

  response.send("Todo Successfully Added");
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const q = `select * from todo where id = ${todoId};`;
  const arr = await db.get(q);

  response.send(converttoobj(arr));
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo = "", priority = "", status = "" } = request.body;
  let query;
  let arr;
  if (status != "") {
    query = `update todo set status='${status}';`;
    arr = await db.run(query);
    response.send("Status Updated");
  }
  if (priority != "") {
    query = `update todo set priority='${priority}';`;
    arr = await db.run(query);
    response.send("Priority Updated");
  }
  if (todo != "") {
    query = `update todo set todo='${todo}';`;
    arr = await db.run(query);
    response.send("Todo Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let query = `delete from todo where id = ${todoId};`;
  let arr = await db.run(query);

  response.send("Todo Deleted");
});

module.exports = app;
