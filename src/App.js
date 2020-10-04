import React, { useState } from "react";
import "./App.css";
import List from "./Component/List";
import withListLoading from "./Component/WithListLoading";
import axios from "axios";
import NeoVis from "neovis.js/dist/neovis.js";

function App() {
  const ListLoading = withListLoading(List);
  const [appState, setAppState] = useState({
    loading: false,
    repos: null,
  });
  const [name, setName] = useState("");
  const token = "Your token Id";

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setAppState({ loading: false });
    const neo4j = require("neo4j-driver");

    const driver = neo4j.driver(
      "bolt://localhost:7687",
      neo4j.auth.basic("neo4j", "1234")
    );
    //const session = driver.session();
    const personName = name;

    try {
      await axios
        .get(`https://api.github.com/users/${name}`, {
          headers: {
            Authorization: `token ${token}`,
          },
        })
        .then((users) => {
          const session = driver.session();
          session.run(
            "MERGE (a:Person {name: $name, followers: $followers}) RETURN a",
            {
              name: name,
              followers: users.data.followers,
              //              email: users.data.email,
            }
          );
        });

      //let allRepos = [];
      var reposData = [];
      const apiUrl = `https://api.github.com/users/${name}/repos?state=closed&access_token=${token}`;
      axios.get(apiUrl).then(async (repos) => {
        var data = repos.data;

        await data.forEach(async (allrepo) => {
          const session = driver.session(); // <<-- session is only visible inside the promise

          session
            .run(
              "MERGE (r:Repository {name: $name, fork_count : $forks , star_count :$star, primary_lang:$lang}) ",
              {
                name: allrepo.name,
                forks: allrepo.forks_count,
                star: allrepo.stargazers_count,
                lang: allrepo.language,
              }
            )
            .then(() => {
              session.close();
            })
            .catch(() => {
              session.close();
            });

          await Promise.all([
            axios
              .get(`${allrepo.contributors_url}`, {
                headers: {
                  Authorization: `token ${token}`,
                },
              })
              .then((contribution) => {
                if (allrepo.language != null) {
                  for (var y = 0; y < contribution.data.length; y++) {
                    if (allrepo.owner.login === contribution.data[y].login) {
                      allrepo.contri = contribution.data[y].contributions;
                      const session = driver.session();
                      session
                        .run(
                          " MATCH (a:Person),(b:Repository) WHERE a.name = $personame AND b.name = $reponame MERGE (a)-[r:CONTRIBUTED_IN { commits:$commit }]->(b) RETURN r",
                          {
                            reponame: allrepo.name,
                            personame: personName,
                            commit: contribution.data[y].contributions,
                          }
                        )
                        .then(() => {
                          session.close();
                        })
                        .catch(() => {
                          session.close();
                        });
                    }
                  }
                } else {
                  allrepo.contri = 0;
                }
              }),
            axios
              .get(`${allrepo.languages_url}`, {
                headers: {
                  Authorization: `token ${token}`,
                },
              })
              .then((lang) => {
                allrepo.languagesAll = lang.data;
                const session = driver.session();
                session
                  .run(
                    "MATCH (b:Repository { name: $name }) SET b.languages = $lang",
                    {
                      name: allrepo.name,
                      lang: JSON.stringify(lang.data).replaceAll('"', ""),
                    }
                  )
                  .then(() => {
                    session.close();
                  });
              }),
          ]);
          reposData.push(allrepo);
          if (reposData.length === data.length) {
            console.log(reposData);
            setAppState({ loading: false, repos: reposData });

            await session.close();
            await driver.close();

            var config = {
              container_id: "viz",
              server_url: "bolt://localhost:7687",
              server_user: "neo4j",
              server_password: "1234",
              initial_cypher:
                "MATCH (n:Person{name:'" +
                name +
                "'})-[r:CONTRIBUTED_IN]->(m) RETURN n,r,m",
              labels: {
                Person: {
                  caption: "name",
                },
                Repository: {
                  caption: "name",
                },
              },
              relationships: {
                CONTRIBUTED_IN: {
                  thickness: "commits",
                  caption: false,
                },
              },
            };

            var viz = new NeoVis(config);
            viz.render();
          }
        });
      });
    } finally {
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <label>
          GitHub Id:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <input type="submit" value="Submit" />
      </form>

      <div className="repo-container">
        <ListLoading isLoading={appState.loading} repos={appState.repos} />
      </div>
      <div id="viz"></div>
    </div>
  );
}
export default App;
