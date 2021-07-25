const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dpPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectIntoResponseObject = (dbObjectState) => {
  return {
    stateId: dbObjectState.state_id,
    stateName: dbObjectState.state_name,
    population: dbObjectState.population,
  };
};

const convertDistrictDbObjectIntoResponseObject = (dbObjectDistrict) => {
  return {
    districtId: dbObjectDistrict.district_id,
    districtName: dbObjectDistrict.district_name,
    stateId: dbObjectDistrict.state_id,
    cases: dbObjectDistrict.cases,
    cured: dbObjectDistrict.cured,
    active: dbObjectDistrict.active,
    deaths: dbObjectDistrict.deaths,
  };
};

/**API-1*/
app.get("/states/", async (request, response) => {
  const getMoviesQuery = `
    select *
    from state;`;
  const statedArray = await db.all(getMoviesQuery);
  response.send(
    statedArray.map((eachState) =>
      convertStateDbObjectIntoResponseObject(eachState)
    )
  );
});

/**API-2 */
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
        select *
        from state
        where 
            state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateDbObjectIntoResponseObject(state));
});

/**API-3*/
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
    insert into 
    district (state_id,district_name,cases,cured,active,deaths)
    values (
         ${stateId},
         "${districtName}",
         ${cases},
         ${cured},
         ${active},
         ${deaths});`;
  await db.run(addDistrictQuery);

  response.send("District Successfully Added");
});

/**API -4 */
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
        select *
        from district
        where 
            district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectIntoResponseObject(district));
});

/**API -5 */
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId} 
  `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

/**API-6 */
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

/**API-7 */
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    select
        sum(cases),
        sum(cured),
        sum(active),
        sum(deaths)
    from 
        district
    where
        state_id= ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["sum(cases)"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active)"],
    totalDeaths: stats["sum(deaths)"],
  });
});

/**API-8 */
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQueryUsingDistrictId = `
    select 
        state.state_name
    from 
        state natural join district
    where 
        district_id= ${districtId};`;
  const state = await db.get(getStateQueryUsingDistrictId);
  response.send({ stateName: state.state_name });
});

module.exports = app;
