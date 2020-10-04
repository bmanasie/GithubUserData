import React from "react";
const List = (props) => {
  const { repos } = props;
  if (!repos || repos.length === 0) return <p>No repos, sorry</p>;
  return (
    <div>
      <h2 className="list-head">Available Public Repositories</h2>
      <table id="repositories">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Star counts</th>
            <th>Fork counts</th>
            <th>Commits</th>
            <th>Languages</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => {
            if (repo.contri > 0) {
              console.log("i am in html");
              return (
                <tr key={repo.id}>
                  <td className="repo-text">{repo.name} </td>
                  <td className="repo-description">{repo.description}</td>
                  <td className="stargazers-count"> {repo.stargazers_count}</td>
                  <td className="forks-count"> {repo.forks_count}</td>
                  <td className="contributions"> {repo.contri}</td>
                  <td className="languages">
                    {" "}
                    {JSON.stringify(repo.languagesAll)
                      .replaceAll('"', "")
                      .replaceAll("{", "")
                      .replaceAll("}", "")}
                  </td>
                </tr>
              );
            } else {
              return null;
            }
          })}
        </tbody>
      </table>
    </div>
  );
};
export default List;
