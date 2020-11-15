// API Consume

const api_token = 'cc0c7fb32cfc46f09c32e1a427cf496c';
const league_code = 2001; //Champions Leage
const base_url = 'https://api.football-data.org/v2/';
const team_endpoint = `${base_url}team/`;
const classement_endpoint = `${base_url}competitions/${league_code}/standings?standingType=TOTAL`;
const upcoming_matches_endpoint = `${base_url}competitions/${league_code}matches?status=SCHEDULED`;
const detail_matches_endpoint = `${base_url}matches/`;

const fetchApi = (url) => {
    return fetch(url, {
        headers: {
            'X-Auth-Token': api_token
        }
    });
}

const status = (response) => {
    if (response.status !== 200){
        console.log(`Error : ${response.status}`);
        return promise.reject(new Error(response.statusText));
    } else {
        return promise.resolve(response);
    }
}

const json = (response) => {
    return response.json();
}

const error = (error) => {
    console.log(`Error : ${error}`);
}

const getClassement = () => {
    if('caches' in window){
        caches.match(classement_endpoint).then((response) => {
            if (response){
                response.json().then((data) => {
                    resultClassementData(data);
                    console.dir(`getClassement ${data}`);
                });
            }
        });
    }

    fetchApi(classement_endpoint)
        .then(status)
        .then(json)
        .then((data) => {
            console.log(data);
            resultClassementData(data);
        })
        .catch(error);
}

const getTeamById = () => {
    return new promise((resolve, reject) => {
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get("id");

        const dataTeamHtml = '';
        const tableTeamHtml = '';

        if("caches" in window){
            caches.match(team_endpoint + idParam).then((response) => {
                if(response){
                    response.json().then((data) => {
                        resultTeamDetail(data);
                        data.squad.forEach((squad, index) => {
                            dataTeamJson = squad;
                            dataTeamHtml += `
                            <tr>
                                <td>
                                    <a href="./playerdetail.html?id=${squad.id}"> ${squad.name}</a>
                                </td>
                                <td>${squad.position}</td>
                            </tr>
                            `
                        });
                        tableTeamHtml += `
                            <table>
                                <tbody>
                                    ${dataTeamHtml}
                                </tbody>
                            </table>
                        `;
                        document.getElementById("team").innerHTML = tableTeamHtml;
                        resolve(data);
                    });
                }
            });
        }

        fetchApi(team_endpoint + idParam)
            .then(status)
            .then(json)
            .then((data) => {
                console.log(data);
                resultTeamDetail(data);
                dataTeam = data;
                data.squad.forEach((squad, index) => {
                    dataTeamJson = squad;
                    console.log(`Check Squad Name : ${squad.name}`);
                    console.log(`Check Squad Position : ${squad.position}`);
                    dataTeamHtml += `
                        <tr>
                            <td>
                                <a href="./playerdetail.html?id=${squad.id}"> ${squad.name}</a>
                            </td>
                            <td>${squad.position}</td>
                        </tr>
                    `
                });
                tableTeamHtml += `
                    <table>
                        <tbody>
                            ${dataTeamHtml}
                        </tbody>
                    </table>
                `;
                document.getElementById("squad").innerHTML = tableTeamHtml;
                resolve(data);
            })
            .catch(error);
    });
}

const getMatchByLeagueId = () => {
    return new Promise((resolve, reject) => {
        if("caches" in window){
            caches.match(upcoming_matches_endpoint).then((response) => {
                if(response){
                    response.json().then((data) => {
                        resultMatchJson(data);
                        resolve(data);
                    });
                }
            });
        }

        fetchApi(upcoming_matches_endpoint)
            .then(status)
            .then(json)
            .then((data) => {
                resultMatchJson(data);
                resolve(data);
            })
            .catch(error);
    });
}

const getDetailMatchById = () => {
    return new Promise((resolve, reject) => {
        // Ambil nilai query parameter (?id=)
        var urlParams = new URLSearchParams(window.location.search);
        var idParam = urlParams.get("id");
        var dataTeamHTML = ''
        var tabelTeamHTML = ''
        if ('caches' in window) {
          caches.match(detail_matches_endpoint + idParam).then((response) => {
            if (response) {
              response.json().then((data) => {
                resultDetailMatchJson(data);
                resolve(data)
              });
            }
          });
        }
        fetchApi(detail_matches_endpoint + idParam)
          .then(status)
          .then(json)
          .then((data) => {
            // Objek JavaScript dari response.json() masuk lewat variabel data.
            console.log(data);
            // Menyusun komponen card artikel secara dinamis
            resultDetailMatchJSON(data);
            resolve(data);
          })
          .catch(error);
      });
}

const getSavedMatchById = () => {
    // Ambil nilai query parameter (?id=)
    var urlParams = new URLSearchParams(window.location.search);
    var idParam = Number(urlParams.get("id"));
  
    getMatchesById(idParam).then((match) => {
      resultDetailMatchJSON(match);
    });
}